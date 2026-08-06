import { Worker } from 'bullmq';

import { redis } from '../config/redis.js';
import config from '../config/env.js';
import logger from '../utilities/logger.js';
import STAGES from '../constants/stages.js';
import { JOB_STATUSES, DOCUMENT_STATUSES } from '../constants/index.js';
import { PIPELINE_QUEUE_NAME, pipelineQueue } from '../queues/pipeline.queue.js';
import { emitDocumentEvent } from '../socket/index.js';
import { parseDocumentFile } from '../parsers/document.parser.js';
import {
  buildTextEmbedding,
  classifyRole,
  extractCandidateNames,
  moodForScene,
  relationTypeForPair,
  sentimentForText,
  splitIntoScenes,
  summarize,
  traitsForName,
  wordCount,
} from '../analysis/local-analyzer.js';
import Document from '../models/document.model.js';
import Scene from '../models/scene.model.js';
import Character from '../models/character.model.js';
import Relationship from '../models/relationship.model.js';
import TimelineEvent from '../models/timeline-event.model.js';
import DialogueSummary from '../models/dialogue-summary.model.js';
import MoodAnalysis from '../models/mood-analysis.model.js';
import StoryArc from '../models/story-arc.model.js';
import ContinuityIssue from '../models/continuity-issue.model.js';
import Embedding from '../models/embedding.model.js';
import processingJobRepository from '../repositories/processing-job.repository.js';

const STAGE_DEPENDENCIES = {
  [STAGES.PARSING]: [],
  [STAGES.SCENES]: [STAGES.PARSING],
  [STAGES.CHARACTERS]: [STAGES.SCENES],
  [STAGES.RELATIONSHIPS]: [STAGES.CHARACTERS],
  [STAGES.TIMELINE]: [STAGES.SCENES],
  [STAGES.DIALOGUE]: [STAGES.SCENES, STAGES.CHARACTERS],
  [STAGES.MOOD]: [STAGES.SCENES],
  [STAGES.ARC]: [STAGES.CHARACTERS, STAGES.MOOD],
  [STAGES.CONTINUITY]: [STAGES.RELATIONSHIPS, STAGES.TIMELINE],
  [STAGES.EMBEDDINGS]: [STAGES.ARC, STAGES.DIALOGUE],
};

let worker = null;

const startPipelineWorker = (io) => {
  if (worker) return worker;

  worker = new Worker(PIPELINE_QUEUE_NAME, async (job) => processStage(job, io), {
    connection: redis,
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    logger.info(`Pipeline stage completed: ${job.name} for document ${job.data.documentId}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Pipeline stage failed: ${job?.name || 'unknown'} - ${err.message}`);
  });

  logger.info('SceneCraft pipeline worker started.');
  return worker;
};

const processStage = async (job) => {
  const { documentId, stage } = job.data;

  await markRunning(documentId, stage);

  try {
    const result = await runStage(job);
    await markCompleted(documentId, stage);
    await enqueueReadyStages(documentId);
    return result;
  } catch (err) {
    await markFailed(documentId, stage, err);
    throw err;
  }
};

const runStage = async (job) => {
  const { stage } = job.data;

  if (stage === STAGES.PARSING) return runParsing(job.data);
  if (stage === STAGES.SCENES) return runScenes(job.data);
  if (stage === STAGES.CHARACTERS) return runCharacters(job.data);
  if (stage === STAGES.RELATIONSHIPS) return runRelationships(job.data);
  if (stage === STAGES.TIMELINE) return runTimeline(job.data);
  if (stage === STAGES.DIALOGUE) return runDialogue(job.data);
  if (stage === STAGES.MOOD) return runMood(job.data);
  if (stage === STAGES.ARC) return runArc(job.data);
  if (stage === STAGES.CONTINUITY) return runContinuity(job.data);
  if (stage === STAGES.EMBEDDINGS) return runEmbeddings(job.data);

  throw new Error(`Unsupported pipeline stage: ${stage}`);
};

const markRunning = async (documentId, stage) => {
  const jobRecord = await processingJobRepository.updateOne(
    { documentId, stage },
    { status: JOB_STATUSES.RUNNING, progress: 10, error: null, startedAt: new Date() },
  );
  emitDocumentEvent(documentId, 'pipeline:stage-started', { stage, job: jobRecord });
};

const markCompleted = async (documentId, stage) => {
  const jobRecord = await processingJobRepository.updateOne(
    { documentId, stage },
    { status: JOB_STATUSES.COMPLETED, progress: 100, completedAt: new Date(), error: null },
  );
  emitDocumentEvent(documentId, 'pipeline:stage-completed', { stage, job: jobRecord });
};

const markFailed = async (documentId, stage, err) => {
  const jobRecord = await processingJobRepository.updateOne(
    { documentId, stage },
    { status: JOB_STATUSES.FAILED, error: err.message, completedAt: new Date() },
  );
  await Document.findByIdAndUpdate(documentId, { status: DOCUMENT_STATUSES.FAILED });
  emitDocumentEvent(documentId, 'pipeline:stage-failed', { stage, job: jobRecord, error: err.message });
};

const enqueueReadyStages = async (documentId) => {
  const jobs = await processingJobRepository.findByDocumentId(documentId);
  const byStage = new Map(jobs.map((item) => [item.stage, item]));

  for (const jobRecord of jobs) {
    if (jobRecord.status !== JOB_STATUSES.QUEUED) continue;
    const dependencies = STAGE_DEPENDENCIES[jobRecord.stage] || [];
    const ready = dependencies.every((dependency) => byStage.get(dependency)?.status === JOB_STATUSES.COMPLETED);
    if (!ready) continue;

    await pipelineQueue.add(
      jobRecord.stage,
      { documentId: documentId.toString(), stage: jobRecord.stage },
      { jobId: `${documentId}:${jobRecord.stage}` },
    );
  }

  const refreshed = await processingJobRepository.findByDocumentId(documentId);
  if (refreshed.every((item) => item.status === JOB_STATUSES.COMPLETED)) {
    await Document.findByIdAndUpdate(documentId, { status: DOCUMENT_STATUSES.READY });
    emitDocumentEvent(documentId, 'pipeline:document-ready', { status: DOCUMENT_STATUSES.READY });
  }
};

const getDocumentWithText = (documentId) => Document.findById(documentId).select('+parsedText');

const getScenesWithText = (documentId) => Scene.find({ documentId }).select('+rawText').sort({ sceneNumber: 1 });

const runParsing = async ({ documentId, storageUrl, fileType }) => {
  const doc = await getDocumentWithText(documentId);
  const parsedText = storageUrl ? await parseDocumentFile(storageUrl, fileType) : doc?.parsedText;
  const normalized = parsedText?.trim() || '';

  await Document.findByIdAndUpdate(documentId, {
    parsedText: normalized,
    wordCount: wordCount(normalized),
    status: DOCUMENT_STATUSES.PROCESSING,
  });

  return { wordCount: wordCount(normalized) };
};

const runScenes = async ({ documentId }) => {
  const doc = await getDocumentWithText(documentId);
  const scenes = splitIntoScenes(doc?.parsedText || '');

  await Scene.deleteMany({ documentId });
  if (scenes.length) {
    await Scene.insertMany(scenes.map((scene) => ({ ...scene, documentId })));
  }

  await Document.findByIdAndUpdate(documentId, { totalScenes: scenes.length });
  return { totalScenes: scenes.length };
};

const runCharacters = async ({ documentId }) => {
  const doc = await getDocumentWithText(documentId);
  const scenes = await getScenesWithText(documentId);
  const candidates = extractCandidateNames(doc?.parsedText || '');

  await Character.deleteMany({ documentId });

  const characters = await Character.insertMany(candidates.map((candidate, index) => {
    const sceneIds = scenes
      .filter((scene) => new RegExp(`\\b${escapeRegex(candidate.name)}\\b`, 'i').test(scene.rawText || ''))
      .map((scene) => scene._id);

    return {
      documentId,
      name: candidate.name,
      role: classifyRole(index, candidates.length),
      traits: traitsForName(candidate.name, doc?.parsedText || ''),
      description: `${candidate.name} appears in ${sceneIds.length} scene${sceneIds.length === 1 ? '' : 's'}.`,
      sceneIds,
    };
  }));

  for (const scene of scenes) {
    const characterIds = characters
      .filter((character) => new RegExp(`\\b${escapeRegex(character.name)}\\b`, 'i').test(scene.rawText || ''))
      .map((character) => character._id);
    await Scene.findByIdAndUpdate(scene._id, { characterIds });
  }

  return { totalCharacters: characters.length };
};

const runRelationships = async ({ documentId }) => {
  const scenes = await getScenesWithText(documentId);
  const characters = await Character.find({ documentId }).sort({ name: 1 });

  await Relationship.deleteMany({ documentId });

  const relationships = [];
  for (let i = 0; i < characters.length; i += 1) {
    for (let j = i + 1; j < characters.length; j += 1) {
      const a = characters[i];
      const b = characters[j];
      const sharedScenes = scenes.filter((scene) => {
        const text = scene.rawText || '';
        return text.includes(a.name) && text.includes(b.name);
      });
      if (!sharedScenes.length) continue;

      const combined = sharedScenes.map((scene) => scene.rawText).join('\n');
      relationships.push({
        documentId,
        characterAId: a._id,
        characterBId: b._id,
        type: relationTypeForPair(combined),
        sentimentScore: sentimentForText(combined),
        sentimentBySceneId: Object.fromEntries(sharedScenes.map((scene) => [scene._id.toString(), sentimentForText(scene.rawText)])),
        sceneIds: sharedScenes.map((scene) => scene._id),
      });
    }
  }

  if (relationships.length) await Relationship.insertMany(relationships);
  return { totalRelationships: relationships.length };
};

const runTimeline = async ({ documentId }) => {
  const scenes = await Scene.find({ documentId }).sort({ sceneNumber: 1 });
  await TimelineEvent.deleteMany({ documentId });

  if (scenes.length) {
    await TimelineEvent.insertMany(scenes.map((scene, index) => ({
      documentId,
      sceneId: scene._id,
      chronologicalOrder: index + 1,
      timeLabel: `Scene ${scene.sceneNumber}`,
      isFlashback: /\b(earlier|remembered|flashback|years ago)\b/i.test(scene.summary),
    })));
  }

  return { totalTimelineEvents: scenes.length };
};

const runDialogue = async ({ documentId }) => {
  const scenes = await getScenesWithText(documentId);
  const characters = await Character.find({ documentId });

  await DialogueSummary.deleteMany({ documentId });

  const summaries = [];
  for (const scene of scenes) {
    for (const character of characters) {
      if (!new RegExp(`\\b${escapeRegex(character.name)}\\b`, 'i').test(scene.rawText || '')) continue;
      summaries.push({
        documentId,
        sceneId: scene._id,
        characterId: character._id,
        summaryText: summarize(scene.rawText, 1),
        keyQuotes: extractQuotesForCharacter(scene.rawText, character.name),
        tone: moodForScene(scene.rawText).primaryMood,
      });
    }
  }

  if (summaries.length) await DialogueSummary.insertMany(summaries);
  return { totalDialogueSummaries: summaries.length };
};

const runMood = async ({ documentId }) => {
  const scenes = await getScenesWithText(documentId);
  await MoodAnalysis.deleteMany({ documentId });

  if (scenes.length) {
    await MoodAnalysis.insertMany(scenes.map((scene) => ({
      documentId,
      sceneId: scene._id,
      ...moodForScene(scene.rawText || scene.summary),
    })));
  }

  return { totalMoodRecords: scenes.length };
};

const runArc = async ({ documentId }) => {
  const scenes = await Scene.find({ documentId }).sort({ sceneNumber: 1 });
  const moods = await MoodAnalysis.find({ documentId });
  const moodByScene = new Map(moods.map((mood) => [mood.sceneId.toString(), mood]));

  const arcPoints = scenes.map((scene, index) => {
    const positionBoost = scenes.length <= 1 ? 50 : Math.round((index / (scenes.length - 1)) * 35);
    const mood = moodByScene.get(scene._id.toString());
    const tensionScore = Math.min(100, Math.round((mood?.intensity || 0.25) * 65 + positionBoost));
    return { sceneId: scene._id, tensionScore, label: scene.title };
  });

  const climax = [...arcPoints].sort((a, b) => b.tensionScore - a.tensionScore)[0];
  await StoryArc.findOneAndUpdate(
    { documentId },
    { documentId, arcPoints, climaxSceneId: climax?.sceneId || null },
    { upsert: true, new: true, runValidators: true },
  );

  return { totalArcPoints: arcPoints.length };
};

const runContinuity = async ({ documentId }) => {
  const scenes = await getScenesWithText(documentId);
  await ContinuityIssue.deleteMany({ documentId });

  const issues = [];
  scenes.forEach((scene, index) => {
    const text = scene.rawText || '';
    if (/\bdead\b/i.test(text)) {
      const laterScene = scenes.slice(index + 1).find((candidate) => candidate.rawText && candidate.rawText.match(NAME_PATTERN_FROM_TEXT(text)));
      if (laterScene) {
        issues.push({
          documentId,
          type: 'timeline-conflict',
          description: `A possible death or disappearance in ${scene.title} may need continuity review later in the story.`,
          sceneIds: [scene._id, laterScene._id],
          severity: 'medium',
        });
      }
    }
  });

  if (!scenes.length) {
    issues.push({
      documentId,
      type: 'unexplained-gap',
      description: 'No scenes were detected, so continuity could not be checked.',
      sceneIds: [],
      severity: 'high',
    });
  }

  if (issues.length) await ContinuityIssue.insertMany(issues);
  return { totalContinuityIssues: issues.length };
};

const runEmbeddings = async ({ documentId }) => {
  const scenes = await Scene.find({ documentId }).select('+rawText');
  const characters = await Character.find({ documentId });
  const dialogue = await DialogueSummary.find({ documentId });

  await Embedding.deleteMany({ documentId });

  const embeddings = [
    ...scenes.map((scene) => ({
      documentId,
      sourceType: 'scene',
      sourceId: scene._id,
      vector: buildTextEmbedding(`${scene.title} ${scene.summary} ${scene.rawText}`),
      model: config.ai.embeddingModel,
    })),
    ...characters.map((character) => ({
      documentId,
      sourceType: 'character',
      sourceId: character._id,
      vector: buildTextEmbedding(`${character.name} ${character.description} ${character.traits.join(' ')}`),
      model: config.ai.embeddingModel,
    })),
    ...dialogue.map((item) => ({
      documentId,
      sourceType: 'dialogue_summary',
      sourceId: item._id,
      vector: buildTextEmbedding(`${item.summaryText} ${item.keyQuotes.join(' ')} ${item.tone}`),
      model: config.ai.embeddingModel,
    })),
  ];

  if (embeddings.length) await Embedding.insertMany(embeddings);
  return { totalEmbeddings: embeddings.length };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractQuotesForCharacter = (text = '', name) => {
  const quoteRegex = /"([^"]{4,180})"/g;
  return [...text.matchAll(quoteRegex)]
    .map((match) => match[1])
    .filter((quote) => quote.toLowerCase().includes(name.toLowerCase()) || quote.length < 120)
    .slice(0, 3);
};

const NAME_PATTERN_FROM_TEXT = (text) => {
  const firstName = text.match(/\b[A-Z][a-z]+\b/)?.[0];
  return firstName ? new RegExp(`\\b${escapeRegex(firstName)}\\b`) : /$a/;
};

export { startPipelineWorker };

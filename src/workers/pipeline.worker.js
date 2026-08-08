import { Worker } from 'bullmq';
import Joi from 'joi';

import { redis } from '../config/redis.js';
import config from '../config/env.js';
import logger from '../utilities/logger.js';
import STAGES, { STAGE_DEPENDENCIES } from '../constants/stages.js';
import { JOB_STATUSES, DOCUMENT_STATUSES } from '../constants/index.js';
import { PIPELINE_QUEUE_NAME, pipelineQueue } from '../queues/pipeline.queue.js';
import { emitDocumentEvent } from '../socket/index.js';
import { parseDocumentFile } from '../parsers/document.parser.js';
import { generateJSON, embedText } from '../services/ai-provider.service.js';
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

// STAGE_DEPENDENCIES imported from constants/stages.js — single source of truth.

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

    // Read dependsOn from the DB record — seeded at upload time from STAGE_DEPENDENCIES.
    // Falls back to the in-memory constant only if the field is absent (e.g. legacy records).
    const dependencies = jobRecord.dependsOn?.length
      ? jobRecord.dependsOn
      : (STAGE_DEPENDENCIES[jobRecord.stage] || []);

    const ready = dependencies.every(
      (dep) => byStage.get(dep)?.status === JOB_STATUSES.COMPLETED,
    );
    if (!ready) continue;

    await pipelineQueue.add(
      jobRecord.stage,
      { documentId: documentId.toString(), stage: jobRecord.stage },
      { jobId: `${documentId}-${jobRecord.stage}` },
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
  if (config.ai.provider === 'local') {
    const doc = await getDocumentWithText(documentId);
    const scenes = splitIntoScenes(doc?.parsedText || '');

    await Scene.deleteMany({ documentId });
    if (scenes.length) {
      await Scene.insertMany(scenes.map((scene) => ({ ...scene, documentId })));
    }

    await Document.findByIdAndUpdate(documentId, { totalScenes: scenes.length });
    return { totalScenes: scenes.length };
  }

  const doc = await getDocumentWithText(documentId);
  const parsedText = doc?.parsedText || '';
  if (!parsedText.trim()) {
    await Scene.deleteMany({ documentId });
    await Document.findByIdAndUpdate(documentId, { totalScenes: 0 });
    return { totalScenes: 0 };
  }

  const prompt = `Analyze the following story text and break it down into consecutive scenes.
For each scene, extract the scene number, a short title, a 2-sentence summary, the primary location, and the exact text corresponding to this scene from the original text (sceneText).

Story text:
${parsedText}`;

  const schemaHint = {
    type: 'ARRAY',
    description: 'List of consecutive scenes detected in the text.',
    items: {
      type: 'OBJECT',
      properties: {
        sceneNumber: { type: 'INTEGER' },
        title: { type: 'STRING' },
        summary: { type: 'STRING', description: 'A 2-sentence summary of the scene.' },
        location: { type: 'STRING', description: 'The location where the scene takes place.' },
        sceneText: { type: 'STRING', description: 'The exact text corresponding to this scene from the original text.' },
      },
      required: ['sceneNumber', 'title', 'summary', 'location', 'sceneText'],
    },
  };

  const rawScenes = await generateJSON(prompt, schemaHint);

  const schemaJoi = Joi.array().items(
    Joi.object({
      sceneNumber: Joi.number().integer().required(),
      title: Joi.string().required(),
      summary: Joi.string().required(),
      location: Joi.string().allow('').default(''),
      sceneText: Joi.string().required(),
    })
  ).required();

  const { value: validatedScenes, error } = schemaJoi.validate(rawScenes);
  if (error) {
    throw new Error(`Scene breakdown validation failed: ${error.message}`);
  }

  let lastIndex = 0;
  const processedScenes = [];
  for (const scene of validatedScenes) {
    const sceneText = scene.sceneText;
    let start = parsedText.indexOf(sceneText, lastIndex);
    if (start === -1) {
      start = parsedText.indexOf(sceneText);
    }
    const safeStart = start !== -1 ? start : lastIndex;
    const end = safeStart + sceneText.length;
    lastIndex = end;

    processedScenes.push({
      documentId,
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      summary: scene.summary,
      location: scene.location,
      textRange: { start: safeStart, end },
      wordCount: wordCount(sceneText),
      rawText: sceneText,
    });
  }

  await Scene.deleteMany({ documentId });
  if (processedScenes.length) {
    await Scene.insertMany(processedScenes);
  }

  await Document.findByIdAndUpdate(documentId, { totalScenes: processedScenes.length });
  return { totalScenes: processedScenes.length };
};

const runCharacters = async ({ documentId }) => {
  if (config.ai.provider === 'local') {
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
  }

  const doc = await getDocumentWithText(documentId);
  const scenes = await getScenesWithText(documentId);
  const parsedText = doc?.parsedText || '';

  const prompt = `Analyze the following text and identify all characters.
For each character:
1. Provide their primary name.
2. Provide an array of aliases or other names they are referred to by (merge duplicates).
3. Classify their role as 'protagonist', 'antagonist', or 'supporting' based on narrative prominence.
4. List their traits (personality/physical).
5. Provide a description of who they are in the story.
6. Provide an arcSummary (narrative trajectory/growth).

Story text:
${parsedText}`;

  const schemaHint = {
    type: 'ARRAY',
    description: 'List of characters extracted from the story.',
    items: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        aliases: { type: 'ARRAY', items: { type: 'STRING' } },
        role: { type: 'STRING', enum: ['protagonist', 'antagonist', 'supporting'] },
        traits: { type: 'ARRAY', items: { type: 'STRING' } },
        description: { type: 'STRING' },
        arcSummary: { type: 'STRING' },
      },
      required: ['name', 'aliases', 'role', 'traits', 'description', 'arcSummary'],
    },
  };

  const rawCharacters = await generateJSON(prompt, schemaHint);

  const characterJoi = Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      aliases: Joi.array().items(Joi.string()).default([]),
      role: Joi.string().valid('protagonist', 'antagonist', 'supporting').default('supporting'),
      traits: Joi.array().items(Joi.string()).default([]),
      description: Joi.string().allow('').default(''),
      arcSummary: Joi.string().allow('').default(''),
    })
  ).required();

  const { value: validatedCharacters, error } = characterJoi.validate(rawCharacters);
  if (error) {
    throw new Error(`Character extraction validation failed: ${error.message}`);
  }

  await Character.deleteMany({ documentId });

  const charactersToInsert = validatedCharacters.map((candidate) => {
    const sceneIds = scenes
      .filter((scene) => {
        const text = scene.rawText || '';
        const nameMatch = new RegExp(`\\b${escapeRegex(candidate.name)}\\b`, 'i').test(text);
        const aliasMatch = candidate.aliases?.some((alias) => new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i').test(text));
        return nameMatch || aliasMatch;
      })
      .map((scene) => scene._id);

    return {
      documentId,
      name: candidate.name,
      aliases: candidate.aliases,
      role: candidate.role,
      traits: candidate.traits,
      description: candidate.description,
      arcSummary: candidate.arcSummary,
      sceneIds,
    };
  });

  const insertedCharacters = await Character.insertMany(charactersToInsert);

  for (const scene of scenes) {
    const characterIds = insertedCharacters
      .filter((char) => {
        const text = scene.rawText || '';
        const nameMatch = new RegExp(`\\b${escapeRegex(char.name)}\\b`, 'i').test(text);
        const aliasMatch = char.aliases?.some((alias) => new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i').test(text));
        return nameMatch || aliasMatch;
      })
      .map((char) => char._id);
    await Scene.findByIdAndUpdate(scene._id, { characterIds });
  }

  return { totalCharacters: insertedCharacters.length };
};

const runRelationships = async ({ documentId }) => {
  if (config.ai.provider === 'local') {
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
  }

  const scenes = await getScenesWithText(documentId);
  const characters = await Character.find({ documentId }).sort({ name: 1 });

  await Relationship.deleteMany({ documentId });

  if (!characters.length || !scenes.length) {
    return { totalRelationships: 0 };
  }

  const doc = await getDocumentWithText(documentId);
  const parsedText = doc?.parsedText || '';

  const prompt = `Analyze the relationships between the characters in this story.
Characters list: ${characters.map((c) => c.name).join(', ')}

For each pair of characters that interact in the story:
1. Identify character A and character B.
2. Classify their relationship type as one of: 'romantic', 'family', 'rival', 'mentor', 'ally', or 'other'.
3. Assign a overall sentiment score between -1.0 (extremely negative/hostile) and 1.0 (extremely positive/supportive).
4. Provide a list of scenes in which they interact, indicating the scene ID, a sentiment score (between -1.0 and 1.0) and a brief justification.

Scenes list:
${scenes.map((s) => `Scene ${s.sceneNumber}: "${s.title}" (ID: ${s._id})`).join('\n')}
`;

  const schemaHint = {
    type: 'ARRAY',
    description: 'List of relationships between characters.',
    items: {
      type: 'OBJECT',
      properties: {
        characterAName: { type: 'STRING' },
        characterBName: { type: 'STRING' },
        type: { type: 'STRING', enum: ['romantic', 'family', 'rival', 'mentor', 'ally', 'other'] },
        sentimentScore: { type: 'NUMBER' },
        interactions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              sceneId: { type: 'STRING' },
              sentimentScore: { type: 'NUMBER' },
              justification: { type: 'STRING' },
            },
            required: ['sceneId', 'sentimentScore', 'justification'],
          },
        },
      },
      required: ['characterAName', 'characterBName', 'type', 'sentimentScore', 'interactions'],
    },
  };

  const rawRelationships = await generateJSON(prompt, schemaHint);

  const relationshipJoi = Joi.array().items(
    Joi.object({
      characterAName: Joi.string().required(),
      characterBName: Joi.string().required(),
      type: Joi.string().valid('romantic', 'family', 'rival', 'mentor', 'ally', 'other').default('other'),
      sentimentScore: Joi.number().min(-1).max(1).default(0),
      interactions: Joi.array().items(
        Joi.object({
          sceneId: Joi.string().required(),
          sentimentScore: Joi.number().min(-1).max(1).required(),
          justification: Joi.string().allow('').default(''),
        })
      ).default([]),
    })
  ).required();

  const { value: validatedRelationships, error } = relationshipJoi.validate(rawRelationships);
  if (error) {
    throw new Error(`Relationships validation failed: ${error.message}`);
  }

  const nameToCharMap = new Map(characters.map((c) => [c.name.toLowerCase(), c]));
  for (const char of characters) {
    if (char.aliases) {
      for (const alias of char.aliases) {
        nameToCharMap.set(alias.toLowerCase(), char);
      }
    }
  }

  const relationshipsToInsert = [];
  for (const rel of validatedRelationships) {
    const charA = nameToCharMap.get(rel.characterAName.toLowerCase());
    const charB = nameToCharMap.get(rel.characterBName.toLowerCase());
    if (!charA || !charB) continue;

    const sentimentBySceneId = new Map();
    const sceneIds = [];
    for (const inter of rel.interactions) {
      sentimentBySceneId.set(inter.sceneId, inter.sentimentScore);
      sceneIds.push(inter.sceneId);
    }

    relationshipsToInsert.push({
      documentId,
      characterAId: charA._id,
      characterBId: charB._id,
      type: rel.type,
      sentimentScore: rel.sentimentScore,
      sentimentBySceneId,
      sceneIds,
    });
  }

  if (relationshipsToInsert.length) {
    await Relationship.insertMany(relationshipsToInsert);
  }

  return { totalRelationships: relationshipsToInsert.length };
};

const runTimeline = async ({ documentId }) => {
  if (config.ai.provider === 'local') {
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
  }

  const scenes = await Scene.find({ documentId }).sort({ sceneNumber: 1 });
  await TimelineEvent.deleteMany({ documentId });

  if (!scenes.length) {
    return { totalTimelineEvents: 0 };
  }

  const prompt = `Analyze the narrative timeline of the following scenes.
Identify any time markers (e.g. "two days later", "in 1999", "ten years ago") and determine the chronological order of the scenes (which might be different from their sceneNumber order). Also detect if each scene is a flashback.

Scenes list:
${scenes.map((s) => `Scene ${s.sceneNumber}: "${s.title}" (ID: ${s._id})\nSummary: ${s.summary}`).join('\n')}
`;

  const schemaHint = {
    type: 'ARRAY',
    description: 'Chronological ordering and flashback analysis of scenes.',
    items: {
      type: 'OBJECT',
      properties: {
        sceneId: { type: 'STRING' },
        chronologicalOrder: { type: 'INTEGER' },
        timeLabel: { type: 'STRING' },
        isFlashback: { type: 'BOOLEAN' },
      },
      required: ['sceneId', 'chronologicalOrder', 'timeLabel', 'isFlashback'],
    },
  };

  const rawTimeline = await generateJSON(prompt, schemaHint);

  const timelineJoi = Joi.array().items(
    Joi.object({
      sceneId: Joi.string().required(),
      chronologicalOrder: Joi.number().integer().required(),
      timeLabel: Joi.string().allow('').default(''),
      isFlashback: Joi.boolean().default(false),
    })
  ).required();

  const { value: validatedTimeline, error } = timelineJoi.validate(rawTimeline);
  if (error) {
    throw new Error(`Timeline validation failed: ${error.message}`);
  }

  const timelineEventsToInsert = validatedTimeline.map((item) => ({
    documentId,
    sceneId: item.sceneId,
    chronologicalOrder: item.chronologicalOrder,
    timeLabel: item.timeLabel,
    isFlashback: item.isFlashback,
  }));

  if (timelineEventsToInsert.length) {
    await TimelineEvent.insertMany(timelineEventsToInsert);
  }

  return { totalTimelineEvents: timelineEventsToInsert.length };
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
  if (config.ai.provider === 'local') {
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
  }

  const scenes = await getScenesWithText(documentId);
  await MoodAnalysis.deleteMany({ documentId });

  const moodRecords = [];
  for (const scene of scenes) {
    const prompt = `Analyze the mood and emotions in the following scene.
Scene: "${scene.title}"
Text:
${scene.rawText}

Analyze:
1. The primary mood of the scene (e.g. tense, joyful, melancholy, peaceful, etc.).
2. The intensity of this mood on a scale from 0.0 (low) to 1.0 (high).
3. A set of specific emotion categories (e.g. joy, tension, sadness, mystery, anger, fear) with intensity scores from 0.0 to 1.0.`;

    const schemaHint = {
      type: 'OBJECT',
      properties: {
        primaryMood: { type: 'STRING' },
        intensity: { type: 'NUMBER' },
        emotions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              emotion: { type: 'STRING' },
              score: { type: 'NUMBER' },
            },
            required: ['emotion', 'score'],
          },
        },
      },
      required: ['primaryMood', 'intensity', 'emotions'],
    };

    const rawMood = await generateJSON(prompt, schemaHint);

    const moodJoi = Joi.object({
      primaryMood: Joi.string().required(),
      intensity: Joi.number().min(0).max(1).required(),
      emotions: Joi.array().items(
        Joi.object({
          emotion: Joi.string().required(),
          score: Joi.number().min(0).max(1).required(),
        })
      ).required(),
    }).required();

    const { value: validatedMood, error } = moodJoi.validate(rawMood);
    if (error) {
      throw new Error(`Mood validation failed for scene ${scene.sceneNumber}: ${error.message}`);
    }

    const emotionScores = new Map();
    for (const item of validatedMood.emotions) {
      emotionScores.set(item.emotion.toLowerCase(), item.score);
    }

    moodRecords.push({
      documentId,
      sceneId: scene._id,
      primaryMood: validatedMood.primaryMood,
      intensity: validatedMood.intensity,
      emotionScores,
    });
  }

  if (moodRecords.length) {
    await MoodAnalysis.insertMany(moodRecords);
  }

  return { totalMoodRecords: moodRecords.length };
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
  if (config.ai.provider === 'local') {
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
  }

  const scenes = await getScenesWithText(documentId);
  const characters = await Character.find({ documentId });
  await ContinuityIssue.deleteMany({ documentId });

  if (!scenes.length) {
    await ContinuityIssue.create({
      documentId,
      type: 'unexplained-gap',
      description: 'No scenes were detected, so continuity could not be checked.',
      sceneIds: [],
      severity: 'high',
    });
    return { totalContinuityIssues: 1 };
  }

  const prompt = `Analyze the following story scenes for continuity errors.
For each character in the list, track their attributes (status e.g. alive/dead/injured, age, appearance, possessions) across the scenes.
Flag any contradictions, timeline conflicts, or unexplained gaps.

Characters:
${characters.map((c) => `- ${c.name}`).join('\n')}

Scenes:
${scenes.map((s) => `Scene ${s.sceneNumber}: "${s.title}" (ID: ${s._id})\nText:\n${s.rawText}`).join('\n\n')}
`;

  const schemaHint = {
    type: 'ARRAY',
    description: 'List of continuity issues found.',
    items: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', enum: ['attribute-conflict', 'timeline-conflict', 'unexplained-gap'] },
        description: { type: 'STRING' },
        sceneIds: { type: 'ARRAY', items: { type: 'STRING' } },
        severity: { type: 'STRING', enum: ['low', 'medium', 'high'] },
      },
      required: ['type', 'description', 'sceneIds', 'severity'],
    },
  };

  const rawIssues = await generateJSON(prompt, schemaHint);

  const continuityJoi = Joi.array().items(
    Joi.object({
      type: Joi.string().valid('attribute-conflict', 'timeline-conflict', 'unexplained-gap').required(),
      description: Joi.string().required(),
      sceneIds: Joi.array().items(Joi.string()).default([]),
      severity: Joi.string().valid('low', 'medium', 'high').default('medium'),
    })
  ).required();

  const { value: validatedIssues, error } = continuityJoi.validate(rawIssues);
  if (error) {
    throw new Error(`Continuity validation failed: ${error.message}`);
  }

  const issuesToInsert = validatedIssues.map((issue) => ({
    documentId,
    type: issue.type,
    description: issue.description,
    sceneIds: issue.sceneIds,
    severity: issue.severity,
  }));

  if (issuesToInsert.length) {
    await ContinuityIssue.insertMany(issuesToInsert);
  }

  return { totalContinuityIssues: issuesToInsert.length };
};

const runEmbeddings = async ({ documentId }) => {
  if (config.ai.provider === 'local') {
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
  }

  const scenes = await Scene.find({ documentId }).select('+rawText');
  const characters = await Character.find({ documentId });
  const dialogue = await DialogueSummary.find({ documentId });

  await Embedding.deleteMany({ documentId });

  const itemsToEmbed = [
    ...scenes.map((scene) => ({
      sourceType: 'scene',
      sourceId: scene._id,
      text: `${scene.title} ${scene.summary} ${scene.rawText || ''}`,
    })),
    ...characters.map((character) => ({
      sourceType: 'character',
      sourceId: character._id,
      text: `${character.name} ${character.description || ''} ${(character.traits || []).join(' ')}`,
    })),
    ...dialogue.map((item) => ({
      sourceType: 'dialogue_summary',
      sourceId: item._id,
      text: `${item.summaryText} ${(item.keyQuotes || []).join(' ')} ${item.tone || ''}`,
    })),
  ];

  const embeddings = [];
  for (const item of itemsToEmbed) {
    if (!item.text.trim()) continue;
    const vector = await embedText(item.text);
    embeddings.push({
      documentId,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      vector,
      model: config.ai.embeddingModel || 'text-embedding-004',
    });
  }

  if (embeddings.length) {
    await Embedding.insertMany(embeddings);
  }
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

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of',
  'he', 'she', 'it', 'they', 'we', 'you', 'i', 'his', 'her', 'its', 'their', 'our', 'your', 'my',
  'him', 'them', 'us', 'me', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which',
  'what', 'why', 'how', 'when', 'where', 'then', 'there', 'here', 'now', 'so',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'no', 'not',
  'yes', 'ok', 'okay', 'well', 'though', 'although', 'if', 'unless', 'until', 'since',
  'because', 'as', 'than', 'up', 'down', 'out', 'in', 'into', 'over', 'under', 'again', 'once',
  'one', 'two', 'three', 'first', 'second', 'third'
]);

const NAME_PATTERN_FROM_TEXT = (text) => {
  const candidates = text.match(/\b[A-Z][a-z]+\b/g) || [];
  const firstName = candidates.find(c => !STOPWORDS.has(c.toLowerCase()));
  return firstName ? new RegExp(`\\b${escapeRegex(firstName)}\\b`, 'i') : /$a/;
};

export { startPipelineWorker };

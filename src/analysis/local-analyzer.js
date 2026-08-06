const SENTENCE_SPLIT = /(?<=[.!?])\s+/;
const SCENE_BREAK = /\n\s*(?:#{1,3}\s+.+|chapter\s+\w+|scene\s+\w+|\*{3,}|-{3,})\s*\n/gi;
const NAME_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;

const STOP_NAMES = new Set([
  'A', 'An', 'And', 'As', 'At', 'But', 'By', 'Chapter', 'He', 'Her', 'His', 'I',
  'In', 'It', 'On', 'Scene', 'She', 'The', 'They', 'This', 'We', 'When', 'You',
]);

const MOODS = [
  { name: 'tense', words: ['danger', 'fear', 'fight', 'blood', 'threat', 'panic', 'angry', 'storm'] },
  { name: 'hopeful', words: ['hope', 'light', 'smile', 'safe', 'promise', 'future', 'relief'] },
  { name: 'melancholy', words: ['alone', 'loss', 'silence', 'tears', 'gone', 'empty', 'grief'] },
  { name: 'romantic', words: ['love', 'kiss', 'heart', 'touch', 'warm', 'tender'] },
  { name: 'mysterious', words: ['secret', 'shadow', 'unknown', 'whisper', 'hidden', 'strange'] },
];

const normalizeText = (text = '') => text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const wordCount = (text = '') => (text.match(/\b[\w'-]+\b/g) || []).length;

const summarize = (text = '', maxSentences = 2) => {
  const sentences = text.trim().split(SENTENCE_SPLIT).filter(Boolean);
  return sentences.slice(0, maxSentences).join(' ').slice(0, 600) || 'No summary available.';
};

const splitIntoScenes = (rawText = '') => {
  const text = normalizeText(rawText);
  if (!text) return [];

  const explicitParts = text.split(SCENE_BREAK).map((part) => part.trim()).filter(Boolean);
  const parts = explicitParts.length > 1 ? explicitParts : chunkByParagraphs(text, 900);

  let cursor = 0;
  return parts.map((part, index) => {
    const start = text.indexOf(part, cursor);
    const safeStart = start >= 0 ? start : cursor;
    const end = safeStart + part.length;
    cursor = end;

    return {
      sceneNumber: index + 1,
      title: deriveSceneTitle(part, index + 1),
      summary: summarize(part),
      location: deriveLocation(part),
      textRange: { start: safeStart, end },
      wordCount: wordCount(part),
      rawText: part,
    };
  });
};

const chunkByParagraphs = (text, targetWords) => {
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const chunks = [];
  let current = [];
  let currentWords = 0;

  for (const paragraph of paragraphs.length ? paragraphs : [text]) {
    current.push(paragraph);
    currentWords += wordCount(paragraph);
    if (currentWords >= targetWords) {
      chunks.push(current.join('\n\n'));
      current = [];
      currentWords = 0;
    }
  }

  if (current.length) chunks.push(current.join('\n\n'));
  return chunks;
};

const deriveSceneTitle = (text, sceneNumber) => {
  const firstLine = text.split('\n').find((line) => line.trim().length > 0) || '';
  const cleaned = firstLine.replace(/^#+\s*/, '').trim();
  if (cleaned.length > 8 && cleaned.length <= 80) return cleaned;
  return `Scene ${sceneNumber}`;
};

const deriveLocation = (text) => {
  const match = text.match(/\b(?:in|at|inside|outside|near)\s+the\s+([A-Za-z][A-Za-z\s'-]{2,40})/i);
  return match ? match[1].trim().replace(/[,.!?].*$/, '') : '';
};

const extractCandidateNames = (text = '') => {
  const counts = new Map();
  for (const match of text.matchAll(NAME_PATTERN)) {
    const name = match[0].trim();
    if (STOP_NAMES.has(name) || /^\d/.test(name)) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([name, count]) => ({ name, count }));
};

const classifyRole = (index, total) => {
  if (index === 0) return 'protagonist';
  if (total > 2 && index === 1) return 'antagonist';
  return 'supporting';
};

const traitsForName = (name, text) => {
  const lower = text.toLowerCase();
  const traits = [];
  if (lower.includes(`${name.toLowerCase()} said`)) traits.push('vocal');
  if (lower.includes(`${name.toLowerCase()} ran`) || lower.includes(`${name.toLowerCase()} fought`)) traits.push('active');
  if (lower.includes(`${name.toLowerCase()} thought`) || lower.includes(`${name.toLowerCase()} wondered`)) traits.push('reflective');
  return traits.length ? traits : ['present'];
};

const moodForScene = (text = '') => {
  const lower = text.toLowerCase();
  const scored = MOODS.map((mood) => ({
    mood,
    score: mood.words.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score);

  const winner = scored[0];
  const intensity = Math.min(1, Math.max(0.15, winner.score / 5));
  return {
    primaryMood: winner.score > 0 ? winner.mood.name : 'neutral',
    emotionScores: {
      joy: winner.mood.name === 'hopeful' ? intensity : 0.15,
      tension: winner.mood.name === 'tense' ? intensity : 0.25,
      sadness: winner.mood.name === 'melancholy' ? intensity : 0.1,
      mystery: winner.mood.name === 'mysterious' ? intensity : 0.1,
    },
    intensity,
  };
};

const relationTypeForPair = (text = '') => {
  const lower = text.toLowerCase();
  if (lower.includes('love') || lower.includes('kiss')) return 'romantic';
  if (lower.includes('father') || lower.includes('mother') || lower.includes('brother') || lower.includes('sister')) return 'family';
  if (lower.includes('enemy') || lower.includes('rival') || lower.includes('fight')) return 'rival';
  if (lower.includes('teacher') || lower.includes('mentor')) return 'mentor';
  if (lower.includes('friend') || lower.includes('together')) return 'ally';
  return 'other';
};

const sentimentForText = (text = '') => {
  const lower = text.toLowerCase();
  const positive = ['smile', 'hope', 'friend', 'love', 'safe', 'laugh'].filter((word) => lower.includes(word)).length;
  const negative = ['fear', 'angry', 'enemy', 'fight', 'blood', 'hate'].filter((word) => lower.includes(word)).length;
  return Math.max(-1, Math.min(1, (positive - negative) / 4));
};

const hashToken = (token, dimensions) => {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = ((hash << 5) - hash) + token.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % dimensions;
};

const buildTextEmbedding = (text = '', dimensions = 64) => {
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = text.toLowerCase().match(/\b[a-z0-9'-]{2,}\b/g) || [];
  for (const token of tokens) {
    vector[hashToken(token, dimensions)] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
};

const cosineSimilarity = (a = [], b = []) => {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

export {
  buildTextEmbedding,
  cosineSimilarity,
  extractCandidateNames,
  moodForScene,
  relationTypeForPair,
  sentimentForText,
  splitIntoScenes,
  summarize,
  traitsForName,
  wordCount,
  classifyRole,
};

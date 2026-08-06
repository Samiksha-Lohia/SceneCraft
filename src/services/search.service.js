import characterRepository from '../repositories/character.repository.js';
import dialogueSummaryRepository from '../repositories/dialogue-summary.repository.js';
import embeddingRepository from '../repositories/embedding.repository.js';
import sceneRepository from '../repositories/scene.repository.js';
import { buildTextEmbedding, cosineSimilarity } from '../analysis/local-analyzer.js';

const hydrateResult = async (embedding, score) => {
  let source = null;

  if (embedding.sourceType === 'scene') {
    source = await sceneRepository.findById(embedding.sourceId);
  } else if (embedding.sourceType === 'character') {
    source = await characterRepository.findById(embedding.sourceId);
  } else if (embedding.sourceType === 'dialogue_summary') {
    source = await dialogueSummaryRepository.findById(embedding.sourceId);
  }

  return {
    sourceType: embedding.sourceType,
    sourceId: embedding.sourceId,
    score,
    source,
  };
};

const semanticSearch = async (documentId, query, limit = 10) => {
  const queryVector = buildTextEmbedding(query);
  const embeddings = await embeddingRepository.findByDocumentId(documentId);

  const ranked = embeddings
    .map((embedding) => ({
      embedding,
      score: cosineSimilarity(queryVector, embedding.vector),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return Promise.all(ranked.map((item) => hydrateResult(item.embedding, item.score)));
};

export { semanticSearch };

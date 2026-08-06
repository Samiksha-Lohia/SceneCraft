const STAGES = {
  PARSING: 'parsing',
  SCENES: 'scenes',
  CHARACTERS: 'characters',
  RELATIONSHIPS: 'relationships',
  TIMELINE: 'timeline',
  DIALOGUE: 'dialogue',
  MOOD: 'mood',
  ARC: 'arc',
  CONTINUITY: 'continuity',
  EMBEDDINGS: 'embeddings',
};

/**
 * Single source of truth for pipeline stage dependencies.
 * Each key lists the stages that must be COMPLETED before it can start.
 * This is the stricter definition: DIALOGUE depends on both SCENES and CHARACTERS.
 */
export const STAGE_DEPENDENCIES = {
  [STAGES.PARSING]:       [],
  [STAGES.SCENES]:        [STAGES.PARSING],
  [STAGES.CHARACTERS]:    [STAGES.SCENES],
  [STAGES.RELATIONSHIPS]: [STAGES.CHARACTERS],
  [STAGES.TIMELINE]:      [STAGES.SCENES],
  [STAGES.DIALOGUE]:      [STAGES.SCENES, STAGES.CHARACTERS],
  [STAGES.MOOD]:          [STAGES.SCENES],
  [STAGES.ARC]:           [STAGES.CHARACTERS, STAGES.MOOD],
  [STAGES.CONTINUITY]:    [STAGES.RELATIONSHIPS, STAGES.TIMELINE],
  [STAGES.EMBEDDINGS]:    [STAGES.ARC, STAGES.DIALOGUE],
};

export default STAGES;
export const STAGE_LIST = Object.values(STAGES);

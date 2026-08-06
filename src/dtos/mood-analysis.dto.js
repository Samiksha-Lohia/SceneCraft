export class MoodAnalysisDto {
  constructor(mood) {
    this.id = mood._id || mood.id;
    this.documentId = mood.documentId;
    this.sceneId = mood.sceneId;
    this.primaryMood = mood.primaryMood;
    this.emotionScores = mood.emotionScores instanceof Map 
      ? Object.fromEntries(mood.emotionScores) 
      : mood.emotionScores || {};
    this.intensity = mood.intensity || 0;
    this.createdAt = mood.createdAt;
    this.updatedAt = mood.updatedAt;
  }

  static toResponse(mood) {
    if (!mood) return null;
    return new MoodAnalysisDto(mood);
  }

  static toResponseList(moods) {
    if (!Array.isArray(moods)) return [];
    return moods.map(mood => new MoodAnalysisDto(mood));
  }
}

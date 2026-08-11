import mongoose from 'mongoose';

const moodAnalysisSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    sceneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scene',
      required: true,
      unique: true, // One mood analysis per scene
    },
    primaryMood: {
      type: String,
      required: true,
      trim: true,
    },
    // Map storing scores per emotion category, e.g., { joy: 0.1, tension: 0.8 }
    emotionScores: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    intensity: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MoodAnalysis = mongoose.model('MoodAnalysis', moodAnalysisSchema);

export default MoodAnalysis;
export { MoodAnalysis };

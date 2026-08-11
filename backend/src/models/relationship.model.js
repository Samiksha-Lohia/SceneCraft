import mongoose from 'mongoose';
import { RELATIONSHIP_TYPE_LIST } from '../constants/index.js';

const relationshipSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    characterAId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
    },
    characterBId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
    },
    type: {
      type: String,
      enum: RELATIONSHIP_TYPE_LIST,
      default: 'other',
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
      default: 0,
    },
    // Map where Key is sceneId (as string) and Value is the sentiment score at that scene
    sentimentBySceneId: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    sceneIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scene',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure unique entry for any character pair inside a document, regardless of who is characterA or characterB
relationshipSchema.index({ documentId: 1, characterAId: 1, characterBId: 1 }, { unique: true });

const Relationship = mongoose.model('Relationship', relationshipSchema);

export default Relationship;
export { Relationship };

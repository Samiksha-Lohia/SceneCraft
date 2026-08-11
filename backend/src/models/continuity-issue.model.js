import mongoose from 'mongoose';
import { CONTINUITY_SEVERITY_LIST, CONTINUITY_STATUS_LIST } from '../constants/index.js';

const continuityIssueSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['attribute-conflict', 'timeline-conflict', 'unexplained-gap'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    sceneIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scene',
      },
    ],
    severity: {
      type: String,
      enum: CONTINUITY_SEVERITY_LIST,
      default: 'medium',
    },
    status: {
      type: String,
      enum: CONTINUITY_STATUS_LIST,
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

const ContinuityIssue = mongoose.model('ContinuityIssue', continuityIssueSchema);

export default ContinuityIssue;
export { ContinuityIssue };

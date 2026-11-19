import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    messageId: {
      type: String,
      default: '',
    },
    channelId: {
      type: String,
      default: '',
    },
    channelType: {
      type: String,
      enum: ['direct', 'group', 'open', 'other'],
      default: 'group',
    },
    content: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    aiAnalysis: {
      toxicityScore: { type: Number, default: 0 },
      flaggedCategories: { type: [String], default: [] },
      recommendation: { type: String, default: 'none' },
      isAppropriate: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model('Report', reportSchema);


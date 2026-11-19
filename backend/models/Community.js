import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Technology',
        'Gaming',
        'Education',
        'Startups',
        'Entertainment',
        'Sports',
        'General discussions',
      ],
      default: 'Technology',
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    membersCount: {
      type: Number,
      default: 1,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    nexconnGroupId: {
      type: String,
      required: true,
      unique: true,
    },
    rules: {
      type: [String],
      default: [
        'Be respectful and kind to fellow community members.',
        'Keep discussions relevant to the community category.',
        'No spam, self-promotion, or abusive content.',
      ],
    },
    tags: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Community = mongoose.model('Community', communitySchema);


import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    taskCategories: [{
      type: String,
      trim: true
    }],
    defaultTaskDueDays: {
      type: Number,
      default: 7
    },
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      taskReminders: {
        type: Boolean,
        default: true
      },
      reminderHours: {
        type: Number,
        default: 24
      }
    }
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ name: 1 });
organizationSchema.index({ isActive: 1 });

// Update timestamp on save
organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Set default task categories if none provided
organizationSchema.pre('save', function(next) {
  if (!this.settings.taskCategories || this.settings.taskCategories.length === 0) {
    this.settings.taskCategories = ['General', 'Development', 'Design', 'Marketing'];
  }
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;

import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  assignmentHistory: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["todo", "in_progress", "completed", "expired"],
    default: "todo",
  },
  category: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  dueDate: {
    type: Date,
    required: true,
  },
  completedAt: {
    type: Date,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  statusHistory: [
    {
      status: {
        type: String,
        enum: ["todo", "in_progress", "completed", "expired"],
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      comment: String,
    },
  ],
  attachments: [
    {
      name: String,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp and handle status changes on save
taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // If status is being modified
  if (this.isModified("status")) {
    // Add to status history if there's a user context
    if (this._user) {
      this.statusHistory.push({
        status: this.status,
        changedBy: this._user._id,
        changedAt: new Date(),
      });

      // Set completedBy and completedAt if task is completed
      if (this.status === "completed") {
        this.completedBy = this._user._id;
        this.completedAt = new Date();
      }
    }
  }

  next();
});

// Method to set user context for status updates
taskSchema.methods.setUserContext = function (user) {
  this._user = user;
  return this;
};

// Method to check if a user is assigned to this task
taskSchema.methods.isAssignedToUser = function (userId) {
  return this.assignedTo.some((id) => id.toString() === userId.toString());
};

// Method to check if a user can modify this task
taskSchema.methods.canBeModifiedByUser = function (user) {
  // Admins and managers can modify any task
  if (user.role === "admin" || user.role === "manager") {
    return true;
  }

  // Members can only modify tasks assigned to them
  if (user.role === "member") {
    return this.isAssignedToUser(user._id);
  }

  return false;
};

// Method to check if a user can edit task details (not just status)
taskSchema.methods.canEditDetails = function (user) {
  // Only admins and managers can edit task details
  return user.role === "admin" || user.role === "manager";
};

// Method to check if a user can delete the task
taskSchema.methods.canDelete = function (user) {
  // Only admins and managers can delete tasks
  return user.role === "admin" || user.role === "manager";
};

// Indexes for efficient queries
taskSchema.index({ organization: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ "statusHistory.changedAt": 1 });
taskSchema.index({ createdAt: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;

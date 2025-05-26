import express from "express";
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../controllers/taskController.js";
import { auth } from "../middleware/auth.js";
import {
  ensureOrganizationAccess,
  ensureManagerAccess,
  ensureOrganizationData,
} from "../middleware/organizationAuth.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

const router = express.Router();

// All routes require authentication and organization access
router.use(auth);
router.use(ensureOrganizationAccess);

// Get task statistics
router.get("/stats", async (req, res) => {
  try {
    const organizationId = req.user.organization;

    // Get task counts
    const [totalTasks, completedTasks, pendingTasks, overdueTasks] =
      await Promise.all([
        Task.countDocuments({ organization: organizationId }),
        Task.countDocuments({
          organization: organizationId,
          status: "completed",
        }),
        Task.countDocuments({
          organization: organizationId,
          status: { $in: ["todo", "in_progress"] },
        }),
        Task.countDocuments({
          organization: organizationId,
          status: { $ne: "completed" },
          dueDate: { $lt: new Date() },
        }),
      ]);

    // Get team members count
    const teamMembers = await User.countDocuments({
      organization: organizationId,
    });

    // Get category statistics
    const categoryStats = await Task.aggregate([
      { $match: { organization: organizationId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get priority statistics
    const priorityStats = await Task.aggregate([
      { $match: { organization: organizationId } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      teamMembers,
      categoryStats,
      priorityStats,
    });
  } catch (error) {
    console.error("Error fetching task stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent tasks
router.get("/recent", async (req, res) => {
  try {
    const organizationId = req.user.organization;
    const query = { organization: organizationId };

    // If user is not admin or manager, only show assigned tasks
    if (req.user.role === "member") {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ tasks });
  } catch (error) {
    console.error("Error fetching recent tasks:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks for the organization
router.get("/", async (req, res) => {
  try {
    const query = { organization: req.user.organization };

    // If user is not admin or manager, only show assigned tasks
    if (req.user.role === "member") {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific task
router.get("/:id", ensureOrganizationData(Task), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("completedBy", "firstName lastName email");

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task (admin and manager only)
router.post("/", ensureManagerAccess, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      organization: req.user.organization,
      createdBy: req.user._id,
    };

    const task = new Task(taskData);
    await task.save();

    res.status(201).json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a task (admin and manager only for details, members can only update status)
router.put("/:id", ensureOrganizationData(Task), async (req, res) => {
  try {
    const task = req.resource;

    // Check if user has permission to update
    if (!task.canBeModifiedByUser(req.user)) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update this task" });
    }

    // If trying to update task details (not just status), check for admin/manager role
    const isUpdatingDetails = Object.keys(req.body).some(
      (key) => !["status"].includes(key)
    );

    if (isUpdatingDetails && !task.canEditDetails(req.user)) {
      return res
        .status(403)
        .json({ error: "Only admins and managers can edit task details" });
    }

    // Only admin and manager can change assignments
    if (req.body.assignedTo && !task.canEditDetails(req.user)) {
      return res.status(403).json({
        error: "Only admins and managers can change task assignments",
      });
    }

    Object.assign(task, req.body);
    await task.save();

    res.json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task status (admin, manager, or assigned member)
router.patch("/:id/status", ensureOrganizationData(Task), async (req, res) => {
  try {
    const task = req.resource;

    // Check if user has permission to update status
    if (!task.canBeModifiedByUser(req.user)) {
      return res.status(403).json({
        error: "You do not have permission to update this task's status",
      });
    }

    task.status = req.body.status;
    task.setUserContext(req.user);
    await task.save();

    res.json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a task (admin and manager only)
router.delete("/:id", ensureOrganizationData(Task), async (req, res) => {
  try {
    const task = req.resource;

    if (!task.canDelete(req.user)) {
      return res
        .status(403)
        .json({ error: "Only admins and managers can delete tasks" });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import Select from "react-select";
import TaskCategoryPriority from "../components/TaskCategoryPriority";

// Reusable TaskForm Component
const TaskForm = ({
  onSubmit,
  initialData = null,
  onCancel,
  users = [],
  categories = [],
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: [],
    category: "",
    priority: "medium",
    ...initialData,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate required fields
    const newErrors = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        assignedTo: [],
        category: "",
        priority: "medium",
      });
    } catch (error) {
      console.error("Error submitting task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, options } = e.target;
    let newValue = value;

    if (type === "select-multiple") {
      newValue = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const userOptions = Array.isArray(users)
    ? users.map((user) => ({
        value: user._id,
        label: `${user.firstName} ${user.lastName} (${user.role})`,
      }))
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className={`input mt-1 ${errors.title ? "border-red-500" : ""}`}
          value={formData.title}
          onChange={handleChange}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          className="input mt-1"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label
          htmlFor="dueDate"
          className="block text-sm font-medium text-gray-700"
        >
          Due Date
        </label>
        <input
          type="date"
          name="dueDate"
          id="dueDate"
          required
          className="input mt-1"
          value={formData.dueDate}
          onChange={handleChange}
        />
      </div>

      <div>
        <label
          htmlFor="assignedTo"
          className="block text-sm font-medium text-gray-700"
        >
          Assign To
        </label>
        <Select
          isMulti
          name="assignedTo"
          options={userOptions}
          className="mt-1"
          value={userOptions.filter((option) =>
            formData.assignedTo.includes(option.value)
          )}
          onChange={(selectedOptions) => {
            setFormData((prev) => ({
              ...prev,
              assignedTo: selectedOptions
                ? selectedOptions.map((option) => option.value)
                : [],
            }));
          }}
        />
      </div>

      <TaskCategoryPriority
        formData={formData}
        handleChange={handleChange}
        categories={categories}
        error={errors.category}
      />

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : initialData ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
};

// Main Tasks Component
export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [categories, setCategories] = useState([]);

  const { user } = useSelector((state) => state.auth);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const canManageTasks = isAdmin || isManager;

  // Helper function to check if user can edit a task
  const canEditTask = (task) => {
    if (canManageTasks) return true;
    return task.assignedTo.some((assignee) => assignee._id === user._id);
  };

  // Helper function to check if user can edit task details
  const canEditTaskDetails = () => {
    return canManageTasks;
  };

  // Helper function to check if user can delete a task
  const canDeleteTask = () => {
    return canManageTasks;
  };

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get("/tasks");
      if (Array.isArray(response.data?.tasks)) {
        setTasks(response.data.tasks);
      } else {
        console.warn("Tasks data is not an array:", response.data);
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/organizations/members");
      if (res.data?.members) {
        setUsers(res.data.members);
      } else {
        console.warn("No members data received:", res.data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching organization members:", error);
      setUsers([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/organizations/settings");
      if (response.data?.settings?.categories) {
        setCategories(response.data.settings.categories);
      } else {
        // Set default categories if none are found
        setCategories([
          "Development",
          "Design",
          "Marketing",
          "Sales",
          "Support",
          "Other",
        ]);
      }
    } catch (error) {
      console.error("Error fetching organization settings:", error);
      // Set default categories on error
      setCategories([
        "Development",
        "Design",
        "Marketing",
        "Sales",
        "Support",
        "Other",
      ]);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchTasks(), fetchCategories()]);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleCreateTask = async (formData) => {
    try {
      // Format the task data
      const taskData = {
        title: formData.title,
        description: formData.description || "",
        dueDate: new Date(formData.dueDate).toISOString(),
        assignedTo: formData.assignedTo || [],
        category: formData.category,
        priority: formData.priority,
        status: "todo", // Set initial status
      };

      console.log("Creating task with data:", taskData); // Debug log

      const response = await axiosInstance.post("/tasks", taskData);
      if (response.data?.task) {
        setShowForm(false);
        fetchTasks();
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(
        error.response?.data?.error ||
          "Failed to create task. Please check all required fields."
      );
    }
  };

  const handleUpdateTask = async (formData) => {
    try {
      if (!canEditTaskDetails()) {
        alert("Only admins and managers can edit task details");
        return;
      }

      const { title, description, dueDate, assignedTo, category, priority } =
        formData;
      const updatedFormData = {
        title,
        description,
        dueDate,
        assignedTo,
        category,
        priority,
      };

      const response = await axiosInstance.put(
        `/tasks/${editingTask._id}`,
        updatedFormData
      );
      if (response.status === 200) {
        setEditingTask(null);
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert(error.response?.data?.error || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!canDeleteTask()) {
      alert("Only admins and managers can delete tasks");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await axiosInstance.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert(error.response?.data?.error || "Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;

      if (!canEditTask(task)) {
        alert("You don't have permission to update this task's status");
        return;
      }

      await axiosInstance.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      alert(error.response?.data?.error || "Failed to update task status");
    }
  };

  if (loading) {
    return <div className="text-gray-700">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and track your organization's tasks
          </p>
        </div>
        {canManageTasks && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Task
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Task List</h2>
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-40 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-40 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks
            .filter(
              (task) => filterStatus === "all" || task.status === filterStatus
            )
            .sort((a, b) => {
              if (sortBy === "dueDate") {
                return sortOrder === "asc"
                  ? new Date(a.dueDate) - new Date(b.dueDate)
                  : new Date(b.dueDate) - new Date(a.dueDate);
              }
              if (sortBy === "priority") {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return sortOrder === "asc"
                  ? priorityOrder[a.priority] - priorityOrder[b.priority]
                  : priorityOrder[b.priority] - priorityOrder[a.priority];
              }
              return sortOrder === "asc"
                ? a.status.localeCompare(b.status)
                : b.status.localeCompare(a.status);
            })
            .map((task) => (
              <div
                key={task._id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        disabled={!canEditTask(task)}
                        className={`block w-32 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md ${
                          !canEditTask(task)
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="expired">Expired</option>
                      </select>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          task.priority === "high"
                            ? "text-red-600"
                            : task.priority === "medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}{" "}
                        Priority
                      </span>
                      <span className="text-sm text-gray-500">
                        Category: {task.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canEditTaskDetails() && (
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-1 text-indigo-600 hover:text-indigo-800 focus:outline-none"
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteTask() && (
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Task Form Modal */}
      {(showForm || editingTask) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h3>
            <TaskForm
              onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
              initialData={editingTask}
              onCancel={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
              users={users}
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}
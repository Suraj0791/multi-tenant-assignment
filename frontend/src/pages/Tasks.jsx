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
  users,
  categories,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
  };

  const userOptions = users.map((user) => ({
    value: user._id,
    label: `${user.firstName} ${user.lastName}`,
  }));

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
          className="input mt-1"
          value={formData.title}
          onChange={handleChange}
        />
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
      setUsers(res.data || []);
    } catch (error) {
      console.error("Error fetching organization members:", error);
    } finally {
      setLoading(false); // ✅ Ensures "Loading..." is removed even on error
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTasks(); // if this exists
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/organizations/settings");
        setCategories(response.data.settings.taskCategories || []);
      } catch (error) {
        console.error("Error fetching organization settings:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCreateTask = async (formData) => {
    try {
      await axiosInstance.post("/tasks", formData);
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

 const handleUpdateTask = async (formData) => {
    try {
      const { title, description, dueDate, assignedTo, category, priority } = formData;
      const updatedFormData = { title, description, dueDate, assignedTo, category, priority };
      console.log("Updating task with ID:", editingTask._id);
      const response = await axiosInstance.put(`/tasks/${editingTask._id}`, updatedFormData);
      if (response.status === 200) {
        setEditingTask(null);
        fetchTasks();
      } else {
        console.error("Error updating task:", response);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await axiosInstance.delete(`/tasks/${taskId}`);
      if (response.status === 200) {
        fetchTasks();
      } else {
        console.error("Error deleting task:", response);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axiosInstance.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  if (loading) {
    return <div className="text-gray-700">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-gray-600">
            A list of all tasks in your organization.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Task
        </button>
      </div>

      {(showForm || editingTask) && (
        <div className="bg-white p-6 shadow-md rounded-md mb-4">
          <h2 className="text-lg font-bold mb-4">
            {editingTask ? "Edit Task" : "Create New Task"}
          </h2>
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
      )}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Assigned To</th>
              <th className="px-4 py-2 text-left">Due Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {tasks.map((task) => (
              <tr key={task._id}>
                <td className="px-4 py-2">{task.title}</td>
                <td className="px-4 py-2">
                  {task.assignedTo
                    ?.map((id) => {
                      const assignedUser = users.find((u) => u._id === id);
                      return assignedUser
                        ? `${assignedUser.firstName} ${assignedUser.lastName}`
                        : "Unknown";
                    })
                    .join(", ")}
                </td>
                <td className="px-4 py-2">{task.dueDate?.split("T")[0]}</td>
                <td className="px-4 py-2">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task._id, e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No tasks available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import Select from "react-select";
import TaskCategoryPriority from "../components/TaskCategoryPriority";

const TaskForm = ({ onSubmit, initialData = null, onCancel }) => {
    const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: [],
    category: "",
    priority: "medium",
    ...initialData,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/organizations/members");
        console.log("Users API response:", response); // Log response for debugging
        if (response.data && Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          console.error("Unexpected users data format:", response.data);
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssignedToChange = (selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: selectedOptions ? selectedOptions.map((option) => option.value) : [],
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
          value={formData.assignedTo}
          onChange={handleAssignedToChange}
        />
      </div>

      <TaskCategoryPriority formData={formData} handleChange={handleChange} />

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

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const { user } = useSelector((state) => state.auth);

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get("/tasks");
      // Ensure tasks is always an array, even if response.data is null/undefined
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      // Set empty array on error too
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

 const handleCreateTask = async (formData) => {
    console.log("Creating task with data:", formData);
    try {
      await axiosInstance.post("/tasks", formData);
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

 const handleUpdateTask = async (formData) => {
    console.log("Updating task with data:", formData);
    try {
      await axiosInstance.put(`/tasks/${editingTask._id}`, formData);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await axiosInstance.delete(`/tasks/${taskId}`);
      fetchTasks();
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
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all tasks in your organization
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4 flex items-center">
          <div className="flex items-center space-x-2">
            <label htmlFor="filterStatus" className="text-sm text-gray-700">
              Status:
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border-gray-300 text-sm"
            >
              <option value="all">All</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="sortBy" className="text-sm text-gray-700">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border-gray-300 text-sm"
            >
              <option value="dueDate">Due Date</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1 rounded hover:bg-gray-100"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add task
          </button>
        </div>
      </div>

      {(showForm || editingTask) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </h3>
                  <TaskForm
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    initialData={editingTask}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingTask(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Title
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Assigned To
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Due Date
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tasks
                    .filter((task) =>
                      filterStatus === "all"
                        ? true
                        : task.status === filterStatus
                    )
                    .sort((a, b) => {
                      if (sortBy === "dueDate") {
                        return sortOrder === "asc"
                          ? new Date(a.dueDate) - new Date(b.dueDate)
                          : new Date(b.dueDate) - new Date(a.dueDate);
                      }
                      if (sortBy === "title") {
                        return sortOrder === "asc"
                          ? a.title.localeCompare(b.title)
                          : b.title.localeCompare(a.title);
                      }
                      return sortOrder === "asc"
                        ? a.status.localeCompare(b.status)
                        : b.status.localeCompare(a.status);
                    })
                    .map((task) => (
                      <tr key={task._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {task.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {task.assignedTo?.firstName}{" "}
                          {task.assignedTo?.lastName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task._id, e.target.value)
                            }
                            className="rounded-md border-gray-300 text-sm"
                          >
                            <option value="todo">Todo</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

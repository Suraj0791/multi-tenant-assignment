import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

// Stats card component with icon
const StatsCard = ({ title, value, description, icon: Icon, color }) => (
  <div className="bg-white overflow-hidden shadow-lg rounded-lg transform transition-all duration-300 hover:scale-105">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {description && (
                <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                  {description}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

// Task status badge component
const TaskStatusBadge = ({ status }) => {
  const statusConfig = {
    todo: { color: "bg-yellow-100 text-yellow-800", label: "To Do" },
    in_progress: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
    completed: { color: "bg-green-100 text-green-800", label: "Completed" },
    expired: { color: "bg-red-100 text-red-800", label: "Expired" },
  };

  const config = statusConfig[status] || statusConfig.todo;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    teamMembers: 0,
    categoryStats: [],
    priorityStats: [],
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          axiosInstance.get("/tasks/stats"),
          axiosInstance.get("/tasks/recent"),
        ]);

        setStats(statsRes.data);
        setRecentTasks(tasksRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Here's what's happening in your organization today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks}
          description="tasks"
          icon={ChartBarIcon}
          color="bg-indigo-500"
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks}
          description="tasks"
          icon={CheckCircleIcon}
          color="bg-green-500"
        />
        <StatsCard
          title="Overdue Tasks"
          value={stats.overdueTasks}
          description="tasks"
          icon={ExclamationCircleIcon}
          color="bg-red-500"
        />
        <StatsCard
          title="Team Members"
          value={stats.teamMembers}
          description="members"
          icon={UserGroupIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Category and Priority Distribution */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Category Distribution */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tasks by Category
          </h3>
          <div className="space-y-4">
            {stats.categoryStats.map((category) => (
              <div key={category._id} className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {category._id}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {category.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${(category.count / stats.totalTasks) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tasks by Priority
          </h3>
          <div className="space-y-4">
            {stats.priorityStats.map((priority) => (
              <div key={priority._id} className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {priority._id}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {priority.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        priority._id === "high"
                          ? "bg-red-500"
                          : priority._id === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${(priority.count / stats.totalTasks) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Tasks</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTasks.map((task) => (
            <div
              key={task._id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TaskStatusBadge status={task.status} />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Assigned to: {task.assignedTo?.firstName}{" "}
                      {task.assignedTo?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    Due {new Date(task.dueDate).toLocaleDateString()}
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
                </div>
              </div>
            </div>
          ))}
          {recentTasks.length === 0 && (
            <div className="px-6 py-4 text-center text-gray-500">
              No recent tasks found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

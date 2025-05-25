import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axios';

// Stats card component
const StatsCard = ({ title, value, description }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
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
  </div>
);

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamMembers: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          axiosInstance.get('/tasks/stats'),
          axiosInstance.get('/tasks/recent'),
        ]);

        setStats(statsRes.data);
        setRecentTasks(tasksRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening in your organization
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks}
          description="tasks"
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks}
          description="tasks"
        />
        <StatsCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          description="tasks"
        />
        <StatsCard
          title="Team Members"
          value={stats.teamMembers}
          description="members"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Tasks</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {recentTasks.map((task) => (
              <li key={task._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-primary-600 truncate">
                        {task.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {task.status}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="text-sm text-gray-500">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Assigned to: {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

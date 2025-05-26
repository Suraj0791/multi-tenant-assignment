import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axios';

const InviteForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'member',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        email: '',
        role: 'member',
      });
    } catch (error) {
      console.error('Error inviting team member:', error);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="input mt-1"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          name="role"
          id="role"
          required
          className="input mt-1"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Sending Invite...' : 'Send Invite'}
        </button>
      </div>
    </form>
  );
};

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to view team members.</p>
      </div>
    );
  }

  const fetchMembers = async () => {
    try {
      const response = await axiosInstance.get('/organizations/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInviteMember = async (formData) => {
    try {
      await axiosInstance.post('/organizations/members/invite', formData);
      setShowInviteForm(false);
      fetchMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await axiosInstance.patch(`/organizations/members/${memberId}/role`, {
        role: newRole,
      });
      fetchMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;

    try {
      await axiosInstance.delete(`/organizations/members/${memberId}`);
      fetchMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Team Members</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the members in your organization
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowInviteForm(true)}
          >
            Invite member
          </button>
        </div>
      </div>

      {showInviteForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Invite Team Member
                  </h3>
                  <InviteForm
                    onSubmit={handleInviteMember}
                    onCancel={() => setShowInviteForm(false)}
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
                      Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
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
                  {members.map((member) => (
                    <tr key={member._id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {member.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {user?.role === 'admin' && member._id !== user._id ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                            className="rounded-md border-gray-300 text-sm"
                          >
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="capitalize">{member.role}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            member.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {user?.role === 'admin' && member._id !== user._id && (
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
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

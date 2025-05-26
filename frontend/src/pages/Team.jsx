import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import {
  UserPlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  EnvelopeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Role badge component
const RoleBadge = ({ role }) => {
  const roleConfig = {
    admin: { color: "bg-purple-100 text-purple-800", icon: ShieldCheckIcon },
    manager: {
      color: "bg-blue-100 text-blue-800",
      icon: ShieldExclamationIcon,
    },
    member: { color: "bg-green-100 text-green-800", icon: null },
  };

  const config = roleConfig[role] || roleConfig.member;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {Icon && <Icon className="h-4 w-4 mr-1" />}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

export default function Team() {
  const { user } = useSelector((state) => state.auth);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        axiosInstance.get("/organizations/members"),
        axiosInstance.get("/organizations/invites"),
      ]);
      setMembers(membersRes.data.members);
      setInvitations(invitationsRes.data.invitations);
    } catch (error) {
      console.error("Error fetching team data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axiosInstance.post("/organizations/invites", {
        email: inviteEmail,
        role: inviteRole,
      });

      // Show invite link in development mode
      if (process.env.NODE_ENV === "development") {
        console.log("\n=== Invitation Link ===");
        console.log(`Email: ${inviteEmail}`);
        console.log(`Role: ${inviteRole}`);
        console.log(`Link: ${response.data.inviteLink}`);
        console.log("=====================\n");
      }

      await fetchTeamData();
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("member");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to send invitation");
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await axiosInstance.delete(`/organizations/invites/${invitationId}`);
      await fetchTeamData();
    } catch (error) {
      console.error("Error canceling invitation:", error);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await axiosInstance.patch(`/organizations/members/${memberId}`, {
        role: newRole,
      });
      await fetchTeamData();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      await axiosInstance.delete(`/organizations/members/${memberId}`);
      await fetchTeamData();
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your organization's members and invitations
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Invite Member
          </button>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div
              key={member._id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <RoleBadge role={member.role} />
                  {isAdmin && member._id !== user._id && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member._id, e.target.value)
                        }
                        className="block w-32 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                      >
                        <UserMinusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {isManager && invitations.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Pending Invitations
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <div
                key={invitation._id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invitation.email}
                      </p>
                      <RoleBadge role={invitation.role} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelInvitation(invitation._id)}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Invite Team Member
            </h3>
            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="member">Member</option>
                    {isAdmin && <option value="manager">Manager</option>}
                    {isAdmin && <option value="admin">Admin</option>}
                  </select>
                </div>

                {/* Email Service Limitation Note */}
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Email Service Limitation
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Due to email service limitations, the invite link will
                          be logged to the console. Please check the console to
                          get the invite link.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

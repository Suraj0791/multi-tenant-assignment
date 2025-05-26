import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../../store/slices/authSlice";
import axiosInstance from "../../utils/axios";

const JoinOrganization = () => {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, error } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");

  // Verify the invite token
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axiosInstance.get(
          `/organizations/invites/verify/${inviteToken}`
        );
        setInviteData(response.data);
        setFormData((prev) => ({ ...prev, email: response.data.email }));
      } catch (error) {
        setFormError(
          error.response?.data?.error || "Invalid or expired invitation link"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [inviteToken]);

  // If user is already authenticated, accept the invite directly
  useEffect(() => {
    const acceptInvite = async () => {
      if (isAuthenticated && inviteData) {
        try {
          await axiosInstance.post(
            `/organizations/invites/accept/${inviteToken}`
          );
          navigate("/dashboard");
        } catch (error) {
          setFormError(
            error.response?.data?.error || "Failed to accept invitation"
          );
        }
      }
    };

    acceptInvite();
  }, [isAuthenticated, inviteData, inviteToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      // Register the user
      await dispatch(register(formData)).unwrap();

      // After successful registration, the second useEffect will handle accepting the invite
    } catch (error) {
      setFormError(error.message || "Registration failed");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Verifying invitation...</div>
      </div>
    );
  }

  if (formError && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{formError}</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Accepting invitation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join {inviteData?.organizationName}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You've been invited to join as a {inviteData?.role}
          </p>
        </div>

        {formError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{formError}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={formData.email}
                disabled
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Join Organization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinOrganization;

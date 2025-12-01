import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        dob: user.dob || '',
        address: user.address || '',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put('/api/user/update-profile', formData);
      if (response.data.success) {
        toast.success('Profile updated successfully');
        await checkAuth();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">
            View and update your personal details. Admins can review your KYC and approval status from here.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl bg-white shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{ wordBreak: 'break-word' }}
                  placeholder="House / Street / City"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4 rounded-2xl bg-white shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900">Status Overview</h2>
            <div className="space-y-3 text-sm text-gray-700">
              {user.name && user.name !== '' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-medium text-gray-900">Full Name</span>
                  <span className="sm:text-right break-words max-w-full">{user.name}</span>
                </div>
              )}
              {user.dob && user.dob !== '' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-medium text-gray-900">Date of Birth</span>
                  <span className="sm:text-right">{user.dob}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="font-medium text-gray-900">Email</span>
                <span className="sm:text-right break-words max-w-full">{user.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="font-medium text-gray-900">Mobile</span>
                <span className="sm:text-right break-words max-w-full">{user.mobile}</span>
              </div>
              {user.address && user.address !== '' && (
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                  <span className="font-medium text-gray-900">Address</span>
                  <span className="sm:text-right break-words max-w-full whitespace-pre-line">
                    {user.address}
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="font-medium text-gray-900">Admin Approval</span>
                <span className="capitalize sm:text-right">
                  {user.adminApprovalStatus || 'pending'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="font-medium text-gray-900">KYC Status</span>
                <span className="capitalize sm:text-right">{user.kycStatus || 'pending'}</span>
              </div>
              {user.kycStatus && user.kycStatus !== 'verified' && (
                <p className="text-xs text-gray-500">
                  Need to update documents? Head to the KYC page to upload Aadhaar, PAN, and bank proof again.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


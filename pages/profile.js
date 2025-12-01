import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { useUpdateProfileMutation } from '@/store/api/profileApi';

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    address: '',
  });

  // Redux hooks
  const [updateProfile, { isLoading: loading }] = useUpdateProfileMutation();

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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
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
      const result = await updateProfile(formData).unwrap();
      if (result.success) {
        toast.success('Profile updated successfully');
        await checkAuth(); // Refresh auth context
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to update profile');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            View and update your personal details. Admins can review your KYC and approval status from here.
          </p>
        </header>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Personal Details</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  style={{ wordBreak: 'break-word' }}
                  placeholder="House / Street / City"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 dark:shadow-blue-700/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
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

          <div className="space-y-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Status Overview</h2>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {user.name && user.name !== '' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-gray-200 dark:border-slate-700">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Full Name</span>
                  <span className="sm:text-right break-words max-w-full text-gray-600 dark:text-gray-400">{user.name}</span>
                </div>
              )}
              {user.dob && user.dob !== '' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-gray-200 dark:border-slate-700">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Date of Birth</span>
                  <span className="sm:text-right text-gray-600 dark:text-gray-400">{user.dob}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-gray-200 dark:border-slate-700">
                <span className="font-medium text-gray-900 dark:text-gray-100">Email</span>
                <span className="sm:text-right break-words max-w-full text-gray-600 dark:text-gray-400">{user.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-gray-200 dark:border-slate-700">
                <span className="font-medium text-gray-900 dark:text-gray-100">Mobile</span>
                <span className="sm:text-right break-words max-w-full text-gray-600 dark:text-gray-400">{user.mobile}</span>
              </div>
              {user.address && user.address !== '' && (
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 pb-2 border-b border-gray-200 dark:border-slate-700">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Address</span>
                  <span className="sm:text-right break-words max-w-full whitespace-pre-line text-gray-600 dark:text-gray-400">
                    {user.address}
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-gray-200 dark:border-slate-700">
                <span className="font-medium text-gray-900 dark:text-gray-100">Admin Approval</span>
                <span className="capitalize sm:text-right text-gray-600 dark:text-gray-400">
                  {user.adminApprovalStatus || 'pending'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">KYC Status</span>
                <span className="capitalize sm:text-right text-gray-600 dark:text-gray-400">{user.kycStatus || 'pending'}</span>
              </div>
              {user.kycStatus && user.kycStatus !== 'verified' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
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


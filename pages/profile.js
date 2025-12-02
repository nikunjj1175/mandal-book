import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/imageCompress';
import { useUpdateProfileMutation } from '@/store/api/profileApi';

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    address: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Redux hooks
  const [updateProfile, { isLoading: loading }] = useUpdateProfileMutation();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        dob: user.dob || '',
        address: user.address || '',
      });
      setProfileImage(user.profilePic || null);
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
      const payload = {
        ...formData,
        // If user selected a new profile image, send it; otherwise backend keeps existing one
        profilePic: profileImage || undefined,
      };

      const result = await updateProfile(payload).unwrap();
      if (result.success) {
        toast.success('Profile updated successfully');
        await checkAuth(); // Refresh auth context
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to update profile');
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      toast.loading('Processing profile image...', { id: 'profile-pic' });
      const compressed = await compressImage(file, 512, 512, 0.85);
      setProfileImage(compressed);
      toast.success('Profile image ready to save', { id: 'profile-pic', duration: 2500 });
    } catch (error) {
      console.error('Profile image error:', error);
      toast.error('Failed to process profile image', { id: 'profile-pic' });
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <header className="space-y-3 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            View and update your personal details, profile photo, and see your KYC information in one place.
          </p>
        </header>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)]">
          {/* Left column: avatar + editable fields */}
          <div className="space-y-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            {/* Avatar + quick info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shadow-md shadow-blue-600/40">
                  {profileImage || user.profilePic ? (
                    <img
                      src={profileImage || user.profilePic}
                      alt={user.name || 'Profile'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl font-semibold text-white">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {user.name || 'Member'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">
                    {user.email}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 capitalize">
                    Role: {user.role}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-2">
                <label className="inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                  <span>{profileImage ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageChange}
                    disabled={imageUploading}
                  />
                </label>
                {imageUploading && (
                  <span className="text-[11px] text-blue-500 dark:text-blue-300 flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                    Processing image...
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mt-2">Personal Details</h2>
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

          {/* Right column: status + KYC info */}
          <div className="space-y-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Status & KYC Overview</h2>
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

              {user.aadhaarNumber && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-2 border-t border-gray-200 dark:border-slate-700">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Aadhaar Number</span>
                  <span className="sm:text-right break-all text-gray-600 dark:text-gray-400">
                    {user.aadhaarNumber}
                  </span>
                </div>
              )}
              {user.panNumber && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">PAN Number</span>
                  <span className="sm:text-right break-all text-gray-600 dark:text-gray-400">
                    {user.panNumber}
                  </span>
                </div>
              )}
              {user.bankDetails?.accountNumber && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Account Number</span>
                  <span className="sm:text-right break-all text-gray-600 dark:text-gray-400">
                    {user.bankDetails.accountNumber}
                  </span>
                </div>
              )}
              {user.bankDetails?.ifscCode && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">IFSC Code</span>
                  <span className="sm:text-right break-all text-gray-600 dark:text-gray-400">
                    {user.bankDetails.ifscCode}
                  </span>
                </div>
              )}
              {user.bankDetails?.bankName && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Bank Name</span>
                  <span className="sm:text-right break-all text-gray-600 dark:text-gray-400">
                    {user.bankDetails.bankName}
                  </span>
                </div>
              )}
              {user.bankDetails?.accountHolderName && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Account Holder</span>
                  <span className="sm:text-right break-all text-gray-600 dark:text-gray-400">
                    {user.bankDetails.accountHolderName}
                  </span>
                </div>
              )}

              {user.kycStatus && user.kycStatus !== 'verified' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                  Need to update documents? Head to the KYC page to upload Aadhaar, PAN, and bank proof again.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* KYC documents preview */}
        {(user.aadhaarFront || user.panImage || user.bankDetails?.passbookImage) && (
          <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Your KYC Documents
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
              These documents are used only for verification by the admin. If any detail is incorrect, please contact the admin.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {user.aadhaarFront && (
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">Aadhaar Front</p>
                  <img
                    src={user.aadhaarFront}
                    alt="Aadhaar Front"
                    className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200 dark:border-slate-700"
                  />
                </div>
              )}
              {user.panImage && (
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">PAN</p>
                  <img
                    src={user.panImage}
                    alt="PAN"
                    className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200 dark:border-slate-700"
                  />
                </div>
              )}
              {user.bankDetails?.passbookImage && (
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">Passbook First Page</p>
                  <img
                    src={user.bankDetails.passbookImage}
                    alt="Passbook"
                    className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200 dark:border-slate-700"
                  />
                </div>
              )}
            </div>
        </div>
        )}
      </div>
    </Layout>
  );
}


import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
// import PaymentDetails from '@/components/PaymentDetails';
import PayNowQR from '@/components/PayNowQR';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/imageCompress';
import { useTranslation } from '@/lib/useTranslation';
import { useGetPaymentSettingsQuery } from '@/store/api/settingsApi';
import { useGetMyContributionsQuery, useUploadContributionMutation } from '@/store/api/contributionsApi';

export default function Contributions() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showUpload, setShowUpload] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    month: '',
    amount: '',
    upiProvider: 'gpay',
    slipImage: null,
  });

  // Redux hooks
  const { data: contributionsData, isLoading: loading } = useGetMyContributionsQuery(undefined, {
    skip: !user || user.role !== 'member' || user.adminApprovalStatus !== 'approved' || user.kycStatus !== 'verified',
  });
  const [uploadContribution, { isLoading: uploading }] = useUploadContributionMutation();

  // Public payment settings (UPI ID + monthly amount)
  const { data: paymentSettingsData } = useGetPaymentSettingsQuery();

  const contributions = contributionsData?.data?.contributions || [];

  // Auto-fill current month and monthly contribution amount when opening the upload form
  useEffect(() => {
    if (!showUpload) return;

    // Pre-fill month as current YYYY-MM if not already set
    if (!formData.month) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const currentMonth = `${year}-${month}`;
      setFormData((prev) => ({
        ...prev,
        month: currentMonth,
      }));
    }

    // Pre-fill amount from admin-configured monthly contribution, if available and not already typed
    const monthlyAmount = paymentSettingsData?.data?.monthlyContributionAmount;
    if (!formData.amount && monthlyAmount !== undefined && monthlyAmount !== null) {
      setFormData((prev) => ({
        ...prev,
        amount: String(monthlyAmount),
      }));
    }
  }, [showUpload, paymentSettingsData, formData.month, formData.amount]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        toast.loading('Compressing image...', { id: 'compress-slip' });
        const compressed = await compressImage(file, 1920, 1920, 0.85);
        toast.dismiss('compress-slip');
        setFormData({ ...formData, slipImage: compressed });
        toast.success('Image ready for upload', { duration: 2000 });
      } catch (error) {
        toast.dismiss('compress-slip');
        toast.error('Failed to process image');
        console.error('Image compression error:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await uploadContribution(formData).unwrap();
      if (result.success) {
        toast.success(t('contributions.upload') + ' ' + t('common.success'));
        setShowUpload(false);
        setFormData({ month: '', amount: '', slipImage: null, upiProvider: 'gpay' });
      } else {
        toast.error(result.error || t('common.error'));
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'An error occurred');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    }
  };

  if (!user) return null;

  // Only approved members can access contributions page (admins blocked here)
  if (user.role !== 'member') {
    return (
      <Layout>
        <div className="px-4 py-10">
          <div className="max-w-xl mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 sm:p-6 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Contributions are for members only
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              As an admin, you can review and approve contributions from the admin dashboard, but you cannot upload your own contributions here.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.adminApprovalStatus !== 'approved') {
    return (
      <Layout>
        <div className="px-4 py-10">
          <PendingApprovalMessage
            emailVerified={user.emailVerified}
            adminApprovalStatus={user.adminApprovalStatus}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-responsive-xl font-bold text-slate-900 dark:text-slate-100">{t('contributions.title')}</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Upload and track your monthly contributions
            </p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`btn-primary ${showUpload ? 'bg-slate-600 hover:bg-slate-700' : ''}`}
          >
            {showUpload ? t('common.cancel') : t('contributions.uploadSlip')}
          </button>
        </div>

        {/* UPI QR + Payment Details Section */}
        <div className="space-y-4 sm:space-y-6">
          <PayNowQR />
          {/* <PaymentDetails /> */}
        </div>

        {/* Upload Form - Enhanced */}
        {showUpload && (
          <div className="card p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('contributions.uploadSlip')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('contributions.month')} <span className="text-slate-500">(YYYY-MM)</span>
                  </label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('contributions.amount')} <span className="text-slate-500">(₹)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('contributions.upiApp')}
                </label>
                <select
                  value={formData.upiProvider}
                  onChange={(e) => setFormData({ ...formData, upiProvider: e.target.value })}
                  className="input-field"
                >
                  <option value="gpay">{t('contributions.gpay')}</option>
                  <option value="phonepe">{t('contributions.phonepe')}</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {t('contributions.upiAppHint')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('contributions.paymentSlip')}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                    className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 cursor-pointer"
                  />
                </div>
                {formData.slipImage && (
                  <div className="mt-4">
                    <img
                      src={formData.slipImage}
                      alt="Slip preview"
                      className="h-40 sm:h-56 w-full object-contain cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                      onClick={() => setPreviewImage(formData.slipImage)}
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full btn-primary py-3 text-base"
              >
                {uploading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('contributions.uploading')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {t('contributions.upload')}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Contributions Table - Enhanced */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading contributions...</p>
          </div>
        ) : contributions.length === 0 ? (
          <div className="card p-12 sm:p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-lg">{t('contributions.noHistory')}</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="table-responsive">
              <table className="table-container">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell font-semibold">{t('contributions.month')}</th>
                    <th className="table-cell font-semibold">{t('contributions.amount')}</th>
                    <th className="table-cell font-semibold hidden sm:table-cell">{t('dashboard.transactionId')}</th>
                    <th className="table-cell font-semibold hidden md:table-cell">Payment Date</th>
                    <th className="table-cell font-semibold">{t('dashboard.status')}</th>
                    <th className="table-cell font-semibold">{t('contributions.viewSlip')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {contributions.map((contribution) => (
                    <tr key={contribution._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="table-cell font-medium">{contribution.month}</td>
                      <td className="table-cell font-semibold text-slate-900 dark:text-slate-100">
                        ₹{contribution.amount.toLocaleString()}
                      </td>
                      <td className="table-cell text-slate-500 dark:text-slate-400 font-mono text-xs hidden sm:table-cell">
                        {contribution.ocrData?.transactionId || 'N/A'}
                      </td>
                      <td className="table-cell text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        {contribution.paymentDate 
                          ? new Date(contribution.paymentDate).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })
                          : contribution.status === 'done' 
                            ? 'N/A' 
                            : '—'}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(contribution.status)}`}>
                          {contribution.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(contribution.slipImage)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {t('contributions.viewSlip')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/90 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="max-w-4xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-white dark:text-gray-200 text-2xl leading-none px-3 py-1 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="bg-black/90 dark:bg-black/95 rounded-xl overflow-hidden max-h-[85vh] flex items-center justify-center border border-gray-700">
                <img
                  src={previewImage}
                  alt="Slip preview"
                  className="max-h-[85vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


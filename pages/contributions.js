import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/imageCompress';
import { useTranslation } from '@/lib/useTranslation';
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
    skip: !user || (user.role !== 'admin' && user.adminApprovalStatus !== 'approved'),
  });
  const [uploadContribution, { isLoading: uploading }] = useUploadContributionMutation();

  const contributions = contributionsData?.data?.contributions || [];

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

  if (user.role !== 'admin' && user.adminApprovalStatus !== 'approved') {
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
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('contributions.title')}</h1>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md text-sm sm:text-base font-medium"
          >
            {showUpload ? t('common.cancel') : t('contributions.uploadSlip')}
          </button>
        </div>

        {showUpload && (
          <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">{t('contributions.uploadSlip')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contributions.month')} (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contributions.amount')} (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contributions.upiApp')}
                </label>
                <select
                  value={formData.upiProvider}
                  onChange={(e) => setFormData({ ...formData, upiProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gpay">{t('contributions.gpay')}</option>
                  <option value="phonepe">{t('contributions.phonepe')}</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('contributions.upiAppHint')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contributions.paymentSlip')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                />
                {formData.slipImage && (
                  <img
                    src={formData.slipImage}
                    alt="Slip"
                    className="mt-2 h-32 sm:h-48 object-contain cursor-pointer rounded-lg border border-gray-200 dark:border-slate-700"
                    onClick={() => setPreviewImage(formData.slipImage)}
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md transition-colors"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('contributions.uploading')}
                  </>
                ) : (
                  t('contributions.upload')
                )}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          </div>
        ) : contributions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">{t('contributions.noHistory')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contributions.month')}</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contributions.amount')}</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">{t('dashboard.transactionId')}</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contributions.status')}</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contributions.viewSlip')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {contributions.map((contribution) => (
                      <tr key={contribution._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {contribution.month}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₹{contribution.amount.toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono text-xs hidden sm:table-cell">
                          {contribution.ocrData?.transactionId || 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contribution.status)}`}>
                            {contribution.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(contribution.slipImage)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
                          >
                            {t('contributions.viewSlip')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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


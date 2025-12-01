import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/imageCompress';

export default function Contributions() {
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    month: '',
    amount: '',
    upiProvider: 'gpay',
    slipImage: null,
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.adminApprovalStatus !== 'approved') return;
    fetchContributions();
  }, [user]);

  const fetchContributions = async () => {
    try {
      const response = await api.get('/api/contribution/my');
      if (response.data.success) {
        setContributions(response.data.data.contributions);
      }
    } catch (error) {
      toast.error('Failed to fetch contributions');
    } finally {
      setLoading(false);
    }
  };

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
    setUploading(true);

    try {
      const response = await api.post('/api/contribution/upload-slip', formData);
      if (response.data.success) {
        toast.success('Contribution slip uploaded successfully!');
        setShowUpload(false);
        setFormData({ month: '', amount: '', slipImage: null, upiProvider: 'gpay' });
        fetchContributions();
      } else {
        toast.error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Contributions</h1>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showUpload ? 'Cancel' : 'Upload Slip'}
          </button>
        </div>

        {showUpload && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Upload Contribution Slip</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI App Used
                </label>
                <select
                  value={formData.upiProvider}
                  onChange={(e) => setFormData({ ...formData, upiProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="gpay">Google Pay</option>
                  <option value="phonepe">PhonePe</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Make sure the screenshot clearly shows From/To UPI IDs and transaction ID.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Slip Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {formData.slipImage && (
                  <img
                    src={formData.slipImage}
                    alt="Slip"
                    className="mt-2 h-48 object-contain cursor-pointer"
                    onClick={() => setPreviewImage(formData.slipImage)}
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : contributions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">No contributions yet. Upload your first contribution slip!</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slip</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contributions.map((contribution) => (
                  <tr key={contribution._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contribution.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{contribution.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contribution.ocrData.transactionId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contribution.status)}`}>
                        {contribution.status}
                      </span>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <button
                         type="button"
                         onClick={() => setPreviewImage(contribution.slipImage)}
                         className="text-blue-600 hover:text-blue-800 underline"
                       >
                         View
                       </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="max-w-3xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-white text-2xl leading-none px-2"
                >
                  ×
                </button>
              </div>
              <div className="bg-black/80 rounded-xl overflow-hidden max-h-[80vh] flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Slip preview"
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


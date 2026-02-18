import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/imageCompress';
import { useUploadDocumentsMutation } from '@/store/api/profileApi';

export default function KYC() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Redux hooks
  const [uploadDocuments, { isLoading: loading }] = useUploadDocumentsMutation();
  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    panNumber: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: '',
    },
  });
  const [images, setImages] = useState({
    aadhaarFront: null,
    panImage: null,
    passbookImage: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        bankDetails: {
          ...formData.bankDetails,
          [field]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      try {
        toast.loading('Compressing image...', { id: `compress-${field}` });
        const compressed = await compressImage(file, 1920, 1920, 0.85);
        toast.dismiss(`compress-${field}`);
        setImages({ ...images, [field]: compressed });
        toast.success('Image ready for upload', { duration: 2000 });
      } catch (error) {
        toast.dismiss(`compress-${field}`);
        toast.error('Failed to process image');
        console.error('Image compression error:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await uploadDocuments({
        ...formData,
        ...images,
      }).unwrap();

      if (result.success) {
        toast.success('KYC documents uploaded successfully!');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Failed to upload documents');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'An error occurred');
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
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-responsive-xl font-bold text-slate-900 dark:text-slate-100">KYC Verification</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            Upload your identity documents for verification
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Aadhaar */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Aadhaar Card</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="1234 5678 9012"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Aadhaar Front Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'aadhaarFront')}
                  required
                  className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                />
                {images.aadhaarFront && (
                  <img src={images.aadhaarFront} alt="Aadhaar Front" className="mt-3 h-40 w-full object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2" />
                )}
              </div>
            </div>
          </div>

          {/* PAN */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">PAN Card</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="ABCDE1234F"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  PAN Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'panImage')}
                  required
                  className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300"
                />
                {images.panImage && (
                  <img src={images.panImage} alt="PAN" className="mt-3 h-40 w-full object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2" />
                )}
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Bank Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="bank.accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="bank.ifscCode"
                  value={formData.bankDetails.ifscCode}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank.bankName"
                  value={formData.bankDetails.bankName}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="bank.accountHolderName"
                  value={formData.bankDetails.accountHolderName}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Passbook First Page Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'passbookImage')}
                  required
                  className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
                />
                {images.passbookImage && (
                  <img src={images.passbookImage} alt="Passbook" className="mt-3 h-40 w-full object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2" />
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-base"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit KYC Documents
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}


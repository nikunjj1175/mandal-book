import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/useTranslation';
import { useGetPaymentSettingsQuery } from '@/store/api/settingsApi';

export default function PaymentDetails() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const { data: settingsData, isLoading } = useGetPaymentSettingsQuery();

  // Use only API data from database (no env fallback)
  const qrCodeUrl = settingsData?.data?.qrCodeUrl || null;
  const upiId = settingsData?.data?.upiId || null;

  const handleCopyUPI = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      toast.success('UPI ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
        Payment Details
      </h2>
      <div className="flex flex-col items-center space-y-4 sm:space-y-6">
        {/* QR Code */}
        {qrCodeUrl ? (
          <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-slate-600 shadow-sm">
            <img
              src={qrCodeUrl}
              alt="Payment QR Code"
              className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
            />
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-slate-700 p-3 sm:p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">QR Code not configured</p>
          </div>
        )}
        
        {/* UPI ID */}
        <div className="w-full">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">UPI ID</p>
          {upiId ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <p className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300 text-center break-all">
                {upiId}
              </p>
              <button
                onClick={handleCopyUPI}
                className="mt-2 w-full text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy UPI ID'}
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">UPI ID not configured</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function PayNowQR() {
  const [loading, setLoading] = useState(false);
  const [upiData, setUpiData] = useState(null);
  const [contributionMessage, setContributionMessage] = useState(null);

  const fetchUpiConfig = async () => {
    try {
      setLoading(true);
      setContributionMessage(null);
      setUpiData(null);
      const res = await api.get('/api/contribution/upi-config');

      if (!res.data?.success) {
        // Check if contribution already exists
        if (res.data?.contributionExists) {
          const statusMsg = res.data.contributionStatus === 'done' 
            ? 'already approved' 
            : res.data.contributionStatus === 'pending' 
            ? 'pending approval' 
            : 'submitted';
          setContributionMessage(`You have already submitted your contribution for this month. Status: ${statusMsg}.`);
          return;
        }
        throw new Error(res.data?.error || 'Unable to get UPI details');
      }

      setUpiData(res.data.data);
      setContributionMessage(null);
    } catch (error) {
      console.error('UPI config error:', error);
      // Check if contribution already exists in error response
      const errorData = error?.response?.data || error?.data;
      if (errorData?.contributionExists) {
        const statusMsg = errorData.contributionStatus === 'done' 
          ? 'already approved' 
          : errorData.contributionStatus === 'pending' 
          ? 'pending approval' 
          : 'submitted';
        setContributionMessage(`You have already submitted your contribution for this month. Status: ${statusMsg}.`);
      } else {
        toast.error(
          errorData?.error ||
            error?.message ||
            'Failed to load payment details'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    fetchUpiConfig();
  };

  const handleOpenUpiApp = () => {
    if (!upiData?.upiUrl) return;
    // On mobile, this should open PhonePe / GPay / Paytm etc
    window.location.href = upiData.upiUrl;
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Pay this month&apos;s contribution
          </p>
          {upiData?.amount && (
            <p className="mt-1 text-2xl sm:text-3xl font-semibold text-emerald-700 dark:text-emerald-400">
              ₹{upiData.amount}
            </p>
          )}
          {upiData?.monthLabel && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              For: {upiData.monthLabel}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handlePayNow}
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium shadow-md transition-colors"
        >
          {loading ? 'Preparing…' : 'Pay Now'}
        </button>
      </div>

      {contributionMessage && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
              {contributionMessage}
            </p>
          </div>
        </div>
      )}

      {upiData?.upiUrl && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
          <QRCodeCanvas value={upiData.upiUrl} size={210} />

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Scan with <span className="font-semibold">PhonePe / Google Pay / Paytm</span>
            <br />
            To: {upiData.upiName} ({upiData.upiVpa})
          </p>

          <button
            type="button"
            onClick={handleOpenUpiApp}
            className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline"
          >
            Open in UPI app
          </button>
        </div>
      )}
    </div>
  );
}


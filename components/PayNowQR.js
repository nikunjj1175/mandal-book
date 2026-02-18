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
    <div className="card p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400">
                Pay this month&apos;s contribution
              </p>
              {upiData?.amount && (
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{upiData.amount}
                </p>
              )}
              {upiData?.monthLabel && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  For: <span className="font-medium">{upiData.monthLabel}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePayNow}
          disabled={loading}
          className="btn-primary bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Preparing…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pay Now
            </>
          )}
        </button>
      </div>

      {contributionMessage && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-amber-800 dark:text-amber-200 flex-1">
                {contributionMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {upiData?.upiUrl && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-center gap-4 sm:gap-5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <QRCodeCanvas value={upiData.upiUrl} size={220} />
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Scan with <span className="font-semibold text-slate-900 dark:text-slate-100">PhonePe / Google Pay / Paytm</span>
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 font-mono">
                {upiData.upiName} ({upiData.upiVpa})
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenUpiApp}
              className="btn-secondary text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in UPI app
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


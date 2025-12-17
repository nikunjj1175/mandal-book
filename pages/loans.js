import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/imageCompress';
import { useGetMyLoansQuery, useRequestLoanMutation, usePayLoanMutation, useGetLoanFundSummaryQuery } from '@/store/api/loansApi';

export default function Loans() {
  const { user } = useAuth();
  const [showRequest, setShowRequest] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    slipImage: null,
  });
  const [calculator, setCalculator] = useState({
    amount: '',
    rate: '',
    durationValue: '',
    durationUnit: 'months',
  });

  // Redux hooks
  const { data: loansData, isLoading: loading } = useGetMyLoansQuery(undefined, {
    skip: !user || user.role !== 'member' || user.adminApprovalStatus !== 'approved',
  });
  const { data: fundSummaryData } = useGetLoanFundSummaryQuery(undefined, {
    skip: !user || user.role !== 'member' || user.adminApprovalStatus !== 'approved',
  });
  const [requestLoan, { isLoading: requestLoading }] = useRequestLoanMutation();
  const [payLoan, { isLoading: paymentLoading }] = usePayLoanMutation();

  const loans = loansData?.data?.loans || [];
  const fundSummary = fundSummaryData?.data || null;
  const availableFund = fundSummary?.availableFund ?? null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requested = parseFloat(formData.amount);
    if (Number.isNaN(requested) || requested <= 0) {
      toast.error('Please enter a valid loan amount');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select loan start and end date');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    // Approx duration in months based on days difference
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const durationMonths = Math.max(1, Math.round(diffDays / 30));

    if (availableFund !== null && requested > availableFund) {
      toast.error(
        `Maximum loan amount is ₹${availableFund.toLocaleString('en-IN')} based on current mandal fund.`
      );
      return;
    }

    try {
      const result = await requestLoan({
        amount: formData.amount,
        reason: formData.reason,
        duration: durationMonths,
        startDate: formData.startDate,
        endDate: formData.endDate,
      }).unwrap();
      if (result.success) {
        toast.success('Loan request submitted successfully!');
        setShowRequest(false);
        setFormData({ amount: '', reason: '', startDate: '', endDate: '' });
      } else {
        toast.error(result.error || 'Request failed');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'An error occurred');
    }
  };

  const handlePaymentImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        toast.loading('Compressing image...', { id: 'compress-payment' });
        const compressed = await compressImage(file, 1920, 1920, 0.85);
        toast.dismiss('compress-payment');
        setPaymentData({ ...paymentData, slipImage: compressed });
        toast.success('Image ready for upload', { duration: 2000 });
      } catch (error) {
        toast.dismiss('compress-payment');
        toast.error('Failed to process image');
        console.error('Image compression error:', error);
      }
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      const result = await payLoan({
        loanId: selectedLoan._id,
        amount: paymentData.amount,
        slipImage: paymentData.slipImage,
      }).unwrap();

      if (result.success) {
        toast.success('Payment submitted successfully! Waiting for admin approval.');
        setShowPayment(false);
        setSelectedLoan(null);
        setPaymentData({ amount: '', slipImage: null });
      } else {
        toast.error(result.error || 'Payment failed');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'An error occurred');
    }
  };

  const openPaymentModal = (loan) => {
    setSelectedLoan(loan);
    setPaymentData({ amount: loan.pendingAmount?.toString() || '', slipImage: null });
    setShowPayment(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    }
  };

  if (!user) return null;

  // Only approved members can access loans page (admins blocked here)
  if (user.role !== 'member') {
    return (
      <Layout>
        <div className="px-4 py-10">
          <div className="max-w-xl mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 sm:p-6 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Loans section is for members only
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Admin accounts can monitor and approve member loans from the admin dashboard, but cannot request loans here.
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
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Loans</h1>
            <button
              onClick={() => setShowRequest(!showRequest)}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md text-sm sm:text-base font-medium"
              disabled={availableFund !== null && availableFund <= 0}
            >
              {showRequest ? 'Cancel' : 'Request Loan'}
            </button>
          </div>

          {fundSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Mandal Fund</p>
                <p className="mt-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  ₹{fundSummary.totalFund.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Loan Out</p>
                <p className="mt-1 text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400">
                  ₹{fundSummary.totalLoanOut.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Available For New Loans</p>
                <p className="mt-1 text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                  ₹{fundSummary.availableFund.toLocaleString('en-IN')}
                </p>
                {fundSummary.availableFund <= 0 && (
                  <p className="mt-1 text-[11px] sm:text-xs text-red-600 dark:text-red-400">
                    Current fund fully used. New loan requests are temporarily limited.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {showRequest && (
          <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Request Loan</h2>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              {/* Loan request form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter loan amount"
                  />
                  {availableFund !== null && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      You can request up to{' '}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{availableFund.toLocaleString('en-IN')}
                      </span>{' '}
                      based on current mandal fund.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.startDate && formData.endDate && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Duration will be calculated from these dates and sent in months.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Explain the reason for loan"
                  />
                </div>
                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md transition-colors"
                >
                  {requestLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </form>

              {/* Loan calculator */}
              <div className="mt-4 lg:mt-0 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-900/10 p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                  Loan Calculator
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-200 mb-3">
                  Estimate interest and total repayment by amount, rate and duration (day / month / year wise).
                  This does not create a real loan – it is only for planning.
                </p>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <label className="block font-medium mb-1 text-emerald-900 dark:text-emerald-100">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={calculator.amount}
                      onChange={(e) => setCalculator({ ...calculator, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div className="grid grid-cols-[1.3fr_1fr] gap-2">
                    <div>
                      <label className="block font-medium mb-1 text-emerald-900 dark:text-emerald-100">
                        Interest Rate (% per year)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={calculator.rate}
                        onChange={(e) => setCalculator({ ...calculator, rate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                        placeholder="e.g. 12"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1 text-emerald-900 dark:text-emerald-100">
                        Duration
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={calculator.durationValue}
                          onChange={(e) => setCalculator({ ...calculator, durationValue: e.target.value })}
                          className="w-1/2 px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                          placeholder="e.g. 12"
                        />
                        <select
                          value={calculator.durationUnit}
                          onChange={(e) => setCalculator({ ...calculator, durationUnit: e.target.value })}
                          className="w-1/2 px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 text-xs"
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Calculated output */}
                  {(() => {
                    const P = parseFloat(calculator.amount);
                    const R = parseFloat(calculator.rate);
                    const D = parseFloat(calculator.durationValue);
                    if (!P || !R || !D) return null;

                    let years;
                    if (calculator.durationUnit === 'days') years = D / 365;
                    else if (calculator.durationUnit === 'months') years = D / 12;
                    else years = D;

                    const interest = (P * R * years) / 100;
                    const total = P + interest;

                    const months =
                      calculator.durationUnit === 'days'
                        ? D / 30
                        : calculator.durationUnit === 'months'
                        ? D
                        : D * 12;
                    const emi = months > 0 ? total / months : null;

                    return (
                      <div className="mt-3 rounded-lg bg-white/70 dark:bg-slate-900/40 border border-emerald-200 dark:border-emerald-700 p-3 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Estimated Interest</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            ₹{interest.toFixed(2).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Total Payable</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            ₹{total.toFixed(2).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {emi && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">
                              Approx. per month (EMI)
                            </span>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                              ₹{emi.toFixed(2).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-emerald-700/80 dark:text-emerald-200/80">
                          Calculation uses simple interest for approximation. Final interest & EMI may be
                          different based on admin settings.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No loan requests yet.</p>
          </div>
                ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Principal & Interest</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Interest Rate</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Amount</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Duration</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Reason</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {loans.map((loan) => {
                      const installmentsCount = loan.installmentsPaid?.length || 0;
                      const totalPaid = loan.installmentsPaid?.reduce((sum, inst) => sum + (inst.amount || 0), 0) || 0;
                      const principalAmount = loan.amount || 0;
                      const interestAmount = loan.interestAmount || 0;
                      
                      // Calculate total payable: if loan is approved/active, use totalPayable (includes interest)
                      // Otherwise, just use principal amount
                      let totalPayable = principalAmount;
                      if (loan.status === 'active' || loan.status === 'approved') {
                        totalPayable = loan.totalPayable || (principalAmount + interestAmount);
                      }
                      
                      // Pending amount should always reflect totalPayable minus payments
                      // If pendingAmount doesn't include interest, recalculate it
                      let pendingAmount = loan.pendingAmount || totalPayable;
                      if ((loan.status === 'active' || loan.status === 'approved') && interestAmount > 0) {
                        // Recalculate pending amount to ensure it includes interest
                        pendingAmount = Math.max(0, totalPayable - totalPaid);
                      }
                      
                      const approvedPayments = loan.installmentsPaid?.filter(inst => inst.status === 'approved').reduce((sum, inst) => sum + (inst.amount || 0), 0) || 0;
                      const pendingPayments = loan.installmentsPaid?.filter(inst => inst.status === 'pending').length || 0;
                      
                      return (
                        <>
                        <tr key={loan._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <div className="flex flex-col">
                          <span>₹{principalAmount.toLocaleString('en-IN')}</span>
                          {interestAmount > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Interest: ₹{interestAmount.toFixed(2).toLocaleString('en-IN')}
                            </span>
                          )}
                          {totalPayable > principalAmount && (
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              Total: ₹{totalPayable.toFixed(2).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                        {loan.interestRate ? `${loan.interestRate}%` : 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">₹{pendingAmount.toFixed(2).toLocaleString('en-IN')}</span>
                          {installmentsCount > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {installmentsCount} payment{installmentsCount > 1 ? 's' : ''} (₹{approvedPayments.toFixed(2).toLocaleString('en-IN')} approved)
                              {pendingPayments > 0 && (
                                <span className="text-yellow-600 dark:text-yellow-400 ml-1">
                                  • {pendingPayments} pending
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {loan.duration || 12} months
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                            {loan.status}
                          </span>
                          {loan.adminRemarks && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic" title={loan.adminRemarks}>
                              {loan.adminRemarks.length > 20 ? `${loan.adminRemarks.substring(0, 20)}...` : loan.adminRemarks}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate hidden lg:table-cell" title={loan.reason}>
                        {loan.reason || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col gap-1">
                          <span>{loan.createdAt ? new Date(loan.createdAt).toLocaleDateString('en-IN') : 'N/A'}</span>
                          {(loan.status === 'active' || loan.status === 'approved') && pendingAmount > 0 && (
                            <button
                              onClick={() => openPaymentModal(loan)}
                              className="text-xs bg-blue-600 dark:bg-blue-700 text-white px-2 py-1 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                            >
                              Pay Now
                            </button>
                          )}
                          {installmentsCount > 0 && (
                            <button
                              onClick={() => setExpandedLoan(expandedLoan === loan._id ? null : loan._id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {expandedLoan === loan._id ? 'Hide' : 'View'} Installments
                            </button>
                          )}
                        </div>
                        </td>
                      </tr>
                      {expandedLoan === loan._id && installmentsCount > 0 && (
                        <tr>
                          <td colSpan="7" className="px-3 sm:px-6 py-4 bg-gray-50 dark:bg-slate-800/50">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Installment Details</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-xs sm:text-sm">
                                  <thead className="bg-gray-100 dark:bg-slate-700">
                                    <tr>
                                      <th className="px-3 py-2 text-left">#</th>
                                      <th className="px-3 py-2 text-left">Amount</th>
                                      <th className="px-3 py-2 text-left hidden sm:table-cell">Date</th>
                                      <th className="px-3 py-2 text-left hidden md:table-cell">Reference ID</th>
                                      <th className="px-3 py-2 text-left">Status</th>
                                      <th className="px-3 py-2 text-left">Slip</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {loan.installmentsPaid.map((installment, idx) => (
                                      <tr key={idx}>
                                        <td className="px-3 py-2">{idx + 1}</td>
                                        <td className="px-3 py-2 font-medium">₹{installment.amount?.toFixed(2).toLocaleString('en-IN') || '0'}</td>
                                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                                          {installment.date ? new Date(installment.date).toLocaleDateString('en-IN') : 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs hidden md:table-cell">
                                          {installment.referenceId || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            installment.status === 'approved' 
                                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                              : installment.status === 'rejected'
                                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                          }`}>
                                            {installment.status}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2">
                                          {installment.slipImage && (
                                            <button
                                              onClick={() => window.open(installment.slipImage, '_blank')}
                                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                                            >
                                              View
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Make Loan Payment</h2>
                  <button
                    onClick={() => {
                      setShowPayment(false);
                      setSelectedLoan(null);
                      setPaymentData({ amount: '', slipImage: null });
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Principal:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">₹{selectedLoan.amount?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    {selectedLoan.interestAmount > 0 && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Interest:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">₹{selectedLoan.interestAmount.toFixed(2).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Total Payable:</span>
                      <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">₹{(selectedLoan.totalPayable || selectedLoan.amount || 0).toFixed(2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Pending Amount:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">₹{(selectedLoan.pendingAmount || selectedLoan.amount || 0).toFixed(2).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      required
                      max={selectedLoan.pendingAmount}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter payment amount"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Maximum: ₹{selectedLoan.pendingAmount?.toFixed(2).toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Slip Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentImageChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                    />
                    {paymentData.slipImage && (
                      <img
                        src={paymentData.slipImage}
                        alt="Payment Slip"
                        className="mt-2 h-32 sm:h-40 object-contain rounded-lg border border-gray-200 dark:border-slate-700"
                      />
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md transition-colors"
                  >
                    {paymentLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Payment'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


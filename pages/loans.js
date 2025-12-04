import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/imageCompress';
import { useGetMyLoansQuery, useRequestLoanMutation, usePayLoanMutation } from '@/store/api/loansApi';

export default function Loans() {
  const { user } = useAuth();
  const [showRequest, setShowRequest] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    duration: '12',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    slipImage: null,
  });

  // Redux hooks
  const { data: loansData, isLoading: loading } = useGetMyLoansQuery(undefined, {
    skip: !user || (user.role !== 'admin' && user.adminApprovalStatus !== 'approved'),
  });
  const [requestLoan, { isLoading: requestLoading }] = useRequestLoanMutation();
  const [payLoan, { isLoading: paymentLoading }] = usePayLoanMutation();

  const loans = loansData?.data?.loans || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await requestLoan(formData).unwrap();
      if (result.success) {
        toast.success('Loan request submitted successfully!');
        setShowRequest(false);
        setFormData({ amount: '', reason: '', duration: '12' });
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Loans</h1>
          <button
            onClick={() => setShowRequest(!showRequest)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md text-sm sm:text-base font-medium"
          >
            {showRequest ? 'Cancel' : 'Request Loan'}
          </button>
        </div>

        {showRequest && (
          <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Request Loan</h2>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (months)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12"
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


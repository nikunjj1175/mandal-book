import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/imageCompress';

export default function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    duration: '12',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    slipImage: null,
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.adminApprovalStatus !== 'approved') return;
    fetchLoans();
  }, [user]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/loan/my');
      if (response.data.success) {
        setLoans(response.data.data.loans);
      } else {
        toast.error('Failed to fetch loans');
      }
    } catch (error) {
      toast.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/loan/request', formData);
      if (response.data.success) {
        toast.success('Loan request submitted successfully!');
        setShowRequest(false);
        setFormData({ amount: '', reason: '', duration: '12' });
        fetchLoans(); // Refresh loans list
      } else {
        toast.error(response.data.error || 'Request failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred');
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
      setPaymentLoading(true);
      const response = await api.post('/api/loan/pay', {
        loanId: selectedLoan._id,
        amount: paymentData.amount,
        slipImage: paymentData.slipImage,
      });

      if (response.data.success) {
        toast.success('Payment submitted successfully! Waiting for admin approval.');
        setShowPayment(false);
        setSelectedLoan(null);
        setPaymentData({ amount: '', slipImage: null });
        fetchLoans(); // Refresh loans list
      } else {
        toast.error(response.data.error || 'Payment failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred');
    } finally {
      setPaymentLoading(false);
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
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Loans</h1>
          <button
            onClick={() => setShowRequest(!showRequest)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showRequest ? 'Cancel' : 'Request Loan'}
          </button>
        </div>

        {showRequest && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Request Loan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter loan amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Explain the reason for loan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (months)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="12"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Submit Request
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">No loan requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Principal & Interest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
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
                  
                  return (
                    <tr key={loan._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <div className="flex flex-col">
                          <span>₹{principalAmount.toLocaleString('en-IN')}</span>
                          {interestAmount > 0 && (
                            <span className="text-xs text-gray-500">
                              Interest: ₹{interestAmount.toFixed(2).toLocaleString('en-IN')}
                            </span>
                          )}
                          {totalPayable > principalAmount && (
                            <span className="text-xs font-medium text-blue-600">
                              Total: ₹{totalPayable.toFixed(2).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {loan.interestRate ? `${loan.interestRate}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">₹{pendingAmount.toFixed(2).toLocaleString('en-IN')}</span>
                          {installmentsCount > 0 && (
                            <span className="text-xs text-gray-500">
                              {installmentsCount} payment{installmentsCount > 1 ? 's' : ''} (₹{totalPaid.toFixed(2).toLocaleString('en-IN')})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {loan.duration || 12} months
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                            {loan.status}
                          </span>
                          {loan.adminRemarks && (
                            <span className="text-xs text-gray-500 italic" title={loan.adminRemarks}>
                              {loan.adminRemarks.length > 20 ? `${loan.adminRemarks.substring(0, 20)}...` : loan.adminRemarks}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={loan.reason}>
                        {loan.reason || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{loan.createdAt ? new Date(loan.createdAt).toLocaleDateString('en-IN') : 'N/A'}</span>
                          {(loan.status === 'active' || loan.status === 'approved') && pendingAmount > 0 && (
                            <button
                              onClick={() => openPaymentModal(loan)}
                              className="mt-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Make Loan Payment</h2>
                  <button
                    onClick={() => {
                      setShowPayment(false);
                      setSelectedLoan(null);
                      setPaymentData({ amount: '', slipImage: null });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Principal:</span>
                      <span className="ml-2 font-semibold">₹{selectedLoan.amount?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    {selectedLoan.interestAmount > 0 && (
                      <div>
                        <span className="text-gray-600">Interest:</span>
                        <span className="ml-2 font-semibold">₹{selectedLoan.interestAmount.toFixed(2).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-600">Total Payable:</span>
                      <span className="ml-2 font-semibold text-blue-600">₹{(selectedLoan.totalPayable || selectedLoan.amount || 0).toFixed(2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Pending Amount:</span>
                      <span className="ml-2 font-semibold text-red-600">₹{(selectedLoan.pendingAmount || selectedLoan.amount || 0).toFixed(2).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      required
                      max={selectedLoan.pendingAmount}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter payment amount"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum: ₹{selectedLoan.pendingAmount?.toFixed(2).toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Slip Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentImageChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {paymentData.slipImage && (
                      <img src={paymentData.slipImage} alt="Payment Slip" className="mt-2 h-32 object-contain rounded" />
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {paymentLoading ? 'Submitting...' : 'Submit Payment'}
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


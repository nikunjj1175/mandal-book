import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PaymentDetails from '@/components/PaymentDetails';
import ImageEditor from '@/components/ImageEditor';
import toast from 'react-hot-toast';
import {
  useGetAdminOverviewQuery,
  useGetPendingUsersQuery,
  useApproveUserMutation,
  useRejectUserMutation,
  useGetPendingKYCQuery,
  useApproveKYCMutation,
  useRejectKYCMutation,
  useGetPendingContributionsQuery,
  useApproveContributionMutation,
  useRejectContributionMutation,
  useGetPendingLoansQuery,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useApproveInstallmentMutation,
  useRejectInstallmentMutation,
  useGetAllMembersQuery,
  useGetMemberByIdQuery,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useGetPaymentSettingsQuery,
  useUpdatePaymentSettingsMutation,
} from '@/store/api/adminApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Admin() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loanFilter, setLoanFilter] = useState('pending');
  const [selectedMember, setSelectedMember] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [processingIds, setProcessingIds] = useState({});

  // Redux hooks - conditional queries based on activeTab
  const { data: overviewData, isLoading: overviewLoading } = useGetAdminOverviewQuery(undefined, {
    skip: !user || user.role !== 'admin' || activeTab !== 'overview',
  });
  const { data: pendingUsersData, isLoading: pendingUsersLoading } = useGetPendingUsersQuery(undefined, {
    skip: !user || user.role !== 'admin' || activeTab !== 'approvals',
  });
  const { data: pendingKYCData, isLoading: pendingKYCLoading } = useGetPendingKYCQuery(undefined, {
    skip: !user || user.role !== 'admin' || activeTab !== 'kyc',
  });
  const { data: pendingContributionsData, isLoading: pendingContributionsLoading } = useGetPendingContributionsQuery(undefined, {
    skip: !user || user.role !== 'admin' || activeTab !== 'contributions',
  });
  const { data: pendingLoansData, isLoading: pendingLoansLoading } = useGetPendingLoansQuery(loanFilter, {
    skip: !user || user.role !== 'admin' || activeTab !== 'loans',
  });
  const { data: membersData, isLoading: membersLoading } = useGetAllMembersQuery(undefined, {
    skip: !user || user.role !== 'admin' || activeTab !== 'members',
  });
  const { data: memberData, isLoading: memberProfileLoading } = useGetMemberByIdQuery(selectedMember?._id, {
    skip: !user || user.role !== 'admin' || !selectedMember?._id,
  });

  // Redux mutations
  const [approveUser] = useApproveUserMutation();
  const [rejectUser] = useRejectUserMutation();
  const [approveKYC] = useApproveKYCMutation();
  const [rejectKYC] = useRejectKYCMutation();
  const [approveContribution] = useApproveContributionMutation();
  const [rejectContribution] = useRejectContributionMutation();
  const [approveLoan] = useApproveLoanMutation();
  const [rejectLoan] = useRejectLoanMutation();
  const [approveInstallment] = useApproveInstallmentMutation();
  const [rejectInstallment] = useRejectInstallmentMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [updatePaymentSettings] = useUpdatePaymentSettingsMutation();
  
  const [paymentSettings, setPaymentSettings] = useState({
    qrCodeUrl: '',
    upiId: '',
    qrCodeImage: null,
  });
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageToEdit, setImageToEdit] = useState(null);

  // Payment settings query - always fetch when admin, but only use when settings tab is active
  const { data: paymentSettingsData, isLoading: settingsLoading, error: settingsError } = useGetPaymentSettingsQuery(undefined, {
    skip: !user || user.role !== 'admin',
  });

  // Update payment settings form when data loads or tab changes
  useEffect(() => {
    if (activeTab === 'settings') {
      if (paymentSettingsData?.data) {
        setPaymentSettings(prev => ({
          ...prev,
          qrCodeUrl: paymentSettingsData.data.qrCodeUrl || '',
          upiId: paymentSettingsData.data.upiId || '',
          // Keep qrCodeImage if it exists (user might have uploaded)
        }));
      } else if (!settingsLoading) {
        // Initialize with empty values if no data and not loading
        setPaymentSettings({
          qrCodeUrl: '',
          upiId: '',
          qrCodeImage: null,
        });
      }
    }
  }, [paymentSettingsData, activeTab, settingsLoading]);

  // Extract data from queries
  const overview = overviewData?.data || null;
  const pendingApprovals = pendingUsersData?.data?.users || [];
  const kycUsers = pendingKYCData?.data?.users || [];
  const contributions = pendingContributionsData?.data?.contributions || [];
  const loans = pendingLoansData?.data?.loans || [];
  const members = membersData?.data?.members || [];

  const loading = overviewLoading || pendingUsersLoading || pendingKYCLoading || 
                  pendingContributionsLoading || pendingLoansLoading || membersLoading;

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Data is automatically fetched via Redux queries based on activeTab

  const handleKYCApprove = async (userId) => {
    setProcessingIds((prev) => ({ ...prev, [`kyc-approve-${userId}`]: true }));
    try {
      const result = await approveKYC(userId).unwrap();
      if (result.success) {
        toast.success('KYC approved');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to approve');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`kyc-approve-${userId}`]: false }));
    }
  };

  const handleKYCReject = async (userId, remarks) => {
    const remarksText = prompt('Enter rejection remarks:');
    if (!remarksText) return;

    setProcessingIds((prev) => ({ ...prev, [`kyc-reject-${userId}`]: true }));
    try {
      const result = await rejectKYC({ userId, reason: remarksText }).unwrap();
      if (result.success) {
        toast.success('KYC rejected');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to reject');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`kyc-reject-${userId}`]: false }));
    }
  };

  const handleContributionApprove = async (contributionId) => {
    setProcessingIds((prev) => ({ ...prev, [`contrib-approve-${contributionId}`]: true }));
    try {
      const result = await approveContribution(contributionId).unwrap();
      if (result.success) {
        toast.success('Contribution approved');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to approve');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`contrib-approve-${contributionId}`]: false }));
    }
  };

  const handleContributionReject = async (contributionId) => {
    const remarks = prompt('Enter rejection remarks:');
    if (!remarks) return;

    setProcessingIds((prev) => ({ ...prev, [`contrib-reject-${contributionId}`]: true }));
    try {
      const result = await rejectContribution({ contributionId, reason: remarks }).unwrap();
      if (result.success) {
        toast.success('Contribution rejected');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to reject');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`contrib-reject-${contributionId}`]: false }));
    }
  };

  const handleUserApprove = async (pendingUserId) => {
    setProcessingIds((prev) => ({ ...prev, [`user-approve-${pendingUserId}`]: true }));
    try {
      const result = await approveUser(pendingUserId).unwrap();
      if (result.success) {
        toast.success('User approved');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to approve user');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`user-approve-${pendingUserId}`]: false }));
    }
  };

  const handleUserReject = async (pendingUserId) => {
    const remarks = prompt('Enter rejection remarks:');
    if (remarks === null) return;

    setProcessingIds((prev) => ({ ...prev, [`user-reject-${pendingUserId}`]: true }));
    try {
      const result = await rejectUser({ userId: pendingUserId, remarks }).unwrap();
      if (result.success) {
        toast.success('User rejected');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to reject user');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`user-reject-${pendingUserId}`]: false }));
    }
  };

  const handleLoanApprove = async (loanId) => {
    const interestInput = prompt('Set interest rate (%)', '12');
    if (interestInput === null) return;
    const interestRate = parseFloat(interestInput);
    if (Number.isNaN(interestRate)) {
      toast.error('Invalid interest rate');
      return;
    }
    const durationInput = prompt('Set duration (months)', '12');
    if (durationInput === null) return;
    const duration = parseInt(durationInput, 10);
    if (isNaN(duration) || duration < 1) {
      toast.error('Invalid duration');
      return;
    }
    setProcessingIds((prev) => ({ ...prev, [`loan-approve-${loanId}`]: true }));
    try {
      const result = await approveLoan({ loanId, interestRate, duration }).unwrap();
      if (result.success) {
        toast.success('Loan approved');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to approve loan');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`loan-approve-${loanId}`]: false }));
    }
  };

  const handleLoanReject = async (loanId) => {
    const remarks = prompt('Enter rejection remarks:');
    if (remarks === null) return;
    setProcessingIds((prev) => ({ ...prev, [`loan-reject-${loanId}`]: true }));
    try {
      const result = await rejectLoan({ loanId, reason: remarks }).unwrap();
      if (result.success) {
        toast.success('Loan rejected');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to reject loan');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`loan-reject-${loanId}`]: false }));
    }
  };

  const handleInstallmentApprove = async (loanId, installmentIndex) => {
    setProcessingIds((prev) => ({ ...prev, [`installment-approve-${loanId}-${installmentIndex}`]: true }));
    try {
      const result = await approveInstallment({ loanId, installmentIndex }).unwrap();
      if (result.success) {
        toast.success('Installment approved');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to approve installment');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`installment-approve-${loanId}-${installmentIndex}`]: false }));
    }
  };

  const handleInstallmentReject = async (loanId, installmentIndex) => {
    const remarks = prompt('Enter rejection remarks:');
    if (remarks === null) return;
    setProcessingIds((prev) => ({ ...prev, [`installment-reject-${loanId}-${installmentIndex}`]: true }));
    try {
      const result = await rejectInstallment({ loanId, installmentIndex, reason: remarks }).unwrap();
      if (result.success) {
        toast.success('Installment rejected');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to reject installment');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`installment-reject-${loanId}-${installmentIndex}`]: false }));
    }
  };

  const handleViewMember = (memberId) => {
    const member = members.find(m => m._id === memberId);
    if (member) {
      setSelectedMember(member);
    } else {
      // If member not in list, set the ID to trigger the query
      setSelectedMember({ _id: memberId });
    }
  };

  const handleActivateUser = async (userId) => {
    setProcessingIds((prev) => ({ ...prev, [`user-activate-${userId}`]: true }));
    try {
      const result = await activateUser({ userId }).unwrap();
      if (result.success) {
        toast.success('User activated successfully');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to activate user');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`user-activate-${userId}`]: false }));
    }
  };

  const handleDeactivateUser = async (userId) => {
    const reason = prompt('Enter deactivation reason (optional):');
    if (reason === null) return; // User cancelled
    
    setProcessingIds((prev) => ({ ...prev, [`user-deactivate-${userId}`]: true }));
    try {
      const result = await deactivateUser({ userId, reason: reason || undefined }).unwrap();
      if (result.success) {
        toast.success('User deactivated successfully');
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to deactivate user');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [`user-deactivate-${userId}`]: false }));
    }
  };

  const handlePaymentSettingsUpdate = async (e) => {
    e.preventDefault();
    setProcessingIds((prev) => ({ ...prev, 'payment-settings': true }));
    try {
      const result = await updatePaymentSettings({
        qrCodeUrl: paymentSettings.qrCodeUrl,
        upiId: paymentSettings.upiId,
        qrCodeImage: paymentSettings.qrCodeImage,
      }).unwrap();
      if (result.success) {
        toast.success('Payment settings updated successfully');
        setPaymentSettings({
          ...paymentSettings,
          qrCodeImage: null, // Clear image after upload
        });
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to update payment settings');
    } finally {
      setProcessingIds((prev) => ({ ...prev, 'payment-settings': false }));
    }
  };

  const handleQRCodeImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToEdit(reader.result);
        setShowImageEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageEditorSave = (editedImage) => {
    setPaymentSettings({
      ...paymentSettings,
      qrCodeImage: editedImage,
    });
    setShowImageEditor(false);
    setImageToEdit(null);
    toast.success('QR code image processed successfully');
  };

  const handleImageEditorCancel = () => {
    setShowImageEditor(false);
    setImageToEdit(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  // Use memberData from Redux if available, otherwise use selectedMember from state
  const displayMember = memberData?.data?.member || selectedMember;

  if (!user || user.role !== 'admin') return null;

  const overviewChart =
    overview?.contributionsByMonth?.length
      ? {
          labels: overview.contributionsByMonth.map((entry) => entry.month),
          datasets: [
            {
              label: 'Monthly Fund Inflow (₹)',
              data: overview.contributionsByMonth.map((entry) => entry.total),
              backgroundColor: 'rgba(37, 99, 235, 0.6)',
              borderRadius: 8,
            },
          ],
        }
      : null;

  const loanFilters = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'active', label: 'Active' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'approvals', label: 'Pending Users' },
              { key: 'kyc', label: 'KYC Requests' },
              { key: 'contributions', label: 'Contributions' },
              { key: 'loans', label: 'Loans' },
              { key: 'members', label: 'Members' },
              { key: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {overview ? (
                  <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                      <div className="bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{overview.stats.totalMembers}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
                        <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{overview.stats.pendingApprovals}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending KYC</p>
                        <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">{overview.stats.pendingKYC}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Fund</p>
                        <p className="text-2xl font-semibold text-green-600 dark:text-green-400">₹{overview.stats.totalFund}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">All Contributions</p>
                        <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                          {overview.stats.totalContributionsCount}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Contributions</h2>
                        {overviewChart ? (
                          <Bar
                            data={overviewChart}
                            options={{
                              responsive: true,
                              plugins: { legend: { display: false } },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: { callback: (value) => `₹${value}` },
                                },
                              },
                            }}
                          />
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No contribution data yet.</p>
                        )}
                      </div>
                      
                      {/* Payment Details Section */}
                      <PaymentDetails />
                    </div>
                  </>
                ) : (
                  <div className="bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-12 text-center text-gray-500 dark:text-gray-400">
                    No data yet
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 overflow-hidden">
                {pendingApprovals.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">No pending user approvals</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {pendingApprovals.map((pendingUser) => (
                        <tr key={pendingUser._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{pendingUser.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pendingUser.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(pendingUser.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleUserApprove(pendingUser._id)}
                              disabled={processingIds[`user-approve-${pendingUser._id}`] || processingIds[`user-reject-${pendingUser._id}`]}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {processingIds[`user-approve-${pendingUser._id}`] && (
                                <span className="w-3 h-3 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></span>
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleUserReject(pendingUser._id)}
                              disabled={processingIds[`user-approve-${pendingUser._id}`] || processingIds[`user-reject-${pendingUser._id}`]}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {processingIds[`user-reject-${pendingUser._id}`] && (
                                <span className="w-3 h-3 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></span>
                              )}
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'kyc' && (
              <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 overflow-hidden">
                {kycUsers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">No pending KYC requests</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {kycUsers.map((kycUser) => (
                        <tr key={kycUser._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {kycUser.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {kycUser.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {kycUser.kycStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleKYCApprove(kycUser._id)}
                              disabled={processingIds[`kyc-approve-${kycUser._id}`] || processingIds[`kyc-reject-${kycUser._id}`]}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {processingIds[`kyc-approve-${kycUser._id}`] && (
                                <span className="w-3 h-3 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></span>
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleKYCReject(kycUser._id)}
                              disabled={processingIds[`kyc-approve-${kycUser._id}`] || processingIds[`kyc-reject-${kycUser._id}`]}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {processingIds[`kyc-reject-${kycUser._id}`] && (
                                <span className="w-3 h-3 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></span>
                              )}
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'contributions' && (
              <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 overflow-hidden">
                {contributions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">No pending contributions</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {contributions.map((contribution) => (
                        <tr key={contribution._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {contribution.userId?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contribution.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            ₹{contribution.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contribution.ocrData.transactionId || 'N/A'}
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                             <button
                               type="button"
                               onClick={() => setPreviewImage(contribution.slipImage)}
                               className="text-blue-600 hover:text-blue-900 underline"
                             >
                               View Slip
                             </button>
                            <button
                              onClick={() => handleContributionApprove(contribution._id)}
                              disabled={processingIds[`contrib-approve-${contribution._id}`] || processingIds[`contrib-reject-${contribution._id}`]}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {processingIds[`contrib-approve-${contribution._id}`] && (
                                <span className="w-3 h-3 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></span>
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleContributionReject(contribution._id)}
                              disabled={processingIds[`contrib-approve-${contribution._id}`] || processingIds[`contrib-reject-${contribution._id}`]}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {processingIds[`contrib-reject-${contribution._id}`] && (
                                <span className="w-3 h-3 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></span>
                              )}
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'loans' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">Loan Requests</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {loanFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setLoanFilter(filter.value)}
                        className={`rounded-full border px-3 py-1 text-sm font-medium ${
                          loanFilter === filter.value
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                {loans.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-12 text-center text-gray-500 dark:text-gray-400">
                    No loans in this category
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {loans.map((loan) => (
                      <div key={loan._id} className="bg-white dark:bg-slate-800 shadow rounded-2xl dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Borrower</p>
                            <p className="text-base font-semibold text-gray-900">{loan.userId?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{loan.userId?.email}</p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                              loan.status === 'approved' || loan.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : loan.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Amount</p>
                            <p className="text-base font-semibold text-gray-900">₹{loan.amount}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Interest Rate</p>
                            <p className="text-base font-semibold text-gray-900">
                              {loan.interestRate ? `${loan.interestRate}%` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Duration</p>
                            <p className="text-base font-semibold text-gray-900">{loan.duration} months</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Pending Amount</p>
                            <p className="text-base font-semibold text-gray-900">₹{loan.pendingAmount}</p>
                          </div>
                          <div className="sm:col-span-2 lg:col-span-2">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Reason</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{loan.reason || '—'}</p>
                          </div>
                        </div>
                        
                        {/* Installment Details */}
                        {loan.installmentsPaid && loan.installmentsPaid.length > 0 && (
                          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Installments ({loan.installmentsPaid.length})</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {loan.installmentsPaid.map((installment, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded text-xs">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">#{idx + 1}</span>
                                      <span>₹{installment.amount?.toFixed(2).toLocaleString('en-IN') || '0'}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                                        installment.status === 'approved' 
                                          ? 'bg-green-100 text-green-800'
                                          : installment.status === 'rejected'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {installment.status}
                                      </span>
                                    </div>
                                    {installment.date && (
                                      <p className="text-gray-500 text-xs mt-0.5">
                                        {new Date(installment.date).toLocaleDateString('en-IN')}
                                      </p>
                                    )}
                                  </div>
                                  {installment.status === 'pending' && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleInstallmentApprove(loan._id, idx)}
                                        disabled={processingIds[`installment-approve-${loan._id}-${idx}`] || processingIds[`installment-reject-${loan._id}-${idx}`]}
                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                      >
                                        {processingIds[`installment-approve-${loan._id}-${idx}`] ? '...' : '✓'}
                                      </button>
                                      <button
                                        onClick={() => handleInstallmentReject(loan._id, idx)}
                                        disabled={processingIds[`installment-approve-${loan._id}-${idx}`] || processingIds[`installment-reject-${loan._id}-${idx}`]}
                                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                                      >
                                        {processingIds[`installment-reject-${loan._id}-${idx}`] ? '...' : '✕'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleLoanApprove(loan._id)}
                            disabled={loan.status !== 'pending' || processingIds[`loan-approve-${loan._id}`] || processingIds[`loan-reject-${loan._id}`]}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {processingIds[`loan-approve-${loan._id}`] && (
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleLoanReject(loan._id)}
                            disabled={loan.status !== 'pending' || processingIds[`loan-approve-${loan._id}`] || processingIds[`loan-reject-${loan._id}`]}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {processingIds[`loan-reject-${loan._id}`] && (
                              <span className="w-3 h-3 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></span>
                            )}
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow rounded-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-700 overflow-hidden">
                {members.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">No members found</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {members.map((member) => (
                        <tr key={member._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{member.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.mobile}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                member.kycStatus === 'verified'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : member.kycStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}
                            >
                              {member.kycStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {member.adminApprovalStatus || 'pending'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              member.isActive !== false
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {member.isActive !== false ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleViewMember(member._id)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View Profile
                            </button>
                            {member.isActive !== false ? (
                              <button
                                onClick={() => handleDeactivateUser(member._id)}
                                disabled={processingIds[`user-deactivate-${member._id}`] || processingIds[`user-activate-${member._id}`]}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingIds[`user-deactivate-${member._id}`] ? '...' : 'Deactivate'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(member._id)}
                                disabled={processingIds[`user-deactivate-${member._id}`] || processingIds[`user-activate-${member._id}`]}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingIds[`user-activate-${member._id}`] ? '...' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
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

      {selectedMember && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-slate-900/70 border border-gray-200 dark:border-slate-700 p-6 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{displayMember?.name || 'Loading...'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Joined {displayMember?.createdAt ? new Date(displayMember.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            {memberProfileLoading ? (
              <div className="py-12 text-center text-gray-500">Loading profile...</div>
            ) : (
              <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Email</p>
                    <p className="text-gray-600 dark:text-gray-400">{displayMember?.email || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Mobile</p>
                    <p className="text-gray-600 dark:text-gray-400">{displayMember?.mobile || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Address</p>
                    <p className="text-gray-600 dark:text-gray-400">{displayMember?.address || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">DOB</p>
                    <p className="text-gray-600 dark:text-gray-400">{displayMember?.dob || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Admin Approval</p>
                    <p className="capitalize text-gray-600 dark:text-gray-400">{displayMember?.adminApprovalStatus || 'pending'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">KYC Status</p>
                    <p className="capitalize text-gray-600 dark:text-gray-400">{displayMember?.kycStatus || 'pending'}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Aadhaar</p>
                    <p className="text-gray-600 dark:text-gray-400">{displayMember?.aadhaarNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">PAN</p>
                    <p className="text-gray-600 dark:text-gray-400">{displayMember?.panNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Account Number</p>
                    <p className="text-gray-600 dark:text-gray-400">{displayMember?.bankDetails?.accountNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">IFSC</p>
                    <p className="text-gray-600 dark:text-gray-400">{displayMember?.bankDetails?.ifscCode || '—'}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {displayMember?.aadhaarFront && (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Aadhaar Front</p>
                      <img
                        src={displayMember.aadhaarFront}
                        alt="Aadhaar Front"
                        className="w-full rounded-lg border border-gray-200 dark:border-slate-700"
                        onClick={() => setPreviewImage(displayMember.aadhaarFront)}
                      />
                    </div>
                  )}
                  {displayMember?.panImage && (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">PAN</p>
                      <img 
                        src={displayMember.panImage} 
                        alt="PAN" 
                        className="w-full rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer"
                        onClick={() => setPreviewImage(displayMember.panImage)}
                      />
                    </div>
                  )}
                  {displayMember?.bankDetails?.passbookImage && (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Passbook</p>
                      <img
                        src={displayMember.bankDetails.passbookImage}
                        alt="Passbook"
                        className="w-full rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer"
                        onClick={() => setPreviewImage(displayMember.bankDetails.passbookImage)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Payment Settings</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Configure QR code and UPI ID for payment collection
                    </p>
                  </div>
                  
                  {settingsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading settings...</p>
                    </div>
                  ) : (
                    <form onSubmit={handlePaymentSettingsUpdate} className="space-y-8">
                      {/* QR Code Section */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          QR Code Configuration
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Image Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Upload QR Code Image
                            </label>
                            <div className="flex items-center gap-4">
                              <label className="flex-1 cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleQRCodeImageChange}
                                  className="hidden"
                                />
                                <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                                  <div className="text-center">
                                    <svg className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* Preview Section */}
                          {(paymentSettings.qrCodeImage || paymentSettingsData?.data?.qrCodeUrl) && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                {paymentSettings.qrCodeImage ? 'New QR Code Preview' : 'Current QR Code'}
                              </p>
                              <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 shadow-sm">
                                  <img
                                    src={paymentSettings.qrCodeImage || paymentSettingsData?.data?.qrCodeUrl}
                                    alt="QR Code"
                                    className="w-32 h-32 object-contain"
                                  />
                                </div>
                                {paymentSettings.qrCodeImage && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setImageToEdit(paymentSettings.qrCodeImage);
                                      setShowImageEditor(true);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                  >
                                    Edit Image
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* QR Code URL (Alternative) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Or Enter QR Code URL
                            </label>
                            <input
                              type="url"
                              value={paymentSettings.qrCodeUrl}
                              onChange={(e) => setPaymentSettings({ ...paymentSettings, qrCodeUrl: e.target.value })}
                              placeholder="https://res.cloudinary.com/your-cloud/image/upload/qr-code.png"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Enter a direct URL to QR code image (e.g., Cloudinary link)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* UPI ID Section */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          UPI ID Configuration
                        </h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            UPI ID
                          </label>
                          <input
                            type="text"
                            value={paymentSettings.upiId || ''}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                            placeholder="your-upi-id@paytm"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors font-mono"
                          />
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Enter your UPI ID (e.g., mandal@paytm, mandal@ybl, mandal@phonepe)
                          </p>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentSettings({
                              qrCodeUrl: paymentSettingsData?.data?.qrCodeUrl || '',
                              upiId: paymentSettingsData?.data?.upiId || '',
                              qrCodeImage: null,
                            });
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          disabled={processingIds['payment-settings']}
                          className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all"
                        >
                          {processingIds['payment-settings'] ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              Updating Settings...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Save Settings
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Image Editor Modal */}
            {showImageEditor && imageToEdit && (
              <ImageEditor
                image={imageToEdit}
                onSave={handleImageEditorSave}
                onCancel={handleImageEditorCancel}
              />
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}


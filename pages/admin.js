import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
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
  const [overview, setOverview] = useState(null);
  const [kycUsers, setKycUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loanFilter, setLoanFilter] = useState('pending');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfileLoading, setMemberProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user && activeTab === 'loans') {
      fetchData('loans');
    }
  }, [loanFilter]);

  const fetchData = async (tabOverride) => {
    setLoading(true);
    try {
      const currentTab = tabOverride || activeTab;
      if (currentTab === 'overview') {
        const response = await api.get('/api/admin/overview');
        if (response.data.success) {
          setOverview(response.data.data);
        }
      } else if (currentTab === 'approvals') {
        const response = await api.get('/api/admin/users/pending');
        if (response.data.success) {
          setPendingApprovals(response.data.data.users);
        }
      } else if (currentTab === 'kyc') {
        const response = await api.get('/api/admin/kyc/pending');
        if (response.data.success) {
          setKycUsers(response.data.data.users);
        }
      } else if (currentTab === 'members') {
        const response = await api.get('/api/admin/members');
        if (response.data.success) {
          setMembers(response.data.data.members);
        }
      } else if (currentTab === 'contributions') {
        const response = await api.get('/api/admin/contribution/pending');
        if (response.data.success) {
          setContributions(response.data.data.contributions);
        }
      } else if (currentTab === 'loans') {
        const response = await api.get(`/api/admin/loan/list?status=${loanFilter}`);
        if (response.data.success) {
          setLoans(response.data.data.loans);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleKYCApprove = async (userId) => {
    try {
      const response = await api.post('/api/admin/kyc/approve', { userId });
      if (response.data.success) {
        toast.success('KYC approved');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleKYCReject = async (userId, remarks) => {
    const remarksText = prompt('Enter rejection remarks:');
    if (!remarksText) return;

    try {
      const response = await api.post('/api/admin/kyc/reject', { userId, remarks: remarksText });
      if (response.data.success) {
        toast.success('KYC rejected');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject');
    }
  };

  const handleContributionApprove = async (contributionId) => {
    try {
      const response = await api.post('/api/admin/contribution/approve', { contributionId });
      if (response.data.success) {
        toast.success('Contribution approved');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleContributionReject = async (contributionId) => {
    const remarks = prompt('Enter rejection remarks:');
    if (!remarks) return;

    try {
      const response = await api.post('/api/admin/contribution/reject', {
        contributionId,
        remarks,
      });
      if (response.data.success) {
        toast.success('Contribution rejected');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject');
    }
  };

  const handleUserApprove = async (pendingUserId) => {
    try {
      const response = await api.post('/api/admin/users/approve', { userId: pendingUserId });
      if (response.data.success) {
        toast.success('User approved');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve user');
    }
  };

  const handleUserReject = async (pendingUserId) => {
    const remarks = prompt('Enter rejection remarks:');
    if (remarks === null) return;

    try {
      const response = await api.post('/api/admin/users/reject', { userId: pendingUserId, remarks });
      if (response.data.success) {
        toast.success('User rejected');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject user');
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
    try {
      const response = await api.post('/api/admin/loan/approve', { loanId, interestRate });
      if (response.data.success) {
        toast.success('Loan approved');
        fetchData('loans');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve loan');
    }
  };

  const handleLoanReject = async (loanId) => {
    const remarks = prompt('Enter rejection remarks:');
    if (remarks === null) return;
    try {
      const response = await api.post('/api/admin/loan/reject', { loanId, remarks });
      if (response.data.success) {
        toast.success('Loan rejected');
        fetchData('loans');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject loan');
    }
  };

  const handleViewMember = async (memberId) => {
    try {
      setMemberProfileLoading(true);
      const response = await api.get(`/api/admin/members/${memberId}`);
      if (response.data.success) {
        setSelectedMember(response.data.data.member);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load member profile');
    } finally {
      setMemberProfileLoading(false);
    }
  };

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
                      <div className="bg-white shadow rounded-lg p-5">
                        <p className="text-sm text-gray-500">Total Members</p>
                        <p className="text-2xl font-semibold text-gray-900">{overview.stats.totalMembers}</p>
                      </div>
                      <div className="bg-white shadow rounded-lg p-5">
                        <p className="text-sm text-gray-500">Pending Approvals</p>
                        <p className="text-2xl font-semibold text-yellow-600">{overview.stats.pendingApprovals}</p>
                      </div>
                      <div className="bg-white shadow rounded-lg p-5">
                        <p className="text-sm text-gray-500">Pending KYC</p>
                        <p className="text-2xl font-semibold text-orange-600">{overview.stats.pendingKYC}</p>
                      </div>
                      <div className="bg-white shadow rounded-lg p-5">
                        <p className="text-sm text-gray-500">Total Fund</p>
                        <p className="text-2xl font-semibold text-green-600">₹{overview.stats.totalFund}</p>
                      </div>
                      <div className="bg-white shadow rounded-lg p-5">
                        <p className="text-sm text-gray-500">All Contributions</p>
                        <p className="text-2xl font-semibold text-indigo-600">
                          {overview.stats.totalContributionsCount}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Contributions</h2>
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
                        <p className="text-gray-500 text-center py-8">No contribution data yet.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">No data yet</div>
                )}
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="overflow-x-auto bg-white shadow rounded-lg overflow-hidden">
                {pendingApprovals.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No pending user approvals</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingApprovals.map((pendingUser) => (
                        <tr key={pendingUser._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pendingUser.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pendingUser.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(pendingUser.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleUserApprove(pendingUser._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUserReject(pendingUser._id)}
                              className="text-red-600 hover:text-red-900"
                            >
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
              <div className="overflow-x-auto bg-white shadow rounded-lg overflow-hidden">
                {kycUsers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No pending KYC requests</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {kycUsers.map((kycUser) => (
                        <tr key={kycUser._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleKYCReject(kycUser._id)}
                              className="text-red-600 hover:text-red-900"
                            >
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
              <div className="overflow-x-auto bg-white shadow rounded-lg overflow-hidden">
                {contributions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No pending contributions</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contributions.map((contribution) => (
                        <tr key={contribution._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contribution.userId?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contribution.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleContributionReject(contribution._id)}
                              className="text-red-600 hover:text-red-900"
                            >
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
                  <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                    No loans in this category
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {loans.map((loan) => (
                      <div key={loan._id} className="bg-white shadow rounded-2xl p-6 space-y-4">
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
                            <p className="text-sm text-gray-700">{loan.reason || '—'}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleLoanApprove(loan._id)}
                            disabled={loan.status !== 'pending'}
                            className="inline-flex flex-1 items-center justify-center rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleLoanReject(loan._id)}
                            disabled={loan.status !== 'pending'}
                            className="inline-flex flex-1 items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition disabled:opacity-40"
                          >
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
              <div className="overflow-x-auto bg-white shadow rounded-lg overflow-hidden">
                {members.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No members found</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map((member) => (
                        <tr key={member._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.mobile}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                member.kycStatus === 'verified'
                                  ? 'bg-green-100 text-green-800'
                                  : member.kycStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {member.kycStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {member.adminApprovalStatus || 'pending'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewMember(member._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Profile
                            </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">{selectedMember.name}</h2>
              <p className="text-sm text-gray-500">Joined {new Date(selectedMember.createdAt).toLocaleDateString()}</p>
            </div>
            {memberProfileLoading ? (
              <div className="py-12 text-center text-gray-500">Loading profile...</div>
            ) : (
              <div className="space-y-6 text-sm text-gray-700">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p>{selectedMember.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mobile</p>
                    <p>{selectedMember.mobile}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p>{selectedMember.address || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">DOB</p>
                    <p>{selectedMember.dob || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Admin Approval</p>
                    <p className="capitalize">{selectedMember.adminApprovalStatus || 'pending'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">KYC Status</p>
                    <p className="capitalize">{selectedMember.kycStatus || 'pending'}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-gray-900">Aadhaar</p>
                    <p>{selectedMember.aadhaarNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">PAN</p>
                    <p>{selectedMember.panNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Account Number</p>
                    <p>{selectedMember.bankDetails?.accountNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">IFSC</p>
                    <p>{selectedMember.bankDetails?.ifscCode || '—'}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {selectedMember.aadhaarFront && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Aadhaar Front</p>
                      <img
                        src={selectedMember.aadhaarFront}
                        alt="Aadhaar Front"
                        className="w-full rounded-lg border"
                      />
                    </div>
                  )}
                  {selectedMember.panImage && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">PAN</p>
                      <img src={selectedMember.panImage} alt="PAN" className="w-full rounded-lg border" />
                    </div>
                  )}
                  {selectedMember.bankDetails?.passbookImage && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Passbook</p>
                      <img
                        src={selectedMember.bankDetails.passbookImage}
                        alt="Passbook"
                        className="w-full rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}


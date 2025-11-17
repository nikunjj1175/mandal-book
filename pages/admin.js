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
  const [contributions, setContributions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const response = await api.get('/api/admin/overview');
        if (response.data.success) {
          setOverview(response.data.data);
        }
      } else if (activeTab === 'approvals') {
        const response = await api.get('/api/admin/users/pending');
        if (response.data.success) {
          setPendingApprovals(response.data.data.users);
        }
      } else if (activeTab === 'kyc') {
        const response = await api.get('/api/admin/kyc/pending');
        if (response.data.success) {
          setKycUsers(response.data.data.users);
        }
      } else if (activeTab === 'contributions') {
        const response = await api.get('/api/admin/contribution/pending');
        if (response.data.success) {
          setContributions(response.data.data.contributions);
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
              <div className="bg-white shadow rounded-lg overflow-hidden">
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
              <div className="bg-white shadow rounded-lg overflow-hidden">
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
              <div className="bg-white shadow rounded-lg overflow-hidden">
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
                            {contribution.referenceId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <a
                              href={contribution.slipImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Slip
                            </a>
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
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                Loan management coming soon...
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}


import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import PendingApprovalMessage from '@/components/PendingApproval';
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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [chartFilter, setChartFilter] = useState('6');
  const [chartData, setChartData] = useState(null);
  const [contributionHistory, setContributionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.adminApprovalStatus !== 'approved') return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [contributionsRes, globalRes] = await Promise.all([
        api.get('/api/contribution/my'),
        api.get('/api/contribution/stats'),
      ]);
      const contributions = contributionsRes.data.data.contributions || [];

      // Calculate stats
      const totalContributions = contributions.filter((c) => c.status === 'done').length;
      const pendingContributions = contributions.filter((c) => c.status === 'pending').length;
      const totalAmount = contributions
        .filter((c) => c.status === 'done')
        .reduce((sum, c) => sum + c.amount, 0);

      const statsPayload = {
        totalContributions,
        pendingContributions,
        totalAmount,
        kycStatus: user.kycStatus,
      };

      setStats(statsPayload);
      setGlobalStats(globalRes.data.data);
      setContributionHistory(contributions);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const chartTotals = useMemo(() => {
    if (!globalStats?.monthlyTotals?.length) return [];
    if (chartFilter === 'all') return globalStats.monthlyTotals;
    const limit = parseInt(chartFilter, 10);
    return globalStats.monthlyTotals.slice(-limit);
  }, [globalStats, chartFilter]);

  useEffect(() => {
    if (!chartTotals.length) {
      setChartData(null);
      return;
    }
    setChartData({
      labels: chartTotals.map((item) => item.month),
      datasets: [
        {
          label: 'All Members Contributions (₹)',
          data: chartTotals.map((item) => item.total),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderRadius: 8,
        },
      ],
    });
  }, [chartTotals]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const awaitingApproval = user.role !== 'admin' && user.adminApprovalStatus !== 'approved';

  if (awaitingApproval) {
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

  const chartRanges = [
    { value: '3', label: '3M' },
    { value: '6', label: '6M' },
    { value: '12', label: '12M' },
    { value: 'all', label: 'All' },
  ];

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* KYC Status Alert */}
        {!user.kycStatus || ['pending', 'under_review', 'rejected'].includes(user.kycStatus) ? (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {user.kycStatus === 'pending'
                    ? 'Please complete your KYC verification to access all features.'
                    : user.kycStatus === 'under_review'
                    ? 'Your KYC is under review. Please wait for admin approval.'
                    : 'Your KYC was rejected. Please update your documents.'}
                </p>
                {user.kycStatus !== 'under_review' && (
                  <button
                    onClick={() => router.push('/kyc')}
                    className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    Complete KYC →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Σ</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">All Mandal Contributions</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{globalStats?.totalAmount?.toLocaleString() || 0}
                    </dd>
                    <dd className="text-xs text-gray-500">
                      {globalStats?.totalContributions || 0} approved
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">₹</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Contributed</dt>
                    <dd className="text-lg font-medium text-gray-900">₹{stats?.totalAmount || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalContributions || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.pendingContributions || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">K</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">KYC Status</dt>
                    <dd className="text-lg font-medium text-gray-900 capitalize">
                      {user.kycStatus || 'Pending'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Chart */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Member Contribution Trend</h2>
              <p className="text-sm text-gray-500">Aggregated approved contributions across the mandal</p>
            </div>
            <div className="flex items-center gap-2">
              {chartRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setChartFilter(range.value)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${
                    chartFilter === range.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          {chartData && chartData.labels.length ? (
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `₹${value}`,
                    },
                  },
                },
              }}
            />
          ) : (
            <p className="text-gray-500">No contribution data yet.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push('/contributions')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <h3 className="font-medium text-gray-900">Upload Contribution</h3>
              <p className="text-sm text-gray-500 mt-1">Upload your monthly contribution slip</p>
            </button>
            <button
              onClick={() => router.push('/loans')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <h3 className="font-medium text-gray-900">Request Loan</h3>
              <p className="text-sm text-gray-500 mt-1">Apply for a loan from the group</p>
            </button>
            {user.kycStatus !== 'verified' && (
              <button
                onClick={() => router.push('/kyc')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <h3 className="font-medium text-gray-900">Complete KYC</h3>
                <p className="text-sm text-gray-500 mt-1">Submit your KYC documents</p>
              </button>
            )}
          </div>
        </div>

        {/* Contribution List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contribution History</h2>
          {contributionHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No contributions logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contributionHistory.map((entry) => (
                    <tr key={entry._id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.month}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">₹{entry.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.status === 'done'
                              ? 'bg-green-100 text-green-800'
                              : entry.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.referenceId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


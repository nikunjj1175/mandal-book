import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import PendingApprovalMessage from '@/components/PendingApproval';
import { useTranslation } from '@/lib/useTranslation';
import { useGetMyContributionsQuery, useGetContributionStatsQuery, useLazyExportContributionDataQuery } from '@/store/api/contributionsApi';
import { useGetMembersQuery } from '@/store/api/membersApi';
import { generateContributionPDF } from '@/components/PDFGenerator';
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
  const { t } = useTranslation();
  const [chartStats, setChartStats] = useState(null);
  const [memberFilter, setMemberFilter] = useState('all');
  const [chartFilter, setChartFilter] = useState('6');
  const [chartData, setChartData] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Redux hooks
  const { data: contributionsData, isLoading: contributionsLoading } = useGetMyContributionsQuery(undefined, {
    skip: !user || user.role !== 'member' || user.adminApprovalStatus !== 'approved' || user.kycStatus !== 'verified',
  });
  // Get stats based on memberFilter - RTK Query will automatically refetch when memberFilter changes
  const memberIdForQuery = memberFilter === 'all' ? undefined : memberFilter;
  const { data: globalStatsData, isLoading: statsLoading } = useGetContributionStatsQuery(memberIdForQuery, {
    skip: !user || (user.role !== 'admin' && user.adminApprovalStatus !== 'approved'),
  });
  const { data: membersData } = useGetMembersQuery(undefined, {
    skip: !user,
  });
  const [exportData, { isLoading: exportLoading }] = useLazyExportContributionDataQuery();

  const contributions = contributionsData?.data?.contributions || [];
  const globalStats = globalStatsData?.data || null;

  // Prefer member options coming from stats API (only members who have contributions),
  // fallback to full members list if stats don't contain memberOptions yet.
  const memberOptions = useMemo(() => {
    if (globalStatsData?.data?.memberOptions?.length) {
      return globalStatsData.data.memberOptions.map((m) => ({
        id: m.id,
        name: m.name,
      }));
    }

    return membersData?.data?.members?.map((m) => ({
      id: m._id,
      name: m.name,
    })) || [];
  }, [globalStatsData, membersData]);

  // Initialize chartStats from globalStats if not set
  useEffect(() => {
    if (globalStats && !chartStats) {
      setChartStats(globalStats);
    }
  }, [globalStats, chartStats]);

  // Calculate stats from contributions
  const stats = useMemo(() => {
    if (!contributions.length) return null;
    const totalContributions = contributions.filter((c) => c.status === 'done').length;
    const pendingContributions = contributions.filter((c) => c.status === 'pending').length;
    const totalAmount = contributions
      .filter((c) => c.status === 'done')
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      totalContributions,
      pendingContributions,
      totalAmount,
      kycStatus: user?.kycStatus,
    };
  }, [contributions, user?.kycStatus]);

  const contributionHistory = contributions;
  const loading = contributionsLoading || statsLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const chartTotals = useMemo(() => {
    if (!chartStats?.monthlyTotals?.length) return [];
    if (chartFilter === 'all') return chartStats.monthlyTotals;
    const limit = parseInt(chartFilter, 10);
    return chartStats.monthlyTotals.slice(-limit);
  }, [chartStats, chartFilter]);

  // Update chartStats when globalStatsData changes (this happens automatically when memberFilter changes)
  useEffect(() => {
    if (globalStatsData?.data) {
      // Always update chartStats from the latest query result
      setChartStats(globalStatsData.data);
    }
  }, [globalStatsData]);

  const currentMemberLabel = useMemo(() => {
    if (memberFilter === 'all') return t('dashboard.allMembers');
    if (user && String(memberFilter) === String(user._id)) return t('dashboard.myContributions');
    const match = memberOptions.find((member) => String(member.id) === String(memberFilter));
    return match ? match.name : t('dashboard.allMembers');
  }, [memberFilter, memberOptions, user, t]);

  useEffect(() => {
    if (!chartTotals.length) {
      setChartData(null);
      return;
    }
    setChartData({
      labels: chartTotals.map((item) => item.month),
      datasets: [
        {
          label: `${currentMemberLabel} Contributions (₹)`,
          data: chartTotals.map((item) => item.total),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderRadius: 8,
        },
      ],
    });
  }, [chartTotals, currentMemberLabel]);

  const handleExportPDF = async () => {
    try {
      setPdfGenerating(true);
      toast.loading('Generating PDF report...', { id: 'pdf-export' });

      // Fetch detailed data using Redux
      const response = await exportData(memberFilter === 'all' ? undefined : memberFilter).unwrap();
      if (!response.success) {
        throw new Error('Failed to fetch data');
      }

      const { data } = response;

      // Generate PDF using separate component (always uses light theme)
      await generateContributionPDF(data, memberFilter, memberOptions);

      toast.dismiss('pdf-export');
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss('pdf-export');
      if (error.message?.includes('jspdf')) {
        toast.error('PDF library not found. Please install: npm install jspdf jspdf-autotable');
      } else {
        toast.error('Failed to generate PDF report');
      }
    } finally {
      setPdfGenerating(false);
    }
  };

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
  const showKycStatCard = user.kycStatus !== 'verified';

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-responsive-xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.title')}</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              {t('dashboard.welcomeBack')}, {user.name}
            </p>
          </div>
        </div>

        {/* Trip splits — highlighted entry (no nav link) */}
        {(user.role === 'admin' || (user.adminApprovalStatus === 'approved' && user.kycStatus === 'verified')) && (
          <Link
            href="/trips"
            className="no-print block rounded-2xl border-2 border-emerald-400/70 dark:border-emerald-500/50 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-slate-900 p-4 sm:p-5 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all ring-2 ring-emerald-400/30 dark:ring-emerald-500/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className="shrink-0 inline-flex items-center rounded-lg bg-emerald-600 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1 uppercase tracking-wider">
                  {t('dashboard.tripBannerBadge')}
                </span>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.tripBannerTitle')}</h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    {t('dashboard.tripBannerDesc')}
                  </p>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 sm:py-3 self-start sm:self-center">
                {t('dashboard.tripBannerCta')}
              </span>
            </div>
          </Link>
        )}

        {/* KYC Status Alert - Enhanced */}
        {!user.kycStatus || ['pending', 'under_review', 'rejected'].includes(user.kycStatus) ? (
          <div className="card bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="p-4 sm:p-5 flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  KYC Verification Required
                </h3>
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  {user.kycStatus === 'pending'
                    ? t('dashboard.kycAlertPending')
                    : user.kycStatus === 'under_review'
                    ? t('dashboard.kycAlertReview')
                    : t('dashboard.kycAlertRejected')}
                </p>
                {user.kycStatus !== 'under_review' && (
                  <button
                    onClick={() => router.push('/kyc')}
                    className="btn-primary bg-yellow-600 hover:bg-yellow-700 text-xs sm:text-sm px-4 py-2"
                  >
                    {t('dashboard.completeKYC')} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Stats Grid - Enhanced */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${
            showKycStatCard ? 'xl:grid-cols-5' : 'xl:grid-cols-4'
          } gap-4 sm:gap-5 lg:gap-6`}
        >
          <div className="stat-card card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 truncate">
                  {t('dashboard.allMemberContributions')}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  ₹{globalStats?.totalAmount?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {globalStats?.totalContributions || 0} {t('dashboard.approved').toLowerCase()}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg sm:text-xl font-bold">Σ</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 truncate">
                  {t('dashboard.totalContributed')}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  ₹{stats?.totalAmount?.toLocaleString() || 0}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg sm:text-xl font-bold">₹</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 truncate">
                  {t('dashboard.approved')}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.totalContributions || 0}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg sm:text-xl font-bold">✓</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 truncate">
                  {t('dashboard.pending')}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.pendingContributions || 0}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg sm:text-xl font-bold">⏳</span>
                </div>
              </div>
            </div>
          </div>

          {showKycStatCard && (
            <div className="stat-card card-hover group relative overflow-hidden border-amber-200/80 dark:border-amber-800/70 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-slate-900">
              <span className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-400/20 blur-xl animate-pulse"></span>
              <div className="flex items-center justify-between relative">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-amber-800/90 dark:text-amber-300 mb-2 truncate">
                    {t('dashboard.kycStatus')}
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-900 dark:text-amber-100 capitalize">
                    {user.kycStatus || t('dashboard.pending')}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-amber-500/40 animate-pulse">
                    <span className="text-white text-lg sm:text-xl font-bold">K</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contribution Chart - Enhanced */}
        <div className="card p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.contributionTrend')}</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.contributionTrendDesc')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={handleExportPDF}
                disabled={pdfGenerating}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium transition shadow-md"
              >
                {pdfGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('dashboard.generatingPDF')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('dashboard.exportPDF')}
                  </>
                )}
              </button>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-full px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('dashboard.allMembers')}</option>
                {user.role !== 'admin' && user._id && (
                  <option value={String(user._id)}>{t('dashboard.myContributions')}</option>
                )}
                {memberOptions.map((member) => (
                  <option key={member.id} value={String(member.id)}>
                    {member.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 sm:gap-2">
              {chartRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setChartFilter(range.value)}
                  className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-medium transition ${
                    chartFilter === range.value
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
              </div>
            </div>
          </div>
          {statsLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : chartData && chartData.labels.length ? (
            <Bar
              key={`chart-${memberFilter}-${chartFilter}`}
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
            <p className="text-gray-500">{t('dashboard.noData')}</p>
          )}
        </div>

        {/* Quick Actions - members only */}
        {user.role === 'member' && (
          <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/contributions')}
                className="p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left group"
              >
                <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('dashboard.uploadContribution')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.uploadContributionDesc')}</p>
              </button>
              <button
                onClick={() => router.push('/loans')}
                className="p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left group"
              >
                <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('dashboard.requestLoan')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.requestLoanDesc')}</p>
              </button>
              {user.kycStatus !== 'verified' && (
                <button
                  onClick={() => router.push('/kyc')}
                  className="p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left group"
                >
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('dashboard.completeKYC')}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.completeKYCDesc')}</p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contribution List - members only */}
        {user.role === 'member' && (
          <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">{t('dashboard.contributionHistory')}</h2>
            {contributionHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('dashboard.noContributions')}</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.month')}</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.amount')}</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.status')}</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.transactionId')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {contributionHistory.map((entry) => (
                        <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">{entry.month}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">₹{entry.amount.toLocaleString()}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.status === 'done'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : entry.status === 'rejected'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs sm:text-sm">{entry.ocrData?.transactionId || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}


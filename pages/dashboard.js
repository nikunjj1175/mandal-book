import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import PendingApprovalMessage from '@/components/PendingApproval';
import { useTranslation } from '@/lib/useTranslation';
import { useGetMyContributionsQuery, useGetContributionStatsQuery, useLazyExportContributionDataQuery } from '@/store/api/contributionsApi';
import { useGetMembersQuery } from '@/store/api/membersApi';
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
    skip: !user || (user.role !== 'admin' && user.adminApprovalStatus !== 'approved'),
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

      // Dynamically import jsPDF
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      // Fetch detailed data using Redux
      const response = await exportData(memberFilter === 'all' ? undefined : memberFilter).unwrap();
      if (!response.success) {
        throw new Error('Failed to fetch data');
      }

      const { data } = response;
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Colors
      const primaryColor = [37, 99, 235]; // Blue
      const headerColor = [17, 24, 39]; // Dark gray
      const lightGray = [243, 244, 246];

      // Title Page
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Mandal Contribution Report', 148, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 148, 30, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      let yPos = 50;

      // Summary Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Members: ${data.totalMembers}`, 14, yPos);
      yPos += 7;
      doc.text(`Total Contributions: ${data.totalContributions}`, 14, yPos);
      yPos += 7;
      doc.text(`Grand Total: Rs. ${data.grandTotal.toLocaleString('en-IN')}`, 14, yPos);
      yPos += 15;

      // Member-wise Table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Member-wise Contributions', 14, yPos);
      yPos += 10;

      const memberTableData = data.memberWise.map((member) => {
        const monthData = data.allMonths.map((month) => {
          const amount = member.months[month] || 0;
          return amount > 0 ? `Rs. ${amount.toLocaleString('en-IN')}` : '-';
        });

        return [
          member.name,
          ...monthData,
          `Rs. ${member.total.toLocaleString('en-IN')}`,
          member.count.toString(),
        ];
      });

      const memberHeaders = ['Member Name', ...data.allMonths, 'Total', 'Count'];

      autoTable(doc, {
        head: [memberHeaders],
        body: memberTableData,
        startY: yPos,
        theme: 'striped',
        headStyles: {
          fillColor: headerColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 40 },
        },
        margin: { left: 14, right: 14 },
        styles: {
          cellPadding: 2,
          overflow: 'linebreak',
        },
        didDrawPage: (data) => {
          // Add page numbers
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          const pageCount = doc.internal.getNumberOfPages();
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        },
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // Month-wise Summary Table
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Month-wise Summary', 14, yPos);
      yPos += 10;

      const monthTableData = data.monthWise.map((month) => [
        month.month,
        Object.keys(month.members).length.toString(),
        `Rs. ${month.total.toLocaleString('en-IN')}`,
      ]);

      autoTable(doc, {
        head: [['Month', 'Contributions', 'Total Amount']],
        body: monthTableData,
        startY: yPos,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
        },
        margin: { left: 14, right: 14 },
      });

      // Save PDF
      const fileName = `Mandal_Contribution_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

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

  return (
    <Layout>
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">{t('dashboard.title')}</h1>

        {/* KYC Status Alert */}
        {!user.kycStatus || ['pending', 'under_review', 'rejected'].includes(user.kycStatus) ? (
          <div className="mb-4 sm:mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-3 sm:p-4 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                  {user.kycStatus === 'pending'
                    ? t('dashboard.kycAlertPending')
                    : user.kycStatus === 'under_review'
                    ? t('dashboard.kycAlertReview')
                    : t('dashboard.kycAlertRejected')}
                </p>
                {user.kycStatus !== 'under_review' && (
                  <button
                    onClick={() => router.push('/kyc')}
                    className="mt-2 text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
                  >
                    {t('dashboard.completeKYC')} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-md dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg">
            <div className="p-4 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 dark:bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white text-base sm:text-lg font-bold">Σ</span>
                  </div>
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{t('dashboard.allMemberContributions')}</dt>
                    <dd className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      ₹{globalStats?.totalAmount?.toLocaleString() || 0}
                    </dd>
                    <dd className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {globalStats?.totalContributions || 0} {t('dashboard.approved').toLowerCase()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-md dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg">
            <div className="p-4 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white text-base sm:text-lg font-bold">₹</span>
                  </div>
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{t('dashboard.totalContributed')}</dt>
                    <dd className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">₹{stats?.totalAmount?.toLocaleString() || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-md dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg">
            <div className="p-4 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white text-base sm:text-lg font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{t('dashboard.approved')}</dt>
                    <dd className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats?.totalContributions || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-md dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg">
            <div className="p-4 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 dark:bg-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white text-base sm:text-lg font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{t('dashboard.pending')}</dt>
                    <dd className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats?.pendingContributions || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-md dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg">
            <div className="p-4 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white text-base sm:text-lg font-bold">K</span>
                  </div>
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{t('dashboard.kycStatus')}</dt>
                    <dd className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1 capitalize">
                      {user.kycStatus || t('dashboard.pending')}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Chart */}
        <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 sm:mb-8">
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

        {/* Quick Actions */}
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

        {/* Contribution List */}
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
      </div>
    </Layout>
  );
}


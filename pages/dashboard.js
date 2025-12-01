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
  const [chartStats, setChartStats] = useState(null);
  const [memberOptions, setMemberOptions] = useState([]);
  const [memberFilter, setMemberFilter] = useState('all');
  const [chartFilter, setChartFilter] = useState('6');
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [contributionHistory, setContributionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);

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
      const globalData = globalRes.data.data;
      setGlobalStats(globalData);
      setChartStats(globalData);
      if (globalData.memberOptions) {
        setMemberOptions(globalData.memberOptions);
      }
      setContributionHistory(contributions);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const chartTotals = useMemo(() => {
    if (!chartStats?.monthlyTotals?.length) return [];
    if (chartFilter === 'all') return chartStats.monthlyTotals;
    const limit = parseInt(chartFilter, 10);
    return chartStats.monthlyTotals.slice(-limit);
  }, [chartStats, chartFilter]);

  useEffect(() => {
    if (!globalStats) return;
    if (memberFilter === 'all') {
      setChartStats(globalStats);
      return;
    }

    const fetchFilteredStats = async () => {
      try {
        setChartLoading(true);
        // Ensure memberId is a string (convert ObjectId if needed)
        const memberId = typeof memberFilter === 'string' ? memberFilter : String(memberFilter);
        const response = await api.get('/api/contribution/stats', {
          params: { memberId },
        });
        setChartStats(response.data.data);
      } catch (error) {
        toast.error('Unable to load member contributions');
      } finally {
        setChartLoading(false);
      }
    };

    fetchFilteredStats();
  }, [memberFilter, globalStats]);

  const currentMemberLabel = useMemo(() => {
    if (memberFilter === 'all') return 'All Members';
    if (user && String(memberFilter) === String(user._id)) return 'My Contributions';
    const match = memberOptions.find((member) => String(member.id) === String(memberFilter));
    return match ? match.name : 'Selected Member';
  }, [memberFilter, memberOptions, user]);

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

      // Fetch detailed data
      const response = await api.get('/api/contribution/export-data');
      if (!response.data.success) {
        throw new Error('Failed to fetch data');
      }

      const { data } = response.data;
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
                    <dt className="text-sm font-medium text-gray-500 truncate">All Member Contributions</dt>
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportPDF}
                disabled={pdfGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                {pdfGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </>
                )}
              </button>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Members</option>
                {user.role !== 'admin' && user._id && (
                  <option value={String(user._id)}>My Contributions</option>
                )}
                {memberOptions.map((member) => (
                  <option key={member.id} value={String(member.id)}>
                    {member.name}
                  </option>
                ))}
              </select>
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
          </div>
          {chartLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : chartData && chartData.labels.length ? (
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
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
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.ocrData.transactionId || '—'}</td>
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


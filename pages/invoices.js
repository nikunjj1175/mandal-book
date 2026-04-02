import { useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useGetInvoicesQuery } from '@/store/api/invoicesApi';
import { useGetContributionStatsQuery } from '@/store/api/contributionsApi';
import InvoiceDocumentPreview from '@/components/InvoiceDocumentPreview';
import { isDocumentPdf } from '@/lib/documentPreview';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [preview, setPreview] = useState(null);

  const { data: invoiceData, isLoading } = useGetInvoicesQuery(undefined, {
    skip: !user || (user.role !== 'member' && user.role !== 'admin'),
  });
  const { data: statsData } = useGetContributionStatsQuery(undefined, {
    skip: !user,
  });

  const invoices = useMemo(() => invoiceData?.data?.invoices || [], [invoiceData]);
  const totalFund = statsData?.data?.totalAmount || 0;

  const grouped = useMemo(() => {
    const map = new Map();
    for (const inv of invoices) {
      const key = inv.investmentName || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(inv);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [invoices]);

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-responsive-xl font-bold text-slate-900 dark:text-slate-100">Invoices</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Group investment bills: admin uploads <strong>PDF invoices</strong> or <strong>photos of bills</strong> (JPG/PNG).
              Use <strong>Preview</strong> to view here, or <strong>Open</strong> for a new tab.
            </p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Contributions (non-rejected)</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">₹{Number(totalFund).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="card p-12 text-center text-slate-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">No invoices yet.</div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([investmentName, list]) => (
              <div key={investmentName} className="card p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{investmentName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {list.length} record{list.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="table-responsive">
                  <table className="table-container">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell font-semibold">Purchase Date</th>
                        <th className="table-cell font-semibold">Amount</th>
                        <th className="table-cell font-semibold hidden sm:table-cell">Vendor</th>
                        <th className="table-cell font-semibold">Type</th>
                        <th className="table-cell font-semibold">Document</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {list.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="table-cell text-slate-600 dark:text-slate-300">
                            {inv.purchaseDate ? new Date(inv.purchaseDate).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td className="table-cell font-semibold text-slate-900 dark:text-slate-100">
                            ₹{Number(inv.purchaseAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="table-cell text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                            {inv.vendorName || '—'}
                          </td>
                          <td className="table-cell text-xs text-slate-500 dark:text-slate-400">
                            {isDocumentPdf(inv.documentUrl) ? 'PDF' : 'Image / other'}
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setPreview({ url: inv.documentUrl, title: `${investmentName} — ${inv._id}` })}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                Preview
                              </button>
                              <a
                                href={inv.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-600 dark:text-slate-400 hover:underline"
                              >
                                Open
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreview(null)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Document preview</p>
              <div className="flex items-center gap-2">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4">
              <InvoiceDocumentPreview url={preview.url} title={preview.title} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

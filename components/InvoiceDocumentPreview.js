import { isDocumentPdf, isLikelyImage } from '@/lib/documentPreview';

/**
 * Inline preview: PDF in iframe, images in img. Fallback: open link.
 */
export default function InvoiceDocumentPreview({ url, title = 'Document' }) {
  if (!url) return <p className="text-sm text-slate-500">No file</p>;

  if (isDocumentPdf(url)) {
    return (
      <div className="w-full rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <iframe
          title={title}
          src={url}
          className="w-full h-[min(70vh,520px)]"
        />
      </div>
    );
  }

  if (isLikelyImage(url)) {
    return (
      <div className="flex justify-center rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-800 p-2">
        <img src={url} alt={title} className="max-h-[min(70vh,520px)] w-auto object-contain" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Preview not available for this file type.</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
      >
        Open in new tab
      </a>
    </div>
  );
}

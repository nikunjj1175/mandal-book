import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/useTranslation';
import '@/store/api/tripsApi';
import { useGetTripsQuery, useCreateTripMutation } from '@/store/api/tripsApi';
import toast from 'react-hot-toast';

function IconMap({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function IconUsers({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function IconReceipt({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5h.01M15 12h.01" />
    </svg>
  );
}

function IconChevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function TripsIndexPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useGetTripsQuery(undefined, {
    skip: !user || (user.role !== 'member' && user.role !== 'admin'),
  });
  const [createTrip, { isLoading: creating }] = useCreateTripMutation();

  const trips = data?.data?.trips || [];

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('trips.tripName'));
      return;
    }
    try {
      await createTrip({
        title: title.trim(),
        notes: notes.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }).unwrap();
      toast.success('Trip created');
      setOpen(false);
      setTitle('');
      setNotes('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Failed');
    }
  };

  if (!user || (user.role !== 'member' && user.role !== 'admin')) {
    return null;
  }

  return (
    <Layout>
      <div className="trip-page">
        {/* Top app-bar style header */}
        <header className="pt-2 pb-6 sm:pt-4">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 px-5 py-6 sm:px-7 sm:py-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl dark:bg-emerald-500/10" />
            <div className="pointer-events-none absolute -bottom-4 left-1/4 h-24 w-24 rounded-full bg-teal-400/15 blur-xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/90 dark:text-emerald-400/90 mb-2">
                  Split bills
                </p>
                <h1 className="text-[1.65rem] sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-balance leading-tight">
                  {t('trips.listTitle')}
                </h1>
                <p className="mt-2.5 text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                  {t('trips.listSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="group relative shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] transition active:scale-[0.98] hover:shadow-[0_12px_28px_-4px_rgba(16,185,129,0.5)]"
              >
                <span className="text-lg leading-none">+</span>
                {t('trips.newTrip')}
              </button>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[108px] rounded-[1.35rem] bg-slate-200/70 dark:bg-slate-800/80 animate-pulse"
              />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 px-6 py-16 text-center shadow-inner">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400">
              <IconMap className="h-10 w-10" />
            </div>
            <p className="text-[17px] font-semibold text-slate-800 dark:text-slate-100">{t('trips.noTrips')}</p>
            <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Create a trip, add people, and split expenses — like a finance app on your phone.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-8 rounded-2xl bg-emerald-600 px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-transform"
            >
              {t('trips.newTrip')}
            </button>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {trips.map((trip) => {
              const mCount = trip.memberCount ?? trip.members?.length ?? 0;
              const eCount = trip.expenseCount ?? 0;
              return (
                <li key={trip._id}>
                  <Link
                    href={`/trips/${trip._id}`}
                    className="group flex gap-4 rounded-[1.35rem] border border-slate-200/90 dark:border-slate-700/90 bg-white/90 dark:bg-slate-900/70 p-4 pr-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99] hover:border-emerald-300/70 dark:hover:border-emerald-700/50 hover:shadow-[0_8px_28px_-8px_rgba(16,185,129,0.2)]"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/10">
                      <IconMap className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className="font-bold text-[17px] text-slate-900 dark:text-slate-50 truncate leading-snug group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                        {trip.title}
                      </p>
                      {trip.notes ? (
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                          {trip.notes}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="trip-chip">
                          <IconUsers className="h-3.5 w-3.5 opacity-70" />
                          {mCount} · {t('trips.members')}
                        </span>
                        <span className="trip-chip">
                          <IconReceipt className="h-3.5 w-3.5 opacity-70" />
                          {eCount} · {t('trips.expenses')}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center self-center text-emerald-600 dark:text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity">
                      <IconChevron className="h-5 w-5" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {open && (
          <div
            className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-[3px] p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trip-create-title"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div className="trip-sheet-panel px-5 pt-2 sm:pt-6">
              <div className="mx-auto mb-5 h-1 w-11 rounded-full bg-slate-300/90 dark:bg-slate-600 sm:hidden" aria-hidden />
              <h2 id="trip-create-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-1">
                {t('trips.newTrip')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Add details — you can edit later.</p>
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="trip-label" htmlFor="trip-title">
                    {t('trips.tripName')}
                  </label>
                  <input
                    id="trip-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="trip-input"
                    placeholder={t('trips.tripNamePh')}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="trip-label" htmlFor="trip-notes">
                    {t('trips.notes')}
                  </label>
                  <textarea
                    id="trip-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="trip-input min-h-[88px] resize-y py-3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="trip-label" htmlFor="trip-start">
                      {t('trips.startDate')}
                    </label>
                    <input
                      id="trip-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="trip-input py-3 text-[15px]"
                    />
                  </div>
                  <div>
                    <label className="trip-label" htmlFor="trip-end">
                      {t('trips.endDate')}
                    </label>
                    <input
                      id="trip-end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="trip-input py-3 text-[15px]"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-600 py-3.5 text-[15px] font-semibold text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {creating ? t('trips.creating') : t('trips.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

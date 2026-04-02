import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/useTranslation';
import '@/store/api/tripsApi';
import {
  useGetTripDetailQuery,
  useAddTripMemberMutation,
  useRemoveTripMemberMutation,
  useCreateTripExpenseMutation,
  useDeleteTripExpenseMutation,
  useDeleteTripMutation,
  useUpdateTripMutation,
} from '@/store/api/tripsApi';
import { useGetMembersQuery } from '@/store/api/membersApi';
import toast from 'react-hot-toast';

function formatInr(n) {
  const x = Number(n) || 0;
  return `₹${x.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function initials(name) {
  if (!name || !String(name).trim()) return '?';
  const p = String(name).trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] || '')).toUpperCase().slice(0, 2);
}

function IconBack({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconPrint({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function IconPencil({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconTrash({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconWallet({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function IconPlus({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconArrowRight({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function IconCheckCircle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function TripDetailPage() {
  const router = useRouter();
  const rawTripId = router.query.tripId;
  const tripId = Array.isArray(rawTripId) ? rawTripId[0] : rawTripId;
  const { user } = useAuth();
  const { t } = useTranslation();
  const uid = user ? String(user.id || user._id) : '';

  const { data, isLoading, refetch } = useGetTripDetailQuery(tripId, {
    skip: !router.isReady || !tripId || !user,
  });
  const { data: membersData } = useGetMembersQuery(undefined, {
    skip: !user,
  });

  const [addName, setAddName] = useState('');
  const [linkUserId, setLinkUserId] = useState('');
  const [expOpen, setExpOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidKey, setPaidKey] = useState('');
  const [splitKeys, setSplitKeys] = useState([]);
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expNotes, setExpNotes] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [activeStep, setActiveStep] = useState(1);

  const [addMember] = useAddTripMemberMutation();
  const [removeMember] = useRemoveTripMemberMutation();
  const [createExp, { isLoading: creatingExp }] = useCreateTripExpenseMutation();
  const [delExp] = useDeleteTripExpenseMutation();
  const [delTrip] = useDeleteTripMutation();
  const [patchTrip] = useUpdateTripMutation();

  const trip = data?.data?.trip;
  const expenses = data?.data?.expenses || [];
  const balances = data?.data?.balances || [];
  const settlements = data?.data?.settlements || [];
  const nameByKey = data?.data?.nameByKey || {};

  const members = membersData?.data?.members || [];

  const myMemberKey = useMemo(() => {
    if (!trip?.members) return null;
    const m = trip.members.find((x) => x.linkedUserId && String(x.linkedUserId) === uid);
    return m ? m.key : null;
  }, [trip, uid]);

  const myBal = useMemo(() => {
    if (!myMemberKey) return null;
    const row = balances.find((b) => b.memberKey === myMemberKey);
    return row ? row.balance : 0;
  }, [balances, myMemberKey]);

  const allGroupSettled = useMemo(() => {
    if (!expenses.length || !balances.length) return false;
    return balances.every((b) => Math.abs(Number(b.balance) || 0) <= 0.01);
  }, [expenses, balances]);

  const myPersonalSettled = myBal !== null && Math.abs(Number(myBal) || 0) <= 0.01;

  useEffect(() => {
    if (!trip?.members?.length) return;
    const keys = trip.members.map((m) => m.key);
    setSplitKeys(keys);
    setPaidKey((prev) => (prev && keys.includes(prev) ? prev : keys[0] || ''));
  }, [trip]);

  useEffect(() => {
    if (trip) {
      setEditTitle(trip.title || '');
      setEditNotes(trip.notes || '');
    }
  }, [trip]);

  const canManage = useMemo(() => {
    if (!user || !trip) return false;
    const cid = String(trip.createdBy?._id || trip.createdBy);
    return cid === uid || user.role === 'admin';
  }, [user, trip, uid]);

  const canAddExpense = (trip?.members || []).length >= 2;

  const onAddPerson = async (e) => {
    e.preventDefault();
    if (!addName.trim()) {
      toast.error(t('trips.manualName'));
      return;
    }
    try {
      await addMember({
        tripId,
        action: 'add',
        displayName: addName.trim(),
        linkedUserId: linkUserId || undefined,
      }).unwrap();
      toast.success('Added');
      setAddName('');
      setLinkUserId('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Failed');
    }
  };

  const onAddMe = async () => {
    if (!user?.name) return;
    try {
      await addMember({
        tripId,
        action: 'add',
        displayName: user.name,
        linkedUserId: uid,
      }).unwrap();
      toast.success('Added');
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Failed');
    }
  };

  const onRemoveMember = async (memberKey) => {
    if (!window.confirm(t('trips.remove') + '?')) return;
    try {
      await removeMember({ tripId, memberKey }).unwrap();
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Failed');
    }
  };

  const toggleSplitKey = (key) => {
    setSplitKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    if (!paidKey || splitKeys.length < 2) {
      toast.error(t('trips.splitWith'));
      return;
    }
    if (!splitKeys.includes(paidKey)) {
      toast.error('Payer must be included in the split');
      return;
    }
    try {
      await createExp({
        tripId,
        description: desc.trim(),
        amount: parseFloat(amount, 10),
        paidByMemberKey: paidKey,
        participantKeys: splitKeys,
        incurredOn: expDate ? new Date(expDate).toISOString() : undefined,
        notes: expNotes.trim(),
      }).unwrap();
      toast.success('Saved');
      setExpOpen(false);
      setDesc('');
      setAmount('');
      setExpNotes('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Failed');
    }
  };

  const onDeleteExpense = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      await delExp({ tripId, expenseId: id }).unwrap();
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Failed');
    }
  };

  const onDeleteTrip = async () => {
    if (!window.confirm(t('trips.confirmDeleteTrip'))) return;
    try {
      await delTrip(tripId).unwrap();
      toast.success('Deleted');
      router.push('/trips');
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Failed');
    }
  };

  const onSaveTripEdit = async (e) => {
    e.preventDefault();
    try {
      await patchTrip({ id: tripId, title: editTitle, notes: editNotes }).unwrap();
      toast.success('Updated');
      setEditOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Failed');
    }
  };

  const openExpense = () => {
    if ((trip?.members || []).length < 2) {
      toast.error('Add at least two people first');
      return;
    }
    setDesc('');
    setAmount('');
    setExpNotes('');
    setExpDate(new Date().toISOString().slice(0, 10));
    const keys = trip.members.map((m) => m.key);
    setSplitKeys(keys);
    setPaidKey(myMemberKey && keys.includes(myMemberKey) ? myMemberKey : keys[0]);
    setExpOpen(true);
  };

  if (!user) return null;

  if (!router.isReady || !tripId) {
    return (
      <Layout>
        <div className="trip-page flex justify-center py-24">
          <div className="h-11 w-11 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="trip-page space-y-4 pt-4" aria-busy="true">
          <div className="h-40 rounded-[1.75rem] bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!trip) {
    return (
      <Layout>
        <div className="trip-page py-16 text-center">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">Trip not found</p>
          <Link href="/trips" className="mt-4 inline-block text-emerald-600 dark:text-emerald-400 font-medium">
            ← {t('trips.backToList')}
          </Link>
        </div>
      </Layout>
    );
  }

  const dateLine = [trip.startDate && new Date(trip.startDate).toLocaleDateString('en-IN'), trip.endDate && new Date(trip.endDate).toLocaleDateString('en-IN')]
    .filter(Boolean)
    .join(' → ');

  return (
    <Layout>
      <div className="trip-page">
        <nav className="no-print mb-4 flex flex-wrap items-center gap-2">
          <Link
            href="/trips"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 px-3.5 py-2 text-[14px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm active:scale-[0.98] transition-transform"
          >
            <IconBack className="h-4 w-4" />
            {t('trips.backToList')}
          </Link>
        </nav>

        <header className="no-print trip-hero mb-6 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-400/90 mb-2">Trip</p>
              <h1 className="text-[1.65rem] sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                {trip.title}
              </h1>
              {dateLine ? (
                <p className="mt-3 flex flex-wrap gap-2">
                  {trip.startDate ? (
                    <span className="trip-chip text-[11px]">{new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  ) : null}
                  {trip.startDate && trip.endDate ? <span className="self-center text-slate-400">→</span> : null}
                  {trip.endDate ? (
                    <span className="trip-chip text-[11px]">{new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  ) : null}
                </p>
              ) : null}
              {trip.notes ? <p className="mt-4 text-[15px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{trip.notes}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-4 py-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm active:scale-[0.98]"
              >
                <IconPrint className="h-4 w-4" />
                {t('trips.print')}
              </button>
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-4 py-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm active:scale-[0.98]"
                  >
                    <IconPencil className="h-4 w-4" />
                    {t('trips.editTrip')}
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteTrip}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/80 dark:bg-rose-950/30 px-4 py-2.5 text-[13px] font-semibold text-rose-700 dark:text-rose-300 active:scale-[0.98]"
                  >
                    <IconTrash className="h-4 w-4" />
                    {t('trips.deleteTrip')}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {myBal !== null && (
          <div
            className={`no-print mb-8 rounded-[1.35rem] border p-5 shadow-[0_8px_28px_-8px_rgba(16,185,129,0.2)] ${
              myPersonalSettled
                ? 'border-emerald-300/80 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-50/95 to-teal-50/40 dark:from-emerald-950/50 dark:to-slate-900/90'
                : 'border-emerald-200/70 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-slate-900/80'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ${
                  myPersonalSettled
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {myPersonalSettled ? <IconCheckCircle className="h-7 w-7" /> : <IconWallet className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/80 dark:text-emerald-300/90">{t('trips.yourBalance')}</p>
                {myPersonalSettled ? (
                  <>
                    <p className="mt-1 text-xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">{t('trips.yourBalanceSettled')}</p>
                    <p className="mt-2 text-[13px] leading-snug text-emerald-800/85 dark:text-emerald-400/90">{t('trips.yourBalanceSettledHint')}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-[1.75rem] font-bold tabular-nums tracking-tight text-emerald-900 dark:text-emerald-100">
                      {myBal > 0.01 && `+${formatInr(myBal)}`}
                      {myBal < -0.01 && `−${formatInr(-myBal)}`}
                    </p>
                    <p className="mt-1 text-[12px] text-emerald-800/70 dark:text-emerald-400/80">Positive = others owe you · negative = you owe</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <section className="no-print mb-12">
          <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-slate-200/80 bg-[var(--bg-primary)]/95 px-4 py-3 backdrop-blur-md dark:border-slate-700/80 sm:static sm:z-0 sm:mx-0 sm:rounded-2xl sm:border sm:bg-white/60 sm:px-3 sm:py-3 sm:dark:bg-slate-900/40">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 sm:hidden">{t('trips.tripStepsStrip')}</p>
            <div className="trip-step-tabs" role="tablist" aria-label={t('trips.tripStepsStrip')}>
              {[
                { id: 1, short: t('trips.stepTabPeople') },
                { id: 2, short: t('trips.stepTabExpenses') },
                { id: 3, short: t('trips.stepTabBalances') },
              ].map(({ id, short }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeStep === id}
                  onClick={() => setActiveStep(id)}
                  className={`trip-step-tab ${activeStep === id ? 'trip-step-tab-active' : ''}`}
                >
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">{id}</span>
                  <span className="mt-0.5 block leading-tight">{short}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 1 — People */}
          {activeStep === 1 ? (
            <div>
              <p className="mb-3 text-[13px] font-semibold text-slate-500 dark:text-slate-400">{t('trips.step1')}</p>
            <div className="rounded-[1.35rem] border border-slate-200/90 dark:border-slate-700/90 bg-white/90 dark:bg-slate-900/50 p-4 sm:p-5 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-none">
              <form onSubmit={onAddPerson} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="trip-label">{t('trips.manualName')}</label>
                    <input
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="trip-input py-3 text-[15px]"
                      placeholder="Friend, family, colleague…"
                    />
                  </div>
                  <div>
                    <label className="trip-label">{t('trips.linkMember')}</label>
                    <select
                      value={linkUserId}
                      onChange={(e) => setLinkUserId(e.target.value)}
                      className="trip-input py-3 text-[15px] appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
                    >
                      <option value="">{t('trips.linkNone')}</option>
                      {members.map((m) => (
                        <option key={m.id || m._id} value={m.id || m._id}>
                          {m.name}
                        </option>
                      ))}
                      {user?.role === 'admin' && (
                        <option value={uid}>{user.name} (Admin)</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-[14px] font-semibold text-white shadow-md shadow-emerald-500/20 active:scale-[0.98]"
                  >
                    {t('trips.addManual')}
                  </button>
                  {!trip.members?.some((m) => m.linkedUserId && String(m.linkedUserId) === uid) && (
                    <button
                      type="button"
                      onClick={onAddMe}
                      className="rounded-2xl border border-emerald-300/80 dark:border-emerald-700 px-5 py-2.5 text-[14px] font-semibold text-emerald-800 dark:text-emerald-200 active:bg-emerald-50 dark:active:bg-emerald-950/50"
                    >
                      {t('trips.addMe')}
                    </button>
                  )}
                </div>
              </form>

              <ul className="mt-5 space-y-2">
                {(trip.members || []).map((m) => (
                  <li
                    key={m.key}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 text-[13px] font-bold text-slate-700 dark:text-slate-200">
                        {initials(m.displayName)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[15px] text-slate-900 dark:text-slate-100 truncate">{m.displayName}</p>
                        {m.linkedUserId ? (
                          <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Linked</span>
                        ) : null}
                      </div>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onRemoveMember(m.key)}
                        className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-rose-600 dark:text-rose-400 active:bg-rose-50 dark:active:bg-rose-950/40"
                      >
                        {t('trips.remove')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          ) : null}

          {/* Step 2 — Expenses */}
          {activeStep === 2 ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">{t('trips.step2')}</p>
                <button
                  type="button"
                  onClick={openExpense}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-emerald-600/25 active:scale-[0.98] disabled:opacity-40"
                  disabled={!canAddExpense}
                >
                  <IconPlus className="h-4 w-4" />
                  {t('trips.addExpense')}
                </button>
              </div>

            {expenses.length === 0 ? (
              <div className="rounded-[1.35rem] border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 py-12 text-center px-4">
                <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400">No expenses yet</p>
                <p className="mt-1 text-sm text-slate-500">Tap + below to add your first split.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {expenses.map((ex) => (
                  <li
                    key={ex._id}
                    className="rounded-[1.25rem] border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900/40 p-4 shadow-sm"
                  >
                    <div className="flex gap-3 justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[16px] text-slate-900 dark:text-slate-50 leading-snug">{ex.description}</p>
                        <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
                          {new Date(ex.incurredOn || ex.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · Paid by{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-300">{nameByKey[ex.paidByMemberKey] || '—'}</span>
                        </p>
                        {ex.notes ? <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400 leading-snug">{ex.notes}</p> : null}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{formatInr(ex.amount)}</p>
                        {String(ex.createdBy?._id || ex.createdBy) === uid || user.role === 'admin' ? (
                          <button
                            type="button"
                            className="text-[12px] font-semibold text-rose-600 dark:text-rose-400"
                            onClick={() => onDeleteExpense(ex._id)}
                          >
                            {t('trips.remove')}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          ) : null}

          {/* Step 3 — Balances */}
          {activeStep === 3 ? (
            <div>
              <p className="mb-3 text-[13px] font-semibold text-slate-500 dark:text-slate-400">{t('trips.step3')}</p>

            {!expenses.length && balances.length > 0 ? (
              <div className="rounded-[1.35rem] border border-slate-200/90 dark:border-slate-700/90 bg-slate-50/80 dark:bg-slate-800/40 px-5 py-4 text-[15px] text-slate-600 dark:text-slate-400">
                {t('trips.noExpensesYetBalances')}
              </div>
            ) : null}

            {expenses.length > 0 && allGroupSettled ? (
              <div className="rounded-[1.35rem] border border-emerald-200/80 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/30 dark:from-emerald-950/35 dark:via-slate-900 dark:to-slate-900/80 p-6 shadow-sm">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    <IconCheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{t('trips.allSettledTitle')}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-emerald-800/90 dark:text-emerald-400/95">{t('trips.allSettledBody')}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {expenses.length > 0 && !allGroupSettled ? (
              <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900/40 shadow-sm">
                <div className="grid grid-cols-[1fr_auto] gap-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>Person</span>
                  <span className="text-right">Balance</span>
                </div>
                {balances.map((b) => {
                  const val = Number(b.balance) || 0;
                  const pos = val > 0.01;
                  const neg = val < -0.01;
                  return (
                    <div
                      key={b.memberKey}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-slate-100 dark:border-slate-800 px-4 py-3.5"
                    >
                      <span className="font-medium text-[15px] text-slate-900 dark:text-slate-100">{b.name}</span>
                      <span
                        className={`text-right text-[15px] font-bold tabular-nums ${
                          pos ? 'text-emerald-600 dark:text-emerald-400' : neg ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {formatInr(b.balance)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {expenses.length > 0 && !allGroupSettled && settlements.length > 0 ? (
              <div className="mt-5">
                <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('trips.settle')}</p>
                <ul className="space-y-2">
                  {settlements.map((s, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/50 px-4 py-3 text-[14px] text-slate-700 dark:text-slate-300"
                    >
                      <span className="min-w-0 font-bold text-slate-900 dark:text-slate-100 truncate">{s.fromName}</span>
                      <IconArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatInr(s.amount)}</span>
                      <span className="text-slate-400">→</span>
                      <span className="min-w-0 font-bold text-slate-900 dark:text-slate-100 truncate">{s.toName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          ) : null}
        </section>

        {canAddExpense && activeStep === 2 && (
          <button type="button" onClick={openExpense} className="trip-fab sm:hidden" aria-label={t('trips.addExpense')}>
            <IconPlus className="h-7 w-7" />
          </button>
        )}

        <div id="trip-print-root" className="trip-print-report hidden print:block print-only">
          <header className="trip-print-header">
            <p className="trip-print-sub" style={{ marginBottom: '6pt' }}>
              {t('trips.printReportTitle')}
            </p>
            <h1 className="trip-print-title">{trip.title}</h1>
            {trip.notes ? <p className="trip-print-sub">{trip.notes}</p> : null}
            <p className="trip-print-sub" style={{ marginTop: '8pt' }}>
              {[
                trip.startDate && new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                trip.endDate && new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
              ]
                .filter(Boolean)
                .join(' → ')}
            </p>
            <p className="trip-print-sub" style={{ marginTop: '6pt' }}>
              Printed: {new Date().toLocaleString('en-IN')}
            </p>
          </header>

          <h2 className="trip-print-section-title">People on trip</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Linked account</th>
              </tr>
            </thead>
            <tbody>
              {(trip.members || []).map((m) => (
                <tr key={m.key}>
                  <td>{m.displayName}</td>
                  <td>{m.linkedUserId ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="trip-print-section-title">Expenses</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="trip-print-num">Amount (₹)</th>
                <th>Paid by</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((ex) => (
                <tr key={ex._id}>
                  <td>{new Date(ex.incurredOn || ex.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>{ex.description}</td>
                  <td className="trip-print-num">{formatInr(ex.amount)}</td>
                  <td>{nameByKey[ex.paidByMemberKey]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="trip-print-section-title">Net balances</h2>
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th className="trip-print-num">Net (₹)</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.memberKey}>
                  <td>{b.name}</td>
                  <td className="trip-print-num">{formatInr(b.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {settlements.length > 0 ? (
            <>
              <h2 className="trip-print-section-title">Suggested settlements</h2>
              <ul className="trip-print-settle">
                {settlements.map((s, i) => (
                  <li key={i}>
                    <strong>{s.fromName}</strong> pays <strong>{formatInr(s.amount)}</strong> to <strong>{s.toName}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        {expOpen && (
          <div
            className="no-print fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-[3px] p-0 sm:p-4"
            onClick={(e) => e.target === e.currentTarget && setExpOpen(false)}
          >
            <form
              onSubmit={submitExpense}
              className="trip-sheet-panel px-5 pt-2 sm:pt-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-slate-300/90 dark:bg-slate-600 sm:hidden" aria-hidden />
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-1">{t('trips.addExpense')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Split fairly across selected people.</p>
              <div className="space-y-4">
                <div>
                  <label className="trip-label">{t('trips.description')}</label>
                  <input value={desc} onChange={(e) => setDesc(e.target.value)} className="trip-input" placeholder={t('trips.description')} required />
                </div>
                <div>
                  <label className="trip-label">{t('trips.amount')}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="trip-input tabular-nums"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="trip-label">{t('trips.whoPaid')}</label>
                  <select value={paidKey} onChange={(e) => setPaidKey(e.target.value)} className="trip-input py-3">
                    {(trip.members || []).map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="trip-label">{t('trips.splitWith')}</p>
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-slate-200/90 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/40 p-3">
                    {(trip.members || []).map((m) => (
                      <label key={m.key} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-[15px] font-medium text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/50">
                        <input
                          type="checkbox"
                          checked={splitKeys.includes(m.key)}
                          onChange={() => toggleSplitKey(m.key)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        {m.displayName}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="trip-label">Date</label>
                  <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="trip-input py-3" />
                </div>
                <div>
                  <label className="trip-label">{t('trips.expenseNotes')}</label>
                  <input value={expNotes} onChange={(e) => setExpNotes(e.target.value)} className="trip-input" placeholder={t('trips.expenseNotes')} />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-600 py-3.5 text-[15px] font-semibold text-slate-700 dark:text-slate-200"
                  onClick={() => setExpOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingExp}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {creatingExp ? t('trips.saving') : t('trips.save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {editOpen && (
          <div className="no-print fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-[3px] p-0 sm:p-4" onClick={() => setEditOpen(false)}>
            <form
              onSubmit={onSaveTripEdit}
              className="trip-sheet-panel px-5 pt-2 sm:pt-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-slate-300/90 dark:bg-slate-600 sm:hidden" aria-hidden />
              <h3 className="text-xl font-bold mb-1">{t('trips.editTrip')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Update title and notes.</p>
              <label className="trip-label">Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="trip-input mb-4" required />
              <label className="trip-label">Notes</label>
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} className="trip-input min-h-[100px] resize-y mb-6" />
              <div className="flex gap-3">
                <button type="button" className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-600 py-3.5 font-semibold" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 font-semibold text-white shadow-lg">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}

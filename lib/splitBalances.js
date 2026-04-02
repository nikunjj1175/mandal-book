/**
 * Pure helpers for trip-based expense splits (Splitwise-style).
 */

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Legacy: expenses with paidBy ObjectId + participants.userId */
function computeBalances(expenses) {
  const net = {};
  for (const e of expenses) {
    if (!e || typeof e.amount !== 'number') continue;
    if (e.paidByMemberKey) continue;
    const paidBy = String(e.paidBy?._id || e.paidBy);
    net[paidBy] = round2((net[paidBy] || 0) + e.amount);
    for (const p of e.participants || []) {
      const uid = String(p.userId?._id || p.userId);
      net[uid] = round2((net[uid] || 0) - round2(p.shareAmount || 0));
    }
  }
  return net;
}

/** Trip expenses: paidByMemberKey + splits[].memberKey */
function computeBalancesTrip(expenses) {
  const net = {};
  for (const e of expenses) {
    if (!e || typeof e.amount !== 'number') continue;
    const payer = e.paidByMemberKey;
    if (!payer) continue;
    net[payer] = round2((net[payer] || 0) + e.amount);
    for (const s of e.splits || []) {
      const k = s.memberKey;
      net[k] = round2((net[k] || 0) - round2(s.shareAmount || 0));
    }
  }
  return net;
}

function simplifyDebts(net) {
  const entries = Object.entries(net).map(([id, v]) => [id, round2(v)]);
  const creditors = entries.filter(([, v]) => v > 0.005).sort((a, b) => b[1] - a[1]);
  const debtors = entries
    .filter(([, v]) => v < -0.005)
    .map(([id, v]) => [id, round2(-v)])
    .sort((a, b) => b[1] - a[1]);
  const settlements = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const [cId, cVal0] = creditors[i];
    const [dId, dVal0] = debtors[j];
    const pay = round2(Math.min(cVal0, dVal0));
    if (pay > 0.005) {
      settlements.push({ from: dId, to: cId, amount: pay });
    }
    const cVal = round2(cVal0 - pay);
    const dVal = round2(dVal0 - pay);
    creditors[i] = [cId, cVal];
    debtors[j] = [dId, dVal];
    if (cVal <= 0.005) i += 1;
    if (dVal <= 0.005) j += 1;
  }
  return settlements;
}

function equalSharesFromTotal(totalAmount, userIds) {
  const n = userIds.length;
  if (n < 2) {
    throw new Error('At least two people must share the expense');
  }
  const cents = Math.round(round2(totalAmount) * 100);
  if (cents < 1) throw new Error('Amount too small');
  const each = Math.floor(cents / n);
  const rem = cents - each * n;
  return userIds.map((userId, idx) => ({
    userId,
    shareAmount: round2((each + (idx === n - 1 ? rem : 0)) / 100),
  }));
}

/** Equal split by roster keys (trip members) */
function equalSharesFromTotalKeys(totalAmount, memberKeys) {
  const n = memberKeys.length;
  if (n < 2) {
    throw new Error('At least two people must share the expense');
  }
  const cents = Math.round(round2(totalAmount) * 100);
  if (cents < 1) throw new Error('Amount too small');
  const each = Math.floor(cents / n);
  const rem = cents - each * n;
  return memberKeys.map((memberKey, idx) => ({
    memberKey,
    shareAmount: round2((each + (idx === n - 1 ? rem : 0)) / 100),
  }));
}

module.exports = {
  computeBalances,
  computeBalancesTrip,
  simplifyDebts,
  equalSharesFromTotal,
  equalSharesFromTotalKeys,
  round2,
};

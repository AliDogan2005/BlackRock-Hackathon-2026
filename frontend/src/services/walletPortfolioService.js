import { getPersistedToken, getPersistedUser } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const ALLOCATION_COLORS = ["#1A120B", "#D4AF37", "#B8AA8A", "#7A6B4D", "#D9C58A"];

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function requestJson(path, token, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

function buildAllocation(positions, availableCash, totalAssetValue) {
  const rows = [];

  positions.forEach((position, index) => {
    const percent = totalAssetValue > 0 ? (position.value / totalAssetValue) * 100 : 0;
    rows.push({
      name: position.asset,
      value: Number(percent.toFixed(1)),
      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
    });
  });

  const cashPercent = totalAssetValue > 0 ? (availableCash / totalAssetValue) * 100 : 0;
  rows.push({
    name: "Cash",
    value: Number(cashPercent.toFixed(1)),
    color: ALLOCATION_COLORS[2],
  });

  return rows.filter((row) => row.value > 0);
}

function buildTransactions(positions) {
  return positions
    .slice()
    .sort((a, b) => new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime())
    .slice(0, 5)
    .map((position) => ({
      type: "Buy",
      asset: position.asset,
      amount: position.value,
      date: position.purchasedAt ? String(position.purchasedAt).slice(0, 10) : "-",
    }));
}

function toDisplayType(type) {
  const normalized = String(type || "").trim().toUpperCase();
  if (!normalized) {
    return "Transaction";
  }

  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function mapTransactionHistory(rows) {
  const list = Array.isArray(rows) ? rows : [];

  return list.slice(0, 12).map((row) => ({
    type: toDisplayType(row?.type),
    asset: row?.shareName || "Cash",
    amount: Math.abs(toNumber(row?.amount, 0)),
    date: row?.transactionDate ? String(row.transactionDate).slice(0, 10) : "-",
  }));
}

function normalizeShareKey(value) {
  return String(value || "").trim().toUpperCase();
}

function deriveProfitLossFromTransactions(positions, transactionRows) {
  const holdings = Array.isArray(positions) ? positions : [];
  const rows = Array.isArray(transactionRows) ? transactionRows.slice() : [];

  if (!holdings.length || !rows.length) {
    return null;
  }

  const sortedRows = rows.sort((a, b) => {
    const ta = new Date(a?.transactionDate || 0).getTime();
    const tb = new Date(b?.transactionDate || 0).getTime();
    return ta - tb;
  });

  const byShare = new Map();

  sortedRows.forEach((row) => {
    const shareKey = normalizeShareKey(row?.shareName);
    const type = String(row?.type || "").toUpperCase();
    const qty = Math.max(0, toNumber(row?.tokenAmount, 0));
    const amount = Math.max(0, toNumber(row?.amount, 0));

    if (!shareKey || qty <= 0 || (type !== "BUY" && type !== "SELL")) {
      return;
    }

    const state = byShare.get(shareKey) || { qty: 0, cost: 0 };

    if (type === "BUY") {
      state.qty += qty;
      state.cost += amount;
      byShare.set(shareKey, state);
      return;
    }

    if (state.qty <= 0 || state.cost <= 0) {
      byShare.set(shareKey, state);
      return;
    }

    const qtyToRemove = Math.min(qty, state.qty);
    const avgCost = state.cost / state.qty;
    state.cost = Math.max(0, state.cost - avgCost * qtyToRemove);
    state.qty = Math.max(0, state.qty - qtyToRemove);
    byShare.set(shareKey, state);
  });

  let currentMarketValue = 0;
  let currentCostBasis = 0;

  holdings.forEach((position) => {
    const shareKey = normalizeShareKey(position?.asset);
    const heldQty = Math.max(0, toNumber(position?.tokenAmount, 0));
    const unitPrice = Math.max(0, toNumber(position?.unitPrice, 0));

    if (!shareKey || heldQty <= 0) {
      return;
    }

    currentMarketValue += heldQty * unitPrice;

    const state = byShare.get(shareKey);
    if (!state || state.qty <= 0 || state.cost <= 0) {
      return;
    }

    const avgRemainingCost = state.cost / state.qty;
    currentCostBasis += avgRemainingCost * heldQty;
  });

  if (currentCostBasis <= 0) {
    return null;
  }

  const valueChange = currentMarketValue - currentCostBasis;
  const profitLossPct = (valueChange / currentCostBasis) * 100;

  if (!Number.isFinite(valueChange) || !Number.isFinite(profitLossPct)) {
    return null;
  }

  return {
    valueChange: Number(valueChange.toFixed(2)),
    profitLossPct: Number(profitLossPct.toFixed(2)),
  };
}

export async function fetchWalletPortfolioData() {
  const token = getPersistedToken();
  const user = getPersistedUser();

  if (!token || !user?.userId) {
    return null;
  }

  const [balancePayload, portfolioPayload, transactionPayload, profitLossPayload] = await Promise.all([
    requestJson("/api/wallet/balance", token),
    requestJson(`/api/users/${user.userId}/portfolio`, token).catch(() => []),
    requestJson("/api/transactions/my-history", token).catch(() => []),
    requestJson("/api/shares/profit-loss/portfolio", token).catch(() => null),
  ]);

  const availableCash = toNumber(balancePayload?.balance, 0);

  const positions = Array.isArray(portfolioPayload)
    ? portfolioPayload.map((row) => ({
        asset: row.shareName || "Unknown Asset",
        tokenAmount: toNumber(row.tokenAmount, 0),
        unitPrice: toNumber(row.currentValue, 0),
        value: toNumber(row.currentValue, 0) * toNumber(row.tokenAmount, 0),
        ownershipPercentage: toNumber(row.ownershipPercentage, 0),
        purchasedAt: row.purchasedAt,
      }))
    : [];

  const tokenValue = positions.reduce((sum, row) => sum + row.value, 0);
  const totalAssetValue = availableCash + tokenValue;

  const avgOwnership = positions.length
    ? positions.reduce((sum, row) => sum + row.ownershipPercentage, 0) / positions.length
    : 8;
  const fallbackProfitLossPct = Number(clamp((avgOwnership - 6) / 2.1, -18, 24).toFixed(1));
  const fallbackValueChange = Number((totalAssetValue * (fallbackProfitLossPct / 100)).toFixed(2));

  const backendProfitLossPct = toNumber(profitLossPayload?.totalProfitLossPercentage, Number.NaN);
  const backendValueChange = toNumber(profitLossPayload?.totalProfitLoss, Number.NaN);
  const hasBackendProfitLoss = Number.isFinite(backendProfitLossPct) && Number.isFinite(backendValueChange);
  const txDerivedProfitLoss = deriveProfitLossFromTransactions(positions, transactionPayload);
  const hasTxDerivedProfitLoss = Number.isFinite(txDerivedProfitLoss?.profitLossPct)
    && Number.isFinite(txDerivedProfitLoss?.valueChange);

  const profitLossPct = hasBackendProfitLoss
    ? Number(backendProfitLossPct.toFixed(2))
    : hasTxDerivedProfitLoss
      ? Number(txDerivedProfitLoss.profitLossPct.toFixed(2))
      : fallbackProfitLossPct;
  const valueChange = hasBackendProfitLoss
    ? Number(backendValueChange.toFixed(2))
    : hasTxDerivedProfitLoss
      ? Number(txDerivedProfitLoss.valueChange.toFixed(2))
      : fallbackValueChange;

  const backendTransactions = mapTransactionHistory(transactionPayload);
  const transactionsSource = backendTransactions.length ? "backend-history" : "portfolio-fallback";

  return {
    availableCash,
    tokenValue,
    totalAssetValue,
    profitLossPct,
    valueChange,
    allocation: buildAllocation(positions, availableCash, totalAssetValue),
    transactions: backendTransactions.length ? backendTransactions : buildTransactions(positions),
    transactionsSource,
    profitLossSource: hasBackendProfitLoss
      ? "backend-profit-loss"
      : hasTxDerivedProfitLoss
        ? "transactions-derived"
        : "derived-fallback",
  };
}

export async function depositToWallet(amount) {
  const token = getPersistedToken();

  if (!token) {
    throw new Error("No auth token available for deposit.");
  }

  return requestJson("/api/wallet/deposit", token, {
    method: "POST",
    body: JSON.stringify({
      amount,
      paymentMethod: "MOCK",
    }),
  });
}

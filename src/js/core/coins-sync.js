/**
 * coins-sync.js
 * Universal Dalil Gold Coins & Loyalty Synchronization Engine
 * Guarantees 100% real-time, unified coins balance across all pages,
 * tabs, header, sidebar, modals, and wallet.
 */
import { getIdToken } from './auth.js';
import { api } from './api.js';

export function getStoredCoinsBalance() {
  try {
    let balance = 0;
    const raw = localStorage.getItem('manzala_user_coins_balance');
    if (raw !== null && !isNaN(Number(raw))) {
      balance = Math.max(balance, Number(raw));
    }
    const rawUser = localStorage.getItem('dalil_user') || localStorage.getItem('user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u) {
        if (typeof u.points === 'number') balance = Math.max(balance, u.points);
        if (typeof u.coins === 'number') balance = Math.max(balance, u.coins);
        if (typeof u.balance === 'number') balance = Math.max(balance, u.balance);
      }
    }
    return balance;
  } catch (_) {}
  return 0;
}

export function setStoredCoinsBalance(balance) {
  const num = Math.max(0, Number(balance) || 0);
  try {
    localStorage.setItem('manzala_user_coins_balance', String(num));

    const rawUser = localStorage.getItem('dalil_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u && (u.points !== num || u.coins !== num)) {
        u.points = num;
        u.coins = num;
        localStorage.setItem('dalil_user', JSON.stringify(u));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coins:updated', { detail: { balance: num } }));
    }
  } catch (_) {}
  return num;
}

export async function fetchLiveCoinsBalance(force = false) {
  try {
    const token = await getIdToken(force);
    if (!token) return getStoredCoinsBalance();
    const res = await api.get('/api/coins/balance', token);
    if (res && res.success && res.data) {
      // Turso is authoritative. A real zero balance must overwrite stale localStorage.
      const finalBal = Math.max(0, Number(res.data.balance ?? 0));
      setStoredCoinsBalance(finalBal);
      return finalBal;
    }
  } catch (err) {
    console.debug('[fetchLiveCoinsBalance]:', err?.message || err);
  }
  return getStoredCoinsBalance();
}

export function applyCoinsBalanceToUI(balance) {
  const num = Number(balance || 0);
  const arStr = num.toLocaleString('ar-EG');

  // 1. Dashboard sidebar badge
  const sidebarBadge = document.getElementById('sidebar-coins-balance-badge');
  if (sidebarBadge) {
    sidebarBadge.textContent = `${arStr} ذهبية`;
  }

  // 2. Header user dropdown badge
  const headerUserBadge = document.getElementById('header-user-coins-badge');
  if (headerUserBadge) {
    headerUserBadge.textContent = `${arStr} ذهبية`;
  }

  // 3. Header coins val
  const headerVal = document.getElementById('header-coins-val');
  if (headerVal) {
    headerVal.textContent = arStr;
  }

  // 4. Mobile more sheet
  const moreVal = document.getElementById('more-coins-balance-val');
  if (moreVal) {
    moreVal.textContent = arStr;
  }

  // 5. Wallet live balance
  const walletLive = document.getElementById('wallet-live-balance');
  if (walletLive) {
    walletLive.innerHTML = `${arStr} <span style="font-size:1.4rem;font-weight:800;color:#FDE68A">ذهبية</span>`;
  }

  // 6. Generic class live sync
  document.querySelectorAll('.live-coins-val').forEach(el => {
    el.textContent = arStr;
  });
  document.querySelectorAll('.live-coins-badge').forEach(el => {
    el.textContent = `${arStr} ذهبية`;
  });
}

// Global auto-sync initialization
if (typeof window !== 'undefined' && !window.__coinsSyncInitialized) {
  window.__coinsSyncInitialized = true;

  // React to in-page balance updates
  window.addEventListener('coins:updated', (e) => {
    const bal = e?.detail?.balance;
    if (typeof bal === 'number') {
      applyCoinsBalanceToUI(bal);
    } else {
      fetchLiveCoinsBalance();
    }
  });

  // React to cross-tab updates (storage event)
  window.addEventListener('storage', (e) => {
    if (e.key === 'manzala_user_coins_balance' && e.newValue !== null) {
      applyCoinsBalanceToUI(Number(e.newValue || 0));
    }
  });
}

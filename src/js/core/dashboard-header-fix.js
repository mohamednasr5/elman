/**
 * Dashboard header authentication + notifications bridge.
 * Keeps the dashboard header synchronized with Firebase/Turso auth and the
 * shared notification engine used by the standalone pages.
 */
import { initAuth, waitForAuth, onAuthStateChange, signInWithGoogle, signOut, isAdmin, getIdToken } from './auth.js';
import { initGlobalRealtimeNotificationsListener, updateAllNotificationBadges } from '../services/notification.service.js';
import { initFcmMessaging } from '../services/fcm.service.js';
import { toast } from '../ui/components/Toast.js';
import { api } from './api.js';

let _bound = false;
let _notificationsInitializedFor = undefined;

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function notificationsHref() {
  return 'dashboard.html?section=notifications';
}

function getStoredCoins() {
  try {
    const raw = localStorage.getItem('manzala_user_coins_balance');
    if (raw !== null && !isNaN(Number(raw))) return Number(raw);
  } catch (_) {}
  return 0;
}

async function fetchLiveCoins() {
  try {
    const token = await getIdToken();
    if (!token) return;
    const res = await api.get('/api/coins/balance', token);
    const bal = res?.data?.balance ?? res?.balance;
    if (typeof bal === 'number') {
      localStorage.setItem('manzala_user_coins_balance', String(bal));
      const val = document.getElementById('header-coins-val');
      if (val) val.textContent = Number(bal).toLocaleString('ar-EG');
    }
  } catch (_) {}
}

function ensureNotificationBell() {
  const wrap = document.getElementById('header-user-section');
  if (!wrap) return null;
  let bell = document.getElementById('header-notif-bell-btn');
  if (!bell) {
    bell = document.createElement('button');
    bell.type = 'button';
    bell.id = 'header-notif-bell-btn';
    bell.className = 'header__notif-btn dashboard-header-notification-bell';
    bell.setAttribute('aria-label', 'الإشعارات');
    bell.title = 'الإشعارات والتنبيهات';
    bell.innerHTML = '<span aria-hidden="true">🔔</span><span id="header-notif-badge" class="header-notif-badge" aria-live="polite">0</span>';
    bell.addEventListener('click', () => { window.location.href = notificationsHref(); });
    wrap.parentElement?.insertBefore(bell, wrap);
  }
  return bell;
}

function renderHeader(user) {
  const wrap = document.getElementById('header-user-section');
  if (!wrap) return;
  ensureNotificationBell();

  if (!user) {
    wrap.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm header__login-btn" id="dashboard-header-login-btn"><span>🔑</span> دخول</a>';
    const btn = document.getElementById('dashboard-header-login-btn');
    btn?.addEventListener('click', async event => {
      event.preventDefault();
      if (btn.dataset.busy === '1') return;
      btn.dataset.busy = '1';
      btn.disabled = true;
      try { await signInWithGoogle(); }
      catch (err) { toast.error(err?.message === 'ACCOUNT_SUSPENDED' ? 'تم تعليق حسابك. تواصل مع الإدارة.' : 'فشل تسجيل الدخول. حاول مجدداً.'); }
      finally { btn.dataset.busy = '0'; btn.disabled = false; }
    });
    return;
  }

  const rawName = user.name || user.displayName || 'مستخدم';
  const name = esc(rawName);
  const firstName = esc(rawName.split(/\s+/)[0] || rawName);
  const photo = esc(user.photoURL || './icons/icon-72x72.png');
  const coins = typeof user.points === 'number' ? user.points : (typeof user.coins === 'number' ? user.coins : getStoredCoins());
  const coinsDisplay = Number(coins).toLocaleString('ar-EG');
  const adminLink = isAdmin(user)
    ? '<div class="header__dropdown-divider"></div><a href="admin/index.html" class="header__dropdown-item" role="menuitem">⚙️ الإدارة</a>'
    : '';

  wrap.innerHTML = `
    <div class="header__user-group">
      <a href="/wallet.html" class="header__coins-chip" id="header-coins-chip" title="رصيد ذهبيات الدليل — اضغط لفتح المحفظة" aria-label="رصيد ذهبيات الدليل — اضغط لفتح المحفظة">
        <span class="header__coins-chip-icon" aria-hidden="true">🪙</span>
        <span class="header__coins-chip-val" id="header-coins-val">${coinsDisplay}</span>
        <span class="header__coins-chip-unit">ذهبية</span>
      </a>
      <div class="header__user" style="position:relative">
        <button class="header__user-btn" id="dashboard-user-menu-btn" aria-haspopup="true" aria-expanded="false">
          <img src="${photo}" alt="${name}" class="header__avatar" width="32" height="32" onerror="this.src='./icons/icon-72x72.png'" />
          <span class="header__user-name">${firstName}</span>
          <span aria-hidden="true">▾</span>
        </button>
        <div class="header__dropdown" id="dashboard-user-dropdown" role="menu">
          <a href="/wallet.html" class="header__dropdown-item" role="menuitem" style="color:#D97706;font-weight:800">🪙 الرصيد والعملات الذهبية</a>
          <a href="dashboard.html" class="header__dropdown-item" role="menuitem">🏠 لوحة تحكمي</a>
          <a href="dashboard.html?section=places" class="header__dropdown-item" role="menuitem">📍 أماكني</a>
          <a href="dashboard.html?section=add" class="header__dropdown-item" role="menuitem">➕ إضافة مكان</a>
          <a href="${notificationsHref()}" class="header__dropdown-item" role="menuitem">🔔 الإشعارات</a>
          ${adminLink}
          <div class="header__dropdown-divider"></div>
          <button class="header__dropdown-item header__dropdown-item--danger" id="dashboard-logout-btn" role="menuitem">🚪 تسجيل الخروج</button>
        </div>
      </div>
    </div>
  `;
  fetchLiveCoins();

  const menuBtn = document.getElementById('dashboard-user-menu-btn');
  const dropdown = document.getElementById('dashboard-user-dropdown');
  menuBtn?.addEventListener('click', event => {
    event.stopPropagation();
    const open = dropdown?.classList.toggle('open') || false;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.getElementById('dashboard-logout-btn')?.addEventListener('click', async () => {
    try { await signOut(); toast.success('تم تسجيل الخروج بنجاح'); window.location.reload(); }
    catch (_) { toast.error('حدث خطأ أثناء تسجيل الخروج'); }
  });
}

async function initializeNotifications(user) {
  const uid = user?.uid || null;
  if (_notificationsInitializedFor === uid) {
    await updateAllNotificationBadges(uid).catch(() => {});
    return;
  }
  _notificationsInitializedFor = uid;
  try { initGlobalRealtimeNotificationsListener(user); }
  catch (err) { console.debug('[DashboardNotifications] realtime:', err?.message || err); }
  try { await initFcmMessaging(user); }
  catch (err) { console.debug('[DashboardNotifications] FCM:', err?.message || err); }
  await updateAllNotificationBadges(uid).catch(() => {});
}

export async function initDashboardHeaderAuthNotifications() {
  initAuth();
  const user = await waitForAuth();
  renderHeader(user);
  await initializeNotifications(user);

  if (!_bound) {
    _bound = true;
    onAuthStateChange(async nextUser => {
      renderHeader(nextUser);
      await initializeNotifications(nextUser);
    });
  }
  return user;
}

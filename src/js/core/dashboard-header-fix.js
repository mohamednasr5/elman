/**
 * Dashboard header authentication + notifications bridge.
 * The dashboard uses page-shell.js, while the older global notification/header
 * implementation lives in the standalone shared-layout path. Keep the two
 * systems synchronized here without changing the dashboard content renderer.
 */
import { initAuth, waitForAuth, onAuthStateChange, signInWithGoogle, signOut, isAdmin } from './auth.js';
import { initGlobalRealtimeNotificationsListener, updateAllNotificationBadges } from '../services/notification.service.js';
import { initFcmMessaging } from '../services/fcm.service.js';
import { toast } from '../ui/components/Toast.js';

let _bound = false;
let _authUnsubscribe = null;
let _notificationsInitializedFor = null;

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function currentNotificationsHref() {
  return 'dashboard.html?section=notifications';
}

function renderHeader(user) {
  const wrap = document.getElementById('header-user-section');
  if (!wrap) return;

  const existingBell = document.getElementById('dashboard-header-notification-bell');
  if (!existingBell) {
    const bell = document.createElement('button');
    bell.type = 'button';
    bell.id = 'dashboard-header-notification-bell';
    bell.className = 'header__notif-btn dashboard-header-notification-bell';
    bell.setAttribute('aria-label', 'الإشعارات');
    bell.title = 'الإشعارات والتنبيهات';
    bell.innerHTML = '<span aria-hidden="true">🔔</span><span id="dashboard-header-notification-badge" class="header-notif-badge" aria-live="polite">0</span>';
    bell.addEventListener('click', () => {
      window.location.href = currentNotificationsHref();
    });
    wrap.parentElement?.insertBefore(bell, wrap);
  }

  if (!user) {
    wrap.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm header__login-btn" id="dashboard-header-login-btn"><span>🔑</span> دخول</a>';
    const loginBtn = document.getElementById('dashboard-header-login-btn');
    loginBtn?.addEventListener('click', async (event) => {
      event.preventDefault();
      if (loginBtn.dataset.busy === '1') return;
      loginBtn.dataset.busy = '1';
      loginBtn.disabled = true;
      try {
        await signInWithGoogle();
      } catch (err) {
        toast.error(err?.message === 'ACCOUNT_SUSPENDED' ? 'تم تعليق حسابك. تواصل مع الإدارة.' : 'فشل تسجيل الدخول. حاول مجدداً.');
      } finally {
        loginBtn.dataset.busy = '0';
        loginBtn.disabled = false;
      }
    });
    return;
  }

  const name = esc(user.name || user.displayName || 'مستخدم');
  const firstName = esc((user.name || user.displayName || 'مستخدم').split(/\s+/)[0]);
  const photo = esc(user.photoURL || './icons/icon-72x72.png');
  const adminLink = isAdmin(user) ? '<div class="header__dropdown-divider"></div><a href="admin/index.html" class="header__dropdown-item" role="menuitem">⚙️ الإدارة</a>' : '';

  wrap.innerHTML = `
    <div class="header__user" style="position:relative">
      <button class="header__user-btn" id="dashboard-user-menu-btn" aria-haspopup="true" aria-expanded="false">
        <img src="${photo}" alt="${name}" class="header__avatar" width="32" height="32" onerror="this.src='./icons/icon-72x72.png'" />
        <span class="header__user-name">${firstName}</span>
        <span aria-hidden="true">▾</span>
      </button>
      <div class="header__dropdown" id="dashboard-user-dropdown" role="menu">
        <a href="dashboard.html" class="header__dropdown-item" role="menuitem">🏠 لوحة تحكمي</a>
        <a href="dashboard.html?section=places" class="header__dropdown-item" role="menuitem">📍 أماكني</a>
        <a href="dashboard.html?section=add" class="header__dropdown-item" role="menuitem">➕ إضافة مكان</a>
        <a href="${currentNotificationsHref()}" class="header__dropdown-item" role="menuitem">🔔 الإشعارات</a>
        ${adminLink}
        <div class="header__dropdown-divider"></div>
        <button class="header__dropdown-item header__dropdown-item--danger" id="dashboard-logout-btn" role="menuitem">🚪 تسجيل الخروج</button>
      </div>
    </div>
  `;

  const menuBtn = document.getElementById('dashboard-user-menu-btn');
  const dropdown = document.getElementById('dashboard-user-dropdown');
  menuBtn?.addEventListener('click', event => {
    event.stopPropagation();
    const open = dropdown?.classList.toggle('open') || false;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  if (!_bound) {
    document.addEventListener('click', () => {
      dropdown?.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    });
  }
  document.getElementById('dashboard-logout-btn')?.addEventListener('click', async () => {
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      window.location.reload();
    } catch (_) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  });
}

async function initializeNotifications(user) {
  const uid = user?.uid || null;
  if (_notificationsInitializedFor === uid) {
    updateAllNotificationBadges(uid);
    return;
  }
  _notificationsInitializedFor = uid;
  try {
    initGlobalRealtimeNotificationsListener(user);
  } catch (err) {
    console.debug('[DashboardNotifications] realtime listener:', err?.message || err);
  }
  try {
    await initFcmMessaging(user);
  } catch (err) {
    console.debug('[DashboardNotifications] FCM init:', err?.message || err);
  }
  try {
    updateAllNotificationBadges(uid);
  } catch (_) {}
}

export async function initDashboardHeaderAuthNotifications() {
  initAuth();
  const user = await waitForAuth();
  renderHeader(user);
  await initializeNotifications(user);

  if (!_bound) {
    _bound = true;
    _authUnsubscribe = onAuthStateChange(async nextUser => {
      renderHeader(nextUser);
      await initializeNotifications(nextUser);
    });
  }

  return user;
}

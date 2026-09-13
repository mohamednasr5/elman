/**
 * المنزلة وناسها — Global Layout & Common Functionality
 * Runs across all standalone HTML pages
 */

import { initFirebase } from './firebase.js';
import { initAuth, signInWithGoogle, signOut, getCurrentUser, isAdmin, onAuthStateChange } from './auth.js';
import { getSettings } from './db.js';
import { toast } from '../ui/components/Toast.js';

import { getUserNotifications, markAllNotificationsAsRead } from './db.js';
import { showModal } from '../ui/components/Modal.js';

let _lastSeenNotifId = null;

export async function initRealtimeNotifications(currentUser) {
  const bellBtn = document.getElementById('header-notif-bell-btn');
  const badgeEl = document.getElementById('header-notif-badge');

  async function updateNotifBadge() {
    try {
      const notifs = await getUserNotifications(currentUser?.uid);
      const unread = notifs.filter(n => !n.isRead);
      if (badgeEl) {
        if (unread.length > 0) {
          badgeEl.textContent = unread.length > 99 ? '99+' : unread.length;
          badgeEl.style.display = 'inline-block';
        } else {
          badgeEl.style.display = 'none';
        }
      }

      if (unread.length > 0) {
        const latest = unread[0];
        const lastShownKey = currentUser?.uid ? `last_toast_notif_${currentUser.uid}` : 'last_toast_notif_anon';
        const lastShownId = localStorage.getItem(lastShownKey);
        if (latest.id !== lastShownId && (Date.now() - (latest.createdAt || 0)) < 2 * 60 * 60 * 1000) {
          localStorage.setItem(lastShownKey, latest.id);
          showInstantNotificationToast(latest);
        }
      }
    } catch (_) {}
  }

  updateNotifBadge();
  setInterval(updateNotifBadge, 30000);

  window.addEventListener('manzala:new_broadcast_notification', (e) => {
    const n = e.detail;
    updateNotifBadge();
    if (n) showInstantNotificationToast(n);
  });

  bellBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await openHeaderNotificationsModal(currentUser);
    updateNotifBadge();
  });
}

function showInstantNotificationToast(notif) {
  if (!notif) return;
  const isVerify = notif.type === 'place_verified';
  toast.custom({
    title: notif.title || (isVerify ? '👑 توثيق رسمي جديد' : '🎉 انضمام نشاط جديد'),
    message: notif.message || notif.placeName,
    icon: isVerify ? '👑' : '🏪',
    actionText: notif.actionText || 'مشاهدة المكان 👁️',
    actionUrl: notif.actionUrl,
    duration: 7000
  });
}

async function openHeaderNotificationsModal(user) {
  const notifs = await getUserNotifications(user?.uid);
  const unreadCount = notifs.filter(n => !n.isRead).length;
  showModal({
    title: `🔔 الإشعارات والتنبيهات ${unreadCount > 0 ? `(${unreadCount} جديد)` : ''}`,
    size: 'md',
    content: `
      <div style="max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px">
        ${notifs.length === 0 ? `
          <div style="text-align:center;padding:30px 15px;color:var(--text-muted)">
            <div style="font-size:2.5rem;margin-bottom:8px">🔕</div>
            <div style="font-weight:700">لا توجد إشعارات جديدة حالياً</div>
            <div style="font-size:12px;margin-top:4px">ستصلك هنا كافة التنبيهات الفورية عند انضمام وتوثيق الأماكن وزيارات ملفك.</div>
          </div>
        ` : notifs.map(n => {
          const isUnread = !n.isRead;
          const isVerify = n.type === 'place_verified';
          const isNewPlace = n.type === 'new_place';
          const bg = isUnread ? (isVerify ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)') : 'var(--surface)';
          const border = isUnread ? (isVerify ? '#F59E0B' : '#10B981') : 'var(--border)';
          return `
            <div style="background:${bg};border:1.5px solid ${border};border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 6px rgba(0,0,0,0.04)">
              <div style="width:42px;height:42px;border-radius:50%;background:${isVerify ? '#FEF3C7' : '#D1FAE5'};display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">${isVerify ? '👑' : (isNewPlace ? '🏪' : '👁️')}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:800;font-size:13.5px;color:var(--text-primary)">${n.title || n.placeName}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;line-height:1.4">${n.message || ''}</div>
              </div>
              ${n.actionUrl ? `<a href="${n.actionUrl}" target="${n.actionUrl.startsWith('http') ? '_blank' : '_self'}" class="btn btn-sm btn-primary" style="font-size:11.5px;padding:5px 12px;border-radius:8px;white-space:nowrap;font-weight:700;flex-shrink:0">${n.actionText || 'عرض'}</a>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `,
    buttons: [
      {
        label: '✓ تحديد الكل كمقروء',
        type: 'outline',
        closeOnClick: true,
        onClick: async () => {
          if (user?.uid) await markAllNotificationsAsRead(user.uid);
          if (typeof localStorage !== 'undefined') {
            const key = user?.uid ? `read_global_notifs_${user.uid}` : 'read_global_notifs_anon';
            localStorage.setItem(key, JSON.stringify(notifs.map(n => n.id)));
          }
          const badgeEl = document.getElementById('header-notif-badge');
          if (badgeEl) badgeEl.style.display = 'none';
        }
      },
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });
}

export async function initPageLayout({ activeNav = '' } = {}) {
  initFirebase();
  initAuth();
  highlightActiveNav(activeNav);
  setupHeaderEvents();
  setupPwaBanner();
  loadAndApplySettings();
  onAuthStateChange((user) => {
    updateHeaderUserUI(user);
    initRealtimeNotifications(user);
  });
  initRealtimeNotifications(getCurrentUser());
}

function highlightActiveNav(activeNav) {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active', href === currentPath || (activeNav && href.includes(activeNav)));
  });
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    const href = item.getAttribute('href') || '';
    item.classList.toggle('active', href === currentPath || (activeNav && href.includes(activeNav)));
  });
}

function setupHeaderEvents() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 10), { passive: true });
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      }
    });
  }
  document.getElementById('mobile-search-btn')?.addEventListener('click', () => { window.location.href = 'search.html'; });
}

async function loadAndApplySettings() {
  try {
    const settings = await getSettings();
    if (!settings) return;
    if (settings.general?.siteName) document.querySelectorAll('.header__logo-name, .footer__logo-name').forEach(el => { el.textContent = settings.general.siteName; });
    if (settings.general?.primaryColor) document.documentElement.style.setProperty('--primary', settings.general.primaryColor);
    const waLink = settings.contact?.whatsappLink || 'https://wa.me/wasendernew';
    const waFooterBtn = document.getElementById('footer-whatsapp-link');
    if (waFooterBtn) waFooterBtn.href = waLink;
  } catch (err) { console.warn('[Layout] Settings load:', err); }
}

export function updateHeaderUserUI(user) {
  const container = document.getElementById('header-user-section');
  if (!container) return;
  if (user) {
    const dashboardLinks = [
      ['🏠','لوحة تحكمي','dashboard.html'],
      ['📍','أماكني','dashboard.html?section=places'],
      ['🎁','الولاء والنقاط','dashboard.html?section=loyalty'],
      ['➕','إضافة مكان','dashboard.html?section=add'],
      ['❤️','المفضلة','favorites.html'],
      ['⭐','متابعاتي وعروضها','dashboard.html?section=following'],
      ['📈','التقارير والإحصائيات','dashboard.html?section=analytics'],
      ['🗺️','بالقرب مني (GPS)','dashboard.html?section=around-me'],
      ['🔔','الإشعارات والزيارات','dashboard.html?section=notifications']
    ];
    container.innerHTML = `
      <div class="header__user">
        <button class="header__user-btn" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
          <img src="${user.photoURL || './icons/icon-72x72.png'}" alt="${user.name}" class="header__avatar" width="32" height="32" />
          <span class="header__user-name">${user.name.split(' ')[0]}</span>
          <span aria-hidden="true">▾</span>
        </button>
        <div class="header__dropdown header__dropdown--dashboard" id="user-dropdown" role="menu">
          ${dashboardLinks.map(([icon,label,href]) => `<a href="${href}" class="header__dropdown-item" role="menuitem"><span aria-hidden="true">${icon}</span> ${label}</a>`).join('')}
          <div class="header__dropdown-divider"></div>
          ${user.role === 'admin' || user.role === 'superadmin' ? '<a href="admin/index.html" class="header__dropdown-item" role="menuitem" style="color:var(--secondary)"><span aria-hidden="true">⚙️</span> لوحة الإدارة</a><div class="header__dropdown-divider"></div>' : ''}
          <button class="header__dropdown-item header__dropdown-item--danger" id="logout-btn" role="menuitem"><span aria-hidden="true">🚪</span> تسجيل الخروج</button>
        </div>
      </div>
    `;

    const menuBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown?.classList.toggle('open') || false;
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', () => {
      dropdown?.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    });
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await signOut();
      toast.success('تم تسجيل الخروج');
      window.location.reload();
    });
  } else {
    container.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm header__login-btn"><span>🔑</span> دخول</a>`;
  }
}

let _deferredPrompt = null;
function setupPwaBanner() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    const banner = document.getElementById('pwa-banner');
    if (banner && !sessionStorage.getItem('pwa-dismissed')) {
      setTimeout(() => { banner.hidden = false; banner.classList.add('visible'); }, 5000);
    }
  });
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (_deferredPrompt) { _deferredPrompt.prompt(); _deferredPrompt = null; document.getElementById('pwa-banner')?.classList.remove('visible'); }
  });
  document.getElementById('pwa-banner-close')?.addEventListener('click', () => {
    document.getElementById('pwa-banner')?.classList.remove('visible');
    sessionStorage.setItem('pwa-dismissed', '1');
  });
}

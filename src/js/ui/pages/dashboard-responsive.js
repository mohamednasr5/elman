/*
 * Dashboard responsive navigation + PWA notification prompt bridge.
 * Keeps the same feature set on desktop and mobile without duplicating dashboard logic.
 */
import { initFcmMessaging, mountPushNotificationPrompt } from '../../services/fcm.service.js';
import { getCurrentUser } from '../../core/auth.js';

(function () {
  'use strict';

  const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

  function buildMobileDashboardNav() {
    if (document.getElementById('dashboard-mobile-drawer')) return;
    const sidebarNav = document.getElementById('dashboard-sidebar-nav');
    const layout = document.querySelector('.dashboard-layout');
    if (!sidebarNav || !layout) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'dashboard-mobile-menu-btn';
    toggle.className = 'dashboard-mobile-menu-btn';
    toggle.setAttribute('aria-label', 'فتح قائمة لوحة التحكم');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span>☰</span><span>قائمة لوحة التحكم</span>';

    const overlay = document.createElement('div');
    overlay.id = 'dashboard-mobile-overlay';
    overlay.className = 'dashboard-mobile-overlay';
    overlay.hidden = true;

    const drawer = document.createElement('aside');
    drawer.id = 'dashboard-mobile-drawer';
    drawer.className = 'dashboard-mobile-drawer';
    drawer.setAttribute('aria-label', 'قائمة لوحة التحكم على الهاتف');
    drawer.setAttribute('aria-hidden', 'true');

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'dashboard-mobile-drawer__close';
    close.setAttribute('aria-label', 'إغلاق القائمة');
    close.innerHTML = '✕';

    const title = document.createElement('div');
    title.className = 'dashboard-mobile-drawer__title';
    title.innerHTML = '<strong>لوحة تحكمي</strong><span>كل أدوات حسابك في مكان واحد</span>';

    const nav = sidebarNav.cloneNode(true);
    nav.removeAttribute('id');
    nav.classList.add('dashboard-mobile-drawer__nav');
    nav.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    drawer.append(close, title, nav);
    document.body.append(toggle, overlay, drawer);

    const open = () => {
      if (!isMobile()) return;
      overlay.hidden = false;
      requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        drawer.classList.add('is-open');
      });
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('dashboard-mobile-menu-open');
    };

    const closeMenu = () => {
      overlay.classList.remove('is-open');
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('dashboard-mobile-menu-open');
      setTimeout(() => { overlay.hidden = true; }, 220);
    };

    toggle.addEventListener('click', open);
    close.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

    nav.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (!href.includes('dashboard.html')) {
        closeMenu();
        return;
      }
      e.preventDefault();
      const url = new URL(link.href, location.href);
      const section = url.searchParams.get('section') || 'overview';
      const placeId = url.searchParams.get('id') || null;
      const action = url.searchParams.get('action') || null;
      closeMenu();
      if (typeof window.switchDashboardSection === 'function') {
        if (action) history.pushState(null, '', url.href);
        window.switchDashboardSection(section, placeId, !action);
        if (action === 'scan') {
          setTimeout(() => document.getElementById('bcs-btn-take-photo')?.click(), 600);
        }
      } else {
        window.location.href = href;
      }
    });

    window.addEventListener('resize', () => {
      if (!isMobile()) closeMenu();
    }, { passive: true });
  }

  function init() {
    buildMobileDashboardNav();
    const user = getCurrentUser?.() || null;
    initFcmMessaging(user).catch(() => {});
    // Installed PWA: show the permission card promptly. The browser permission
    // request itself still happens only after the user's button click.
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true || new URLSearchParams(location.search).get('source') === 'pwa';
    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
    if (standalone && permission === 'default') {
      setTimeout(() => mountPushNotificationPrompt(user), 900);
    } else if (permission === 'default') {
      setTimeout(() => mountPushNotificationPrompt(user), 3500);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

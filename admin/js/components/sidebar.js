/**
 * المنزلة وناسها — Admin Sidebar Component
 */

import { can } from '../core/auth.js';

export const NAV_SECTIONS = [
  {
    title: 'الرئيسية',
    items: [
      { id: 'overview', hash: '#overview', label: 'لوحة التحكم والمؤشرات', icon: '📊', perm: 'dashboard.read' }
    ]
  },
  {
    title: 'إدارة المحتوى',
    items: [
      { id: 'places', hash: '#places', label: 'الأماكن والأنشطة', icon: '🏢', perm: 'places.read' },
      { id: 'verification', hash: '#verification', label: 'طلبات التوثيق', icon: '🛡️', perm: 'verification.read', badgeId: 'badge-nav-verification' },
      { id: 'categories', hash: '#categories', label: 'الأقسام والتصنيفات', icon: '🗂️', perm: 'categories.read' },
      { id: 'products', hash: '#products', label: 'المنتجات والخدمات', icon: '🛍️', perm: 'products.read' },
      { id: 'reviews', hash: '#reviews', label: 'التقييمات والآراء', icon: '⭐', perm: 'reviews.read' }
    ]
  },
  {
    title: 'المستخدمين والصلاحيات',
    items: [
      { id: 'users', hash: '#users', label: 'إدارة المستخدمين', icon: '👥', perm: 'users.read' },
      { id: 'audit-logs', hash: '#audit-logs', label: 'سجل العمليات (Audit)', icon: '📜', perm: 'audit.read' }
    ]
  },
  {
    title: 'الملفات والوسائط',
    items: [
      { id: 'media', hash: '#media', label: 'مكتبة الوسائط R2', icon: '🖼️', perm: 'media.read' }
    ]
  },
  {
    title: 'التواصل والاتصال',
    items: [
      { id: 'notifications', hash: '#notifications', label: 'إرسال إشعارات دفع FCM', icon: '📢', perm: 'notifications.send' }
    ]
  },
  {
    title: 'النظام والأمان',
    items: [
      { id: 'system-health', hash: '#system-health', label: 'صحة النظام والخدمات', icon: '🩺', perm: 'system.read' },
      { id: 'security', hash: '#security', label: 'جدار الحماية والحظر IP', icon: '🔒', perm: 'security.read' },
      { id: 'settings', hash: '#settings', label: 'إعدادات المنظومة', icon: '⚙️', perm: 'settings.read' }
    ]
  }
];

export function renderSidebar(container) {
  let navHtml = '';

  NAV_SECTIONS.forEach(section => {
    // Filter items based on permissions
    const visibleItems = section.items.filter(item => !item.perm || can(item.perm));
    if (visibleItems.length === 0) return;

    navHtml += `
      <div class="sidebar-section">
        <div class="sidebar-section-title">${section.title}</div>
        <ul class="sidebar-menu">
          ${visibleItems.map(item => `
            <li class="sidebar-menu-item">
              <a href="${item.hash}" class="sidebar-nav-link" data-route="${item.id}" id="nav-${item.id}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-text">${item.label}</span>
                ${item.badgeId ? `<span class="nav-badge" id="${item.badgeId}" style="display:none;"></span>` : ''}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  });

  container.innerHTML = `
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo-wrap">
          <span class="brand-logo-icon">🏛️</span>
        </div>
        <div class="brand-text">
          <span class="brand-title">دليل المنزلة والمطرية</span>
          <span class="brand-subtitle">لوحة الإدارة المتقدمة v2</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        ${navHtml}
      </nav>

      <div class="sidebar-footer">
        <a href="../index.html" class="btn-return-site" target="_blank">
          <span>🌐 العودة للموقع العام</span>
          <span class="ext-icon">↗</span>
        </a>
      </div>
    </aside>
  `;

  // Close sidebar on mobile when nav link clicked
  container.querySelectorAll('.sidebar-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.body.classList.remove('admin-sidebar-open');
    });
  });
}

export function setActiveNavLink(routeId) {
  document.querySelectorAll('.sidebar-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-route') === routeId) {
      link.classList.add('active');
    }
  });
}

export function updateSidebarBadge(badgeId, count) {
  const el = document.getElementById(badgeId);
  if (!el) return;
  if (count > 0) {
    el.textContent = count > 99 ? '99+' : count;
    el.style.display = 'inline-flex';
  } else {
    el.style.display = 'none';
  }
}

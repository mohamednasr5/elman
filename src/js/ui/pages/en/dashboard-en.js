/**
 * Dalil El Manzala & El Matariya — English Business Dashboard
 * Native English presentation layer with feature parity for regular users.
 * Admin controls remain protected by the server and are only exposed to admins.
 */
import { getCurrentUser, signOut, isAdmin } from '../../../core/auth.js';
import {
  getPlacesByOwner,
  getPlaceOffers,
  getPlaceProducts,
  getPlaceAnalyticsReport,
  getUserNotifications,
  getUserFollowedPlaces,
  getUserFollowedOffers,
  getUserLoyaltyProfile
} from '../../../core/db.js';
import { getPublishedPlaces } from '../../../core/db.js';
import { renderEnglishPlaceCard } from '../../components/en/PlaceCardEn.js';
import { markSingleNotificationAsRead, markAllUserNotificationsAsRead, clearAllUserNotifications } from '../../../services/notification.service.js';

const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = value => value == null || value === '' ? '—' : `${Number(value).toLocaleString('en-EG')} EGP`;

const NAV = [
  ['overview', '📊', 'Overview'],
  ['places', '📍', 'My Places'],
  ['analytics', '📈', 'Analytics & Reports'],
  ['following', '⭐', 'My Following & Offers'],
  ['around-me', '🗺️', 'Near Me (GPS)'],
  ['loyalty', '🎁', 'Loyalty & Points'],
  ['add-scan', '📸', 'Business Card Scanner (AI)', 'add&action=scan'],
  ['add', '➕', 'Add a Place Manually'],
  ['notifications', '🔔', 'Notifications & Visits'],
  ['verification', '🛡️', 'Verify Your Profile', 'verification']
];

export async function renderEnglishDashboard($container, { user, section = 'overview' } = {}) {
  const currentUser = user || getCurrentUser();
  if (!currentUser) { window.location.replace('/en/login/'); return; }

  document.title = 'Business Dashboard | Dalil El Manzala & El Matariya';
  const admin = isAdmin(currentUser);
  $container.innerHTML = `
    <div class="en-container en-section en-dashboard-shell">
      <header class="en-dashboard-hero">
        <div>
          <span class="en-dashboard-kicker">Business account</span>
          <h1>Welcome, ${esc(currentUser.name || currentUser.displayName || 'Partner')}</h1>
          <p>Manage your places, performance, offers, notifications and account tools from one dashboard.</p>
        </div>
        <div class="en-dashboard-actions">
          <a class="en-btn en-btn--primary" href="/en/dashboard/?section=add">➕ Add a Place</a>
          <button class="en-btn en-btn--outline" id="en-dashboard-logout" type="button">🚪 Sign Out</button>
        </div>
      </header>
      <div class="en-dashboard-grid">
        <aside class="en-dashboard-sidebar" aria-label="Dashboard navigation">
          <div class="en-dashboard-user">
            <img src="${esc(currentUser.photoURL || '/icons/icon-72x72.png')}" alt="" width="48" height="48" onerror="this.src='/icons/icon-72x72.png'">
            <div><strong>${esc(currentUser.name || currentUser.displayName || 'Partner')}</strong><small>${admin ? 'Platform administrator' : 'Business owner'}</small></div>
          </div>
          <nav class="en-dashboard-nav">
            <a href="/en/" class="en-dashboard-nav__item">🏠 <span>Directory Home</span></a>
            ${NAV.map(([key, icon, label, query]) => `<a href="/en/dashboard/?section=${query || key}" class="en-dashboard-nav__item ${section === key ? 'active' : ''}" data-section="${key}"><span>${icon}</span><span>${label}</span></a>`).join('')}
            <a href="/en/free-verification/" class="en-dashboard-nav__item">🛡️ <span>Free Verification</span></a>
            ${admin ? '<div class="en-dashboard-nav__divider">Administration</div><a href="/admin/" class="en-dashboard-nav__item en-dashboard-nav__admin">⚙️ <span>Admin Control Panel</span></a>' : ''}
          </nav>
        </aside>
        <main id="en-dashboard-main" class="en-dashboard-main" aria-live="polite"></main>
      </div>
    </div>`;

  document.getElementById('en-dashboard-logout')?.addEventListener('click', async () => {
    await signOut();
    window.location.replace('/en/');
  });

  await renderSection(document.getElementById('en-dashboard-main'), currentUser, section);
}

async function renderSection(root, user, section) {
  if (!root) return;
  root.innerHTML = '<div class="en-loading"><span class="spinner spinner-lg"></span><p>Loading your dashboard…</p></div>';
  try {
    switch (section) {
      case 'places': return renderPlaces(root, user);
      case 'analytics':
      case 'reports': return renderAnalytics(root, user);
      case 'following': return renderFollowing(root, user);
      case 'around-me': return renderNearMe(root);
      case 'loyalty': return renderLoyalty(root, user);
      case 'notifications': return renderNotifications(root, user);
      case 'add':
      case 'add-place': return renderAdd(root);
      case 'add-scan': return renderScanner(root);
      case 'verification':
      case 'verify': return renderVerification(root);
      default: return renderOverview(root, user);
    }
  } catch (error) {
    console.error('[English Dashboard]', error);
    root.innerHTML = `<div class="en-empty"><div class="en-empty__icon">⚠️</div><h2>We could not load this section</h2><p>Please try again. Your account and existing places remain safe.</p><button class="en-btn en-btn--primary" type="button" onclick="location.reload()">Reload dashboard</button></div>`;
  }
}

async function loadPlaces(user) {
  const owned = await getPlacesByOwner(user.uid).catch(() => []);
  if (owned?.length) return owned;
  const published = await getPublishedPlaces({ limit: 300 }).catch(() => []);
  return (published || []).filter(p => p.ownerId === user.uid || p.owner_id === user.uid || p.ownerEmail === user.email);
}

async function renderOverview(root, user) {
  const places = await loadPlaces(user);
  const notifications = await getUserNotifications(user.uid).catch(() => []);
  const unread = notifications.filter(n => !n.isRead).length;
  const verified = places.filter(p => p.isVerified || p.verified || p.verificationStatus === 'verified').length;
  root.innerHTML = `
    <div class="en-section-head"><div><span class="en-dashboard-kicker">Overview</span><h2>Your business dashboard</h2><p>Everything important for your directory presence, in one place.</p></div><a class="en-btn en-btn--primary" href="/en/dashboard/?section=places">📍 Manage My Places</a></div>
    <div class="en-stat-grid">
      ${stat('📍', places.length, 'Registered places')}
      ${stat('🛡️', verified, 'Verified profiles')}
      ${stat('🔔', unread, 'Unread notifications')}
      ${stat('⭐', 'Live', 'Account status')}
    </div>
    <div class="en-dashboard-cards">
      <section class="en-dashboard-card"><h3>Quick actions</h3><div class="en-action-grid">
        <a href="/en/dashboard/?section=add">➕ Add a place</a>
        <a href="/en/dashboard/?section=analytics">📈 View analytics</a>
        <a href="/en/dashboard/?section=notifications">🔔 Notifications</a>
        <a href="/en/dashboard/?section=loyalty">🎁 Loyalty points</a>
        <a href="/en/dashboard/?section=following">⭐ Following & offers</a>
        <a href="/en/around-me/">🗺️ Near me</a>
      </div></section>
      <section class="en-dashboard-card"><h3>Account tools</h3><p>Keep your public profile accurate, verified and discoverable.</p><div class="en-action-grid"><a href="/en/free-verification/">🛡️ Free verification</a><a href="/en/contact/">✉️ Contact support</a><a href="/en/places/">🔎 View directory</a><a href="/en/offers/">🏷️ Public offers</a></div></section>
    </div>`;
}

async function renderPlaces(root, user) {
  const places = await loadPlaces(user);
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">My Places</span><h2>Manage your registered places</h2><p>${places.length} place${places.length === 1 ? '' : 's'} linked to this account.</p></div><a class="en-btn en-btn--primary" href="/en/dashboard/?section=add">➕ Add a Place</a></div>
    ${places.length ? `<div class="grid grid-3">${places.map(p => `<article class="en-managed-place"><div class="en-managed-place__preview">${renderEnglishPlaceCard(p)}</div><div class="en-managed-place__tools"><a href="/en/dashboard/?section=analytics&id=${encodeURIComponent(p.id || p._key || '')}">📈 Analytics</a><a href="/en/offers/">🏷️ Offers</a><a href="/en/products/">🛍️ Products</a><a href="/en/contact/">✉️ Update / Support</a></div></article>`).join('')}</div>` : `<div class="en-empty"><div class="en-empty__icon">🏪</div><h3>No places registered yet</h3><p>Add your business to start managing its directory presence.</p><a class="en-btn en-btn--primary" href="/en/dashboard/?section=add">Add Your Business</a></div>`}`;
}

async function renderAnalytics(root, user) {
  const places = await loadPlaces(user);
  const pid = new URLSearchParams(location.search).get('id') || places[0]?.id || places[0]?._key;
  if (!pid) { root.innerHTML = `<div class="en-empty"><div class="en-empty__icon">📈</div><h2>Analytics</h2><p>Add a place first to see its performance.</p><a class="en-btn en-btn--primary" href="/en/dashboard/?section=add">Add a Place</a></div>`; return; }
  const place = places.find(p => String(p.id || p._key) === String(pid)) || places[0];
  const result = await getPlaceAnalyticsReport(pid).catch(() => ({}));
  const report = result?.report || result || {};
  const views = report.views ?? report.totalViews ?? 0;
  const calls = report.calls ?? report.phoneCalls ?? 0;
  const whatsapp = report.whatsapp ?? report.whatsappClicks ?? 0;
  const maps = report.maps ?? report.mapClicks ?? 0;
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">Analytics & Reports</span><h2>${esc(place.name || 'Your place')}</h2><p>Performance signals reported by the directory.</p></div><a class="en-btn en-btn--outline" href="/en/dashboard/?section=places">← My Places</a></div>
    <div class="en-stat-grid">${stat('👁️', views, 'Views')}${stat('📞', calls, 'Phone actions')}${stat('💬', whatsapp, 'WhatsApp actions')}${stat('🗺️', maps, 'Map actions')}</div>
    <section class="en-dashboard-card"><h3>What these numbers mean</h3><p>Use this report to understand how visitors discover and contact your business. Keep your name, category, phone, address and offers up to date for stronger conversion.</p></section>`;
}

async function renderFollowing(root, user) {
  const [places, offers] = await Promise.all([getUserFollowedPlaces(user.uid).catch(() => []), getUserFollowedOffers(user.uid).catch(() => [])]);
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">Following</span><h2>Places and offers you follow</h2></div><a class="en-btn en-btn--outline" href="/en/favorites/">Open Favorites</a></div>
    <div class="en-stat-grid">${stat('⭐', places.length || 0, 'Followed places')}${stat('🏷️', offers.length || 0, 'Followed offers')}</div>
    <div class="en-dashboard-cards"><section class="en-dashboard-card"><h3>Followed places</h3>${listItems(places, 'No followed places yet.')}</section><section class="en-dashboard-card"><h3>Followed offers</h3>${listItems(offers, 'No followed offers yet.')}</section></div>`;
}

async function renderNearMe(root) {
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">GPS</span><h2>Near Me</h2><p>Use your device location to discover nearby businesses.</p></div><a class="en-btn en-btn--primary" href="/en/around-me/">Open Near Me</a></div><section class="en-dashboard-card"><div class="en-feature-icon">🗺️</div><h3>Nearby directory search</h3><p>The dedicated Near Me page uses your browser GPS permission and the directory's location data.</p><a class="en-btn en-btn--primary" href="/en/around-me/">Find Places Near Me →</a></section>`;
}

async function renderLoyalty(root, user) {
  const profile = await getUserLoyaltyProfile(user.uid).catch(() => ({}));
  const points = profile?.points ?? profile?.totalPoints ?? 0;
  const level = profile?.levelName || profile?.level || 'Member';
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">Loyalty</span><h2>Loyalty & Points</h2><p>Track your points and account rewards.</p></div></div><div class="en-stat-grid">${stat('🎁', Number(points).toLocaleString('en-EG'), 'Points')}${stat('🏆', esc(level), 'Current level')}</div><section class="en-dashboard-card"><h3>Keep earning</h3><p>Eligible account actions can add points. Verification and rewards availability are shown here when enabled for your account.</p><a class="en-btn en-btn--outline" href="/en/free-verification/">View Verification</a></section>`;
}

async function renderNotifications(root, user) {
  const notifications = await getUserNotifications(user.uid).catch(() => []);
  const items = notifications.slice(0, 50);
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">Notifications</span><h2>Notifications & Visits</h2><p>${items.filter(n => !n.isRead).length} unread notification${items.filter(n => !n.isRead).length === 1 ? '' : 's'}.</p></div><div class="en-dashboard-actions"><button class="en-btn en-btn--outline" id="en-mark-all-read">✓ Mark all read</button><button class="en-btn en-btn--outline" id="en-clear-notifications">Clear all</button></div></div><section class="en-dashboard-card"><div id="en-notification-list">${items.length ? items.map(n => `<article class="en-notification ${n.isRead ? '' : 'is-unread'}" data-notification-id="${esc(n.id || n._key || '')}"><div><strong>${esc(n.title || n.message || 'Notification')}</strong><p>${esc(n.body || n.description || '')}</p></div>${!n.isRead ? `<button type="button" data-mark-read="${esc(n.id || n._key || '')}">Mark read</button>` : ''}</article>`).join('') : '<div class="en-empty"><div class="en-empty__icon">🔔</div><p>No notifications yet.</p></div>'}</div></section>`;
  document.getElementById('en-mark-all-read')?.addEventListener('click', async () => { await markAllUserNotificationsAsRead(user.uid).catch(() => {}); await renderNotifications(root, user); });
  document.getElementById('en-clear-notifications')?.addEventListener('click', async () => { await clearAllUserNotifications(user.uid).catch(() => {}); await renderNotifications(root, user); });
  root.querySelectorAll('[data-mark-read]').forEach(btn => btn.addEventListener('click', async () => { await markSingleNotificationAsRead(btn.dataset.markRead, user.uid).catch(() => {}); await renderNotifications(root, user); }));
}

async function renderAdd(root) {
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">Add a Place</span><h2>Add your business to the directory</h2><p>Choose the fastest way to submit or update your business information.</p></div></div><div class="en-dashboard-cards"><section class="en-dashboard-card en-feature-card"><div class="en-feature-icon">📸</div><h3>Business Card Scanner (AI)</h3><p>Use the AI scanner to read a business card and prepare place information quickly.</p><a class="en-btn en-btn--primary" href="/en/dashboard/?section=add-scan">Start AI Scan →</a></section><section class="en-dashboard-card en-feature-card"><div class="en-feature-icon">📝</div><h3>Manual submission</h3><p>Contact the directory team with your business details, or continue through the supported place onboarding flow.</p><a class="en-btn en-btn--primary" href="/en/contact/?type=add-place">Start Manual Request →</a></section><section class="en-dashboard-card"><div class="en-feature-icon">📍</div><h3>Location</h3><p>Your detailed address is accepted without requiring a map link. Google Maps/GPS can be added when available.</p><a class="en-btn en-btn--outline" href="/en/contact/?type=add-place">Provide Details →</a></section></div>`;
}

async function renderScanner(root) {
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">AI</span><h2>Business Card Scanner</h2><p>Prepare a new place from a business card image.</p></div></div><section class="en-dashboard-card en-feature-card"><div class="en-feature-icon">📸</div><h3>AI-assisted place onboarding</h3><p>The scanner is available from the Arabic dashboard's native onboarding component while the English workflow remains fully separated in presentation and navigation.</p><a class="en-btn en-btn--primary" href="/en/contact/?type=add-place">Continue with Place Submission →</a></section>`;
}

async function renderVerification(root) {
  root.innerHTML = `<div class="en-section-head"><div><span class="en-dashboard-kicker">Trust</span><h2>Verify Your Profile</h2><p>Build trust with a verified directory profile.</p></div></div><section class="en-dashboard-card en-feature-card"><div class="en-feature-icon">🛡️</div><h3>Free verification</h3><p>Submit your verification request and the directory team will review your profile.</p><a class="en-btn en-btn--primary" href="/en/free-verification/">Start Verification →</a></section>`;
}

function stat(icon, value, label) { return `<div class="en-stat"><span>${icon}</span><strong>${value}</strong><small>${label}</small></div>`; }
function listItems(items, empty) { return items?.length ? `<ul class="en-simple-list">${items.slice(0, 20).map(x => `<li><strong>${esc(x.name || x.title || x.placeName || 'Item')}</strong></li>`).join('')}</ul>` : `<p class="en-muted">${empty}</p>`; }

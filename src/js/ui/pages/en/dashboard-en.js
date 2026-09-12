/**
 * Dalil El Manzala & El Matariya — English Dashboard Page
 * Dedicated native English business owner dashboard renderer
 */

import { getCurrentUser, signOut } from '../../../core/auth.js';
import { getPublishedPlaces, getCategories } from '../../../core/db.js';
import { renderPlaceCard } from '../../components/PlaceCard.js';

export async function renderEnglishDashboard($container, { user, section = 'overview' } = {}) {
  document.title = 'Dashboard | Dalil El Manzala & El Matariya';

  const currentUser = user || getCurrentUser();
  if (!currentUser) {
    window.location.replace('/en/login/');
    return;
  }

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          Business Dashboard
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Welcome, ${escHtml(currentUser.displayName || 'Partner')}. Manage your directory listings, offers, and profile.
        </p>
      </div>
    </div>

    <div class="container section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:8px">
          <a href="/en/dashboard/?section=overview" class="btn btn-sm ${section === 'overview' ? 'btn-primary' : 'btn-outline'}">My Places</a>
          <a href="/en/free-verification/" class="btn btn-sm btn-outline">Claim Free Verification</a>
        </div>
        <button type="button" class="btn btn-danger btn-sm" id="btn-en-logout">Sign Out</button>
      </div>

      <div class="card" style="padding:24px;margin-bottom:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <h2 style="font-size:1.25rem;font-weight:800;color:var(--primary);margin:0 0 4px">My Registered Places</h2>
            <p style="color:var(--text-secondary);font-size:14px;margin:0">Listings linked to your account (${escHtml(currentUser.email || '')})</p>
          </div>
          <a href="https://wa.me/wasendernew?text=Hello%2C%20I%20would%20like%20to%20add%20or%20update%20my%20place%20on%20Dalil%20El%20Manzala" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
            + Add / Update Place
          </a>
        </div>
      </div>

      <div class="grid grid-4" id="dashboard-places-grid">
        <p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:32px 0">Loading your places...</p>
      </div>
    </div>
  `;

  document.getElementById('btn-en-logout')?.addEventListener('click', async () => {
    await signOut();
    window.location.replace('/en/');
  });

  const allPlaces = await getPublishedPlaces({ limit: 200 });
  const userPlaces = (allPlaces || []).filter(p => p.ownerId === currentUser.uid || p.owner_id === currentUser.uid || p.ownerEmail === currentUser.email);
  const grid = document.getElementById('dashboard-places-grid');

  if (!grid) return;

  if (!userPlaces.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:48px 16px">
        <div class="empty-state__icon">🏪</div>
        <h3 class="empty-state__title">No places registered yet</h3>
        <p class="empty-state__text">You haven't added any places under this account yet.</p>
        <a href="https://wa.me/wasendernew?text=Hello%2C%20I%20would%20like%20to%20add%20my%20business%20to%20Dalil%20El%20Manzala" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="margin-top:1rem">
          Add Your Business Now &rarr;
        </a>
      </div>
    `;
    return;
  }

  grid.innerHTML = userPlaces.map(p => renderPlaceCard(p)).join('');
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Dalil El Manzala & El Matariya — English Contact Page
 * Dedicated native English contact & advertising renderer
 */

export async function renderEnglishContactPage($container) {
  document.title = 'Contact & Advertising | Dalil El Manzala & El Matariya';

  const urlParams = new URLSearchParams(window.location.search);
  const placeParam = urlParams.get('place') || urlParams.get('placeName') || '';
  const waVerifyText = encodeURIComponent(
    placeParam
      ? `Hello, I would like to request official verification for my business: "${placeParam}" on Dalil El Manzala.`
      : 'Hello, I would like to request official verification for my business on Dalil El Manzala.'
  );

  $container.innerHTML = `
    <style>
      .pillar-card--highlight {
        outline: 3px solid #F5A623 !important;
        box-shadow: 0 0 35px rgba(245, 166, 35, 0.5) !important;
        animation: pillarPulseEn 1.2s ease-in-out 3 !important;
      }
      @keyframes pillarPulseEn {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.025); }
      }
    </style>
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          Contact & Advertising
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Reach out to Dalil El Manzala & El Matariya directory team for listing inquiries, sponsored ads, and official verification.
        </p>
      </div>
    </div>

    <div class="container section" style="max-width:1050px">
      <!-- 3 Pricing Pillars -->
      <div class="section-title text-center" style="margin-bottom:24px">
        <h2 style="font-size:1.6rem;font-weight:900;color:var(--text-primary);margin-bottom:8px">Directory Services & Verification Pricing</h2>
        <p style="color:var(--text-muted);font-size:14px;max-width:600px;margin:0 auto">Transparent pricing for local business owners in El Manzala & El Matariya</p>
      </div>

      <section class="pillars-grid" id="pricing-plans" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:24px;margin-bottom:36px">
        <div class="card pillar-card pillar-card--sponsor" style="padding:24px;border:1px solid var(--border);border-radius:var(--radius-xl);background:var(--surface);display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="font-size:2rem;margin-bottom:12px">📢</div>
            <div style="font-weight:800;color:var(--primary);margin-bottom:8px">💰 100 EGP / Month</div>
            <h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">Sponsored Promotion</h3>
            <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:16px">Put your business at the forefront for thousands of local customers across the region.</p>
          </div>
          <a href="/wallet.html#packages" class="btn btn-primary" style="width:100%;justify-content:center;text-decoration:none">Start Advertising 📢</a>
        </div>

        <div class="card pillar-card pillar-card--verify" id="pillar-verify" style="padding:24px;border:2px solid #F5A623;border-radius:var(--radius-xl);background:var(--surface);display:flex;flex-direction:column;justify-content:space-between;position:relative">
          <div>
            <div style="font-size:2rem;margin-bottom:12px">🛡️</div>
            <div style="font-weight:800;color:#F5A623;margin-bottom:8px">💎 1,000 EGP / Lifetime</div>
            <h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">Official Profile Verification</h3>
            <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:16px">Permanent blue verified badge, top ranking priority, product listings, and trusted customer status.</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <a href="/wallet.html#packages" class="btn btn-primary" style="width:100%;justify-content:center;text-decoration:none">Request Verification 🛡️</a>
            <a href="/en/free-verification/" class="btn btn-outline" style="width:100%;justify-content:center;font-size:12px;border-color:#10B981;color:#10B981">🎁 Free Verification for Store Owners</a>
          </div>
        </div>

        <div class="card pillar-card pillar-card--showcase" style="padding:24px;border:1px solid var(--border);border-radius:var(--radius-xl);background:var(--surface);display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="font-size:2rem;margin-bottom:12px">🔥</div>
            <div style="font-weight:800;color:var(--primary);margin-bottom:8px">🛍️ Products & Deals</div>
            <h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">Showcase Products</h3>
            <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:16px">Display your menu, catalog, and promotions directly to local shoppers.</p>
          </div>
          <a href="/wallet.html#packages" class="btn btn-secondary" style="width:100%;justify-content:center;text-decoration:none">Showcase Products 🔥</a>
        </div>
      </section>

      <!-- Special Free Verification Green Banner -->
      <div class="card animate-fade-in" style="background:linear-gradient(135deg, #059669 0%, #10B981 100%);color:#fff;padding:24px;border-radius:var(--radius-xl);margin-bottom:32px;box-shadow:0 8px 24px rgba(16,185,129,0.3)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div>
            <span class="badge" style="background:rgba(255,255,255,0.25);color:#fff;font-weight:800;font-size:11px;padding:3px 10px;border-radius:9999px;margin-bottom:8px;display:inline-block">
              ✨ 100% Free Service
            </span>
            <h2 style="font-size:1.35rem;font-weight:900;margin:4px 0 8px">Free Official Verification for Shop & Business Owners</h2>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.9);max-width:560px;line-height:1.5">
              Get the blue verified badge on Dalil El Manzala by printing our directory notice flyer in your store. Submit your photo for review now.
            </p>
          </div>
          <a href="/en/free-verification/" class="btn" style="background:#fff;color:#059669;font-weight:800;padding:12px 24px;border-radius:var(--radius-lg);white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.15)">
            Claim Free Verification &rarr;
          </a>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:24px;margin-bottom:32px">
        <!-- Direct Phone & WhatsApp Card -->
        <div class="card" style="padding:24px">
          <div style="font-size:2rem;margin-bottom:12px">💬</div>
          <h3 style="font-size:1.2rem;font-weight:800;color:var(--primary);margin-bottom:8px">Customer Service & Support</h3>
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:16px">
            Available 24/7 via WhatsApp to answer questions, assist with directory listings, and receive feedback.
          </p>
          <a href="https://wa.me/wasendernew?text=Hello%2C%20I%20have%20an%20inquiry%20regarding%20Dalil%20El%20Manzala" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%;justify-content:center">
            Chat on WhatsApp
          </a>
        </div>

        <!-- Advertising Card -->
        <div class="card" style="padding:24px">
          <div style="font-size:2rem;margin-bottom:12px">📢</div>
          <h3 style="font-size:1.2rem;font-weight:800;color:var(--primary);margin-bottom:8px">Sponsored Ads & Banners</h3>
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:16px">
            Showcase your brand to over 50,000 monthly local visitors in El Manzala, El Matariya, and Dakahlia.
          </p>
          <a href="https://wa.me/wasendernew?text=Hello%2C%20I%20would%20like%20to%20advertise%20on%20Dalil%20El%20Manzala" target="_blank" rel="noopener" class="btn btn-secondary" style="width:100%;justify-content:center">
            Inquire About Advertising
          </a>
        </div>
      </div>

      <!-- Quick Contact Info -->
      <div class="card" style="padding:24px">
        <h3 style="font-size:1.15rem;font-weight:800;margin-bottom:16px">Directory Information</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;font-size:14px">
          <div>
            <strong>📍 Location:</strong>
            <p style="color:var(--text-secondary);margin:4px 0 0">El Manzala & El Matariya, Dakahlia Governorate, Egypt</p>
          </div>
          <div>
            <strong>✉️ Email:</strong>
            <p style="color:var(--text-secondary);margin:4px 0 0">support@dalilmanzala.com</p>
          </div>
          <div>
            <strong>⏱️ Working Hours:</strong>
            <p style="color:var(--text-secondary);margin:4px 0 0">Platform active 24 hours / 7 days</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Handle pricing scroll & highlight
  const isPricingTarget = window.location.hash === '#pricing' || window.location.hash === '#pricing-plans' || urlParams.get('topic') === 'verification' || urlParams.get('view') === 'pricing';
  if (isPricingTarget) {
    setTimeout(() => {
      const verifyCard = document.getElementById('pillar-verify') || document.getElementById('pricing-plans');
      verifyCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('pillar-verify')?.classList.add('pillar-card--highlight');
    }, 300);
  }
}

/**
 * Dalil El Manzala & El Matariya — English Contact Page
 * Dedicated native English contact & advertising renderer
 */

export async function renderEnglishContactPage($container) {
  document.title = 'Contact & Advertising | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          Contact & Advertise
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Reach out to Dalil El Manzala & El Matariya directory team for listing inquiries, sponsored ads, and free verification.
        </p>
      </div>
    </div>

    <div class="container section" style="max-width:900px">
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
}

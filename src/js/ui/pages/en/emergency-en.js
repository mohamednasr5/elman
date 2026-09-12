/**
 * Dalil El Manzala & El Matariya — English Emergency Page
 * Dedicated native English emergency & helpline numbers
 */

export async function renderEnglishEmergencyPage($container) {
  document.title = 'Emergency & Helpline Numbers | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          🚨 Emergency & Important Numbers
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Quick, one-tap access to vital emergency services, police, ambulance, and utility hotlines in Egypt.
        </p>
      </div>
    </div>

    <div class="container section" style="max-width:800px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px">
        <a class="card" href="tel:123" style="padding:20px;display:flex;align-items:center;justify-content:space-between;text-decoration:none;color:inherit;border-right:4px solid #EF4444">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:2rem">🚑</span>
            <div>
              <strong style="font-size:1.1rem;display:block">Ambulance</strong>
              <span style="font-size:13px;color:var(--text-secondary)">Emergency medical transport</span>
            </div>
          </div>
          <span class="badge" style="background:#FEE2E2;color:#991B1B;font-size:1.1rem;font-weight:800;padding:4px 12px;border-radius:9999px">123</span>
        </a>

        <a class="card" href="tel:122" style="padding:20px;display:flex;align-items:center;justify-content:space-between;text-decoration:none;color:inherit;border-right:4px solid #3B82F6">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:2rem">🚓</span>
            <div>
              <strong style="font-size:1.1rem;display:block">Police Emergency</strong>
              <span style="font-size:13px;color:var(--text-secondary)">Public safety & rescue</span>
            </div>
          </div>
          <span class="badge" style="background:#DBEAFE;color:#1E40AF;font-size:1.1rem;font-weight:800;padding:4px 12px;border-radius:9999px">122</span>
        </a>

        <a class="card" href="tel:180" style="padding:20px;display:flex;align-items:center;justify-content:space-between;text-decoration:none;color:inherit;border-right:4px solid #F59E0B">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:2rem">🚒</span>
            <div>
              <strong style="font-size:1.1rem;display:block">Fire & Civil Defense</strong>
              <span style="font-size:13px;color:var(--text-secondary)">Fire rescue & accidents</span>
            </div>
          </div>
          <span class="badge" style="background:#FEF3C7;color:#92400E;font-size:1.1rem;font-weight:800;padding:4px 12px;border-radius:9999px">180</span>
        </a>

        <a class="card" href="tel:121" style="padding:20px;display:flex;align-items:center;justify-content:space-between;text-decoration:none;color:inherit;border-right:4px solid #10B981">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:2rem">⚡</span>
            <div>
              <strong style="font-size:1.1rem;display:block">Electricity Emergency</strong>
              <span style="font-size:13px;color:var(--text-secondary)">Power outages & emergencies</span>
            </div>
          </div>
          <span class="badge" style="background:#DCFCE7;color:#166534;font-size:1.1rem;font-weight:800;padding:4px 12px;border-radius:9999px">121</span>
        </a>

        <a class="card" href="tel:129" style="padding:20px;display:flex;align-items:center;justify-content:space-between;text-decoration:none;color:inherit;border-right:4px solid #6366F1">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:2rem">🔥</span>
            <div>
              <strong style="font-size:1.1rem;display:block">Natural Gas Emergency</strong>
              <span style="font-size:13px;color:var(--text-secondary)">Gas leaks & safety</span>
            </div>
          </div>
          <span class="badge" style="background:#EEF2FF;color:#3730A3;font-size:1.1rem;font-weight:800;padding:4px 12px;border-radius:9999px">129</span>
        </a>

        <a class="card" href="tel:125" style="padding:20px;display:flex;align-items:center;justify-content:space-between;text-decoration:none;color:inherit;border-right:4px solid #06B6D4">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:2rem">💧</span>
            <div>
              <strong style="font-size:1.1rem;display:block">Water Authority</strong>
              <span style="font-size:13px;color:var(--text-secondary)">Water supply outages</span>
            </div>
          </div>
          <span class="badge" style="background:#CFFAFE;color:#155E75;font-size:1.1rem;font-weight:800;padding:4px 12px;border-radius:9999px">125</span>
        </a>
      </div>
    </div>
  `;
}

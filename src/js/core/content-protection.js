/**
 * دليل المنزلة والمطرية الرقمي — حماية المحتوى والملكية الفكرية
 * Content Protection & Intellectual Property Guard
 * Prevents right-click inspection, unauthorized copying, DevTools shortcuts,
 * and outputs an official copyright warning in the developer console.
 */

export function initContentProtection() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (window.__CONTENT_PROTECTION_INITIALIZED__) return;
  window.__CONTENT_PROTECTION_INITIALIZED__ = true;

  const currentYear = new Date().getFullYear();

  // ── 1. Authoritative Console Copyright Notice ──
  const printCopyrightNotice = () => {
    try {
      const headerStyle = [
        'color: #D97706',
        'font-size: 18px',
        'font-weight: 900',
        'font-family: system-ui, -apple-system, sans-serif',
        'padding: 8px 0',
        'text-shadow: 0 1px 2px rgba(0,0,0,0.15)'
      ].join(';');

      const bodyStyle = [
        'color: #0369A1',
        'font-size: 13.5px',
        'font-weight: 700',
        'line-height: 1.8',
        'font-family: system-ui, -apple-system, sans-serif',
        'padding: 10px 14px',
        'background: #F0F9FF',
        'border-right: 4px solid #0284C7',
        'border-radius: 6px',
        'margin: 6px 0'
      ].join(';');

      const contactStyle = [
        'color: #059669',
        'font-size: 13.5px',
        'font-weight: 800',
        'padding: 4px 0'
      ].join(';');

      const footerStyle = [
        'color: #64748B',
        'font-size: 12px',
        'font-weight: 600',
        'padding-top: 6px'
      ].join(';');

      console.log(
        `%c⚠️ إشعار بحقوق الملكية الفكرية\n\n` +
        `%cكل البيانات والمعلومات بالموقع ملك للدليل وأي نسخ أو نقل يعرض صاحبه إلى المسؤولية، ولابد من تصريح خطي مني المهندس محمد حماد.\n\n` +
        `%cللتواصل:\nwa.me/201279934735\n\n` +
        `%cجميع الحقوق محفوظة لعام ${currentYear} © دليل المنزلة والمطرية الرقمي`,
        headerStyle,
        bodyStyle,
        contactStyle,
        footerStyle
      );
    } catch (_) {}
  };

  printCopyrightNotice();

  // ── 2. Right-Click Context Menu Prevention ──
  // Prevents right-click inspection while allowing form elements to work normally
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) {
      return; // Allow standard form interactions
    }
    e.preventDefault();
    return false;
  }, { passive: false });

  // ── 3. Anti-Copy & Anti-Scraping Protection ──
  document.addEventListener('copy', (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) {
      return; // Allow users to copy their own input
    }
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData(
        'text/plain',
        `كل البيانات والمعلومات بالموقع ملك لدليل المنزلة والمطرية الرقمي. أي نسخ أو نقل يعرض صاحبه للمسؤولية، ولابد من تصريح خطي من المهندس محمد حماد (wa.me/201279934735). جميع الحقوق محفوظة لعام ${currentYear} ©`
      );
    }
  });

  // ── 4. Drag Protection on Images ──
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG' || e.target.closest('.place-card') || e.target.closest('.place-hero')) {
      e.preventDefault();
      return false;
    }
  }, { passive: false });

  // ── 5. DevTools & View Source Keyboard Shortcuts Blocking ──
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I / Cmd+Option+I (Inspect)
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    // Ctrl+Shift+C / Cmd+Option+C (Element picker)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
      e.preventDefault();
      return false;
    }

    // Ctrl+U / Cmd+Option+U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      return false;
    }

    // Ctrl+S / Cmd+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      return false;
    }
  }, { passive: false });
}
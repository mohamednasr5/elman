/**
 * المنزلة وناسها — Login Page
 */

import { signInWithGoogle } from '../../core/auth.js';
// navigate removed
import { toast } from '../components/Toast.js';

export async function renderLoginPage($container) {
  $container.innerHTML = `
    <div class="login-page">
      <div class="login-card animate-scale-in">
        <img src="./icons/icon-96x96.png" alt="شعار المنزلة وناسها" class="login-card__logo" />
        <h1 class="login-card__title">المنزلة وناسها</h1>
        <p class="login-card__subtitle">
          سجل دخولك مجاناً بحساب Google لإضافة محلك أو نشاطك التجاري والتحكم في عروضك ومنتجاتك
        </p>

        <button class="btn btn-google btn-lg btn-block" id="google-login-btn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>تسجيل الدخول باستخدام Google</span>
        </button>

        <div class="login-card__divider">
          <span>مميزات حساب صاحب النشاط</span>
        </div>

        <div style="text-align:right;font-size:var(--font-size-xs);color:var(--text-secondary);line-height:2">
          <div>✓ إضافة مكانك في دليل المنزلة الرقمي مجاناً</div>
          <div>✓ إضافة صور النشاط وساعات العمل وأرقام الهواتف والواتساب</div>
          <div>✓ نشر العروض اليومية والتخفيضات لأهل المنزلة</div>
          <div>✓ طلب علامة التوثيق الذهبية وإضافة كتالوج المنتجات</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('google-login-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('google-login-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const user = await signInWithGoogle();
      if (user) {
        toast.success(`أهلاً بك يا ${user.displayName || 'مستخدم'}`);
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/configuration-not-found') {
        toast.error('يرجى تفعيل موفر تسجيل الدخول Google في لوحة تحكم Firebase (Authentication -> Sign-in method -> Google)');
      } else if (err.code === 'auth/popup-blocked') {
        toast.error('تم حظر النافذة المنبثقة من المتصفح، يرجى السماح بالنوافذ المنبثقة.');
      } else {
        toast.error('حدث خطأ أثناء تسجيل الدخول: ' + (err.message || 'حاول مجدداً'));
      }
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

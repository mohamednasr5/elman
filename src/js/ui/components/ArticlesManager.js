import { getPlacesByOwner } from '../../core/db.js';
import { getArticles, generateArticle, saveArticle, updateArticle, deleteArticle, uploadArticleCover } from '../../services/articles.service.js';
import { getStoredCoinsBalance, setStoredCoinsBalance, fetchLiveCoinsBalance } from '../../core/coins-sync.js';
import { toast } from './Toast.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function injectStyles() {
  if (document.getElementById('article-manager-styles')) return;
  const s = document.createElement('style');
  s.id = 'article-manager-styles';
  s.textContent = `
    .article-manager { display: grid; gap: 24px; }
    .article-manager__head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; border-bottom: 1px solid var(--border, #e2e8f0); padding-bottom: 18px; }
    .article-manager__header-text h1 { margin: 0 0 6px; font-size: 1.5rem; font-weight: 900; color: #0f172a; }
    .article-manager__header-text p { margin: 0; color: #64748b; font-size: 0.9rem; line-height: 1.6; }
    .article-manager__coins-badge { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1.5px solid #f59e0b; border-radius: 16px; padding: 10px 16px; box-shadow: 0 2px 10px rgba(245,158,11,.1); }

    .article-editor-layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(300px, 1fr); gap: 24px; align-items: start; }
    @media (max-width: 960px) { .article-editor-layout { grid-template-columns: 1fr; } }

    .article-card-panel { background: #fff; border: 1px solid var(--border, #e2e8f0); border-radius: 20px; padding: 22px; box-shadow: 0 4px 20px rgba(15,23,42,.04); }
    .article-card-panel h2 { margin: 0 0 14px; font-size: 1.15rem; font-weight: 900; color: #0f172a; }

    .article-form-group { display: grid; gap: 8px; margin-bottom: 18px; }
    .article-form-group label { font-weight: 800; font-size: 13.5px; color: #1e293b; display: flex; justify-content: space-between; align-items: center; }
    .article-form-group input, .article-form-group select, .article-form-group textarea {
      width: 100%; box-sizing: border-box; border: 1.5px solid #cbd5e1; border-radius: 14px;
      padding: 12px 14px; font: inherit; background: #fff; color: #0f172a; transition: border-color .2s, box-shadow .2s;
    }
    .article-form-group input:focus, .article-form-group select:focus, .article-form-group textarea:focus {
      outline: none; border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,.15);
    }
    .article-form-group textarea { min-height: 160px; line-height: 1.85; resize: vertical; }

    .article-chips-wrap { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    .article-chip { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 999px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all .2s; }
    .article-chip:hover { background: #e2e8f0; color: #0f172a; border-color: #94a3b8; }

    .article-ai-cta-box { background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%); border: 1.5px dashed #0f766e44; border-radius: 16px; padding: 16px; margin-bottom: 20px; }
    .article-ai-cta-btn {
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #fff; border: none;
      padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px; width: 100%; justify-content: center; box-shadow: 0 4px 14px rgba(15,118,110,.25); transition: opacity .2s, transform .1s;
    }
    .article-ai-cta-btn:hover { opacity: 0.95; }
    .article-ai-cta-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .article-counter-badge { font-size: 12px; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
    .article-counter--good { background: #dcfce7; color: #166534; }
    .article-counter--short { background: #fef3c7; color: #92400e; }
    .article-counter--long { background: #fee2e2; color: #991b1b; }

    .article-upload-zone { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 18px; text-align: center; background: #f8fafc; cursor: pointer; transition: all .2s; }
    .article-upload-zone:hover { border-color: #0f766e; background: #f0fdfa; }
    .article-upload-zone input[type="file"] { display: none; }
    .article-preview-container { margin-top: 12px; position: relative; border-radius: 14px; overflow: hidden; aspect-ratio: 16/9; background: #0f172a; }
    .article-preview-container img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .article-preview-remove { position: absolute; top: 10px; left: 10px; background: rgba(15,23,42,.75); color: #fff; border: none; border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 800; cursor: pointer; backdrop-filter: blur(4px); }

    .article-actions-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 22px; padding-top: 18px; border-top: 1px solid #f1f5f9; }

    .article-item-card { border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #fff; margin-bottom: 14px; box-shadow: 0 2px 10px rgba(0,0,0,.03); transition: transform .2s; }
    .article-item-card:hover { transform: translateY(-2px); }
    .article-item-thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #edf2f7; }
    .article-item-thumb--placeholder { display: grid; place-items: center; font-size: 32px; height: 100%; background: #f1f5f9; color: #94a3b8; }
    .article-item-body { padding: 14px; }
    .article-item-title { margin: 0 0 6px; font-size: 14px; font-weight: 800; line-height: 1.5; color: #0f172a; }
    .article-item-desc { margin: 0 0 10px; font-size: 12px; color: #64748b; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .article-item-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 11.5px; color: #64748b; margin-bottom: 10px; }
    .article-status-pill { padding: 3px 8px; border-radius: 999px; font-weight: 800; font-size: 11px; }
    .article-status--published { background: #dcfce7; color: #166534; }
    .article-status--draft { background: #fef3c7; color: #92400e; }
    .article-item-btns { display: flex; gap: 6px; flex-wrap: wrap; }
    .article-item-btns a, .article-item-btns button { padding: 6px 11px; border-radius: 8px; font-size: 12px; font-weight: 800; text-decoration: none; cursor: pointer; }
  `;
  document.head.appendChild(s);
}

// Client-side automatic 16:9 center crop and WebP compression
function processArticleImage(file, targetWidth = 1200, targetHeight = 675) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('الملف المختار ليس صورة صالحة'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذر معالجة بيانات الصورة'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas غير مدعوم في المتصفح'));

          const srcRatio = img.width / img.height;
          const targetRatio = targetWidth / targetHeight;
          let sw, sh, sx, sy;

          if (srcRatio > targetRatio) {
            sh = img.height;
            sw = img.height * targetRatio;
            sx = (img.width - sw) / 2;
            sy = 0;
          } else {
            sw = img.width;
            sh = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sh) / 2;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const cleanName = String(file.name || 'article').replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '-');
                const processedFile = new File([blob], `${cleanName}-16x9.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                resolve({
                  file: processedFile,
                  previewUrl: URL.createObjectURL(blob),
                  sizeKb: Math.round(blob.size / 1024)
                });
              } else {
                reject(new Error('فشل ضغط الصورة'));
              }
            },
            'image/webp',
            0.82
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function renderArticlesManager(container, user) {
  injectStyles();
  let places = [];
  let currentPlaceId = '';
  let articles = [];
  let editingArticle = null;
  let stagedImageFile = null;
  let stagedPreviewUrl = '';

  container.innerHTML = `
    <div class="article-manager">
      <div class="article-manager__head">
        <div class="article-manager__header-text">
          <h1>📝 المدونة ومقالات الأماكن</h1>
          <p>اكتب مقالات حصرية عن نشاطك التجاري تدعم محركات البحث الذكية (AI Search & GEO)، واربطها بصفحة المكان لزيادة الزيارات والاتصالات.</p>
        </div>
        <div class="article-manager__coins-badge" id="article-coins-box">
          <div style="font-size:24px">🪙</div>
          <div>
            <div style="font-size:11.5px;font-weight:700;color:#92400e">رصيد محفظتك</div>
            <div style="font-size:15px;font-weight:900;color:#78350f"><span id="article-user-coins-val" class="live-coins-val">${Number(getStoredCoinsBalance()).toLocaleString('ar-EG')}</span> ذهبية</div>
          </div>
          <a href="/wallet.html" style="background:#f59e0b;color:#fff;font-size:12px;font-weight:800;padding:6px 12px;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;gap:4px">شحن ⚡</a>
        </div>
      </div>
      <div id="article-manager-body">
        <div style="padding:40px;text-align:center;color:#64748b">⏳ جاري تحميل الأنشطة والمقالات...</div>
      </div>
    </div>
  `;

  // Live coins balance sync for this component
  fetchLiveCoinsBalance().catch(() => {});

  const bodyEl = container.querySelector('#article-manager-body');

  try {
    places = await getPlacesByOwner(user) || [];
  } catch (_) {
    places = [];
  }

  if (!places.length) {
    bodyEl.innerHTML = `
      <div class="empty-state" style="padding:48px 20px;text-align:center;background:#fff;border-radius:20px;border:1px solid #e2e8f0">
        <div style="font-size:48px;margin-bottom:12px">🏪</div>
        <h2 style="margin:0 0 8px;font-size:1.25rem;font-weight:900">لا توجد أماكن مسجلة باسمك بعد</h2>
        <p style="margin:0 0 20px;color:#64748b;font-size:0.95rem">أضف نشاطك التجاري أولاً لتتمكن من كتابة ونشر مقالات حصرية مرتبطة بصفحته.</p>
        <a href="dashboard.html?section=add" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px">➕ أضف مكانك الآن</a>
      </div>
    `;
    return;
  }

  // Preselect from URL if place_id query param exists
  const urlParams = new URLSearchParams(window.location.search);
  const requestedPlaceId = urlParams.get('place_id') || urlParams.get('placeId') || '';
  const matchedPlace = places.find(p => String(p.id || p._key) === String(requestedPlaceId));
  currentPlaceId = matchedPlace ? (matchedPlace.id || matchedPlace._key) : (places[0].id || places[0]._key);

  async function loadArticles() {
    try {
      articles = await getArticles({ placeId: currentPlaceId, limit: 50 }) || [];
    } catch (_) {
      articles = [];
    }
    renderUI();
  }

  function renderUI() {
    const selectedPlace = places.find(p => String(p.id || p._key) === String(currentPlaceId)) || places[0];
    const isAlreadyPublished = editingArticle && editingArticle.status === 'published';
    const publishBtnText = isAlreadyPublished
      ? '💾 حفظ التعديلات (مجاناً)'
      : '🚀 نشر المقال وتثبيته في صفحة المكان (200 ذهبية)';
    const draftBtnText = editingArticle ? '💾 حفظ كمسودة' : '💾 حفظ كمسودة (مجاناً)';

    bodyEl.innerHTML = `
      <div class="article-editor-layout">
        <!-- Main Writing & AI Editor Panel -->
        <section class="article-card-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
            <h2 style="margin:0">${editingArticle ? '✏️ تعديل المقال' : '✍️ كتابة مقال جديد'}</h2>
            ${editingArticle ? '<button type="button" class="btn btn-sm btn-outline" id="btn-cancel-edit">✕ إلغاء التعديل</button>' : ''}
          </div>

          <div class="article-form-group">
            <label for="art-place-select">اختر النشاط التجاري المرتبط بالمقال</label>
            <select id="art-place-select" ${editingArticle ? 'disabled' : ''}>
              ${places.map(p => {
                const id = p.id || p._key;
                return `<option value="${esc(id)}" ${String(id) === String(currentPlaceId) ? 'selected' : ''}>${esc(p.name || 'نشاط')} (${esc(p.area || 'المنزلة')})</option>`;
              }).join('')}
            </select>
          </div>

          <!-- AI Generation Assistant Box -->
          <div class="article-ai-cta-box">
            <div class="article-form-group" style="margin-bottom:10px">
              <label for="art-topic-input">
                <span>عن ماذا تريد أن يتحدث المقال؟ ✨</span>
                <span style="font-size:11.5px;color:#0f766e;font-weight:normal">اكتب فكرتك وسيتولى الذكاء الاصطناعي صياغة مقال 550 كلمة متكامل</span>
              </label>
              <textarea id="art-topic-input" style="min-height:85px" placeholder="مثال: خصومات العيد، أشهى الوجبات العائلية، سرعة التوصيل لجميع مناطق المنزلة والمطرية، أو نصائح لاختيار أفضل المنتجات..."></textarea>
              
              <div class="article-chips-wrap">
                <span class="article-chip" data-chip="جودة خدماتنا وتاريخ خبرتنا في المنزلة">💡 خدماتنا وجودة العمل</span>
                <span class="article-chip" data-chip="أقوى العروض والتخفيضات الحالية للعملاء">🔥 العروض والخصومات</span>
                <span class="article-chip" data-chip="خدمة التوصيل السريع والدليفري للمنازل">🚚 خدمة التوصيل السريع</span>
                <span class="article-chip" data-chip="نصائح عملية وإرشادات تهم عملاءنا">⭐ نصائح للعملاء</span>
                <span class="article-chip" data-chip="أحدث المنتجات والأصناف التي وصلت حديثاً">🆕 أحدث المنتجات</span>
              </div>
            </div>

            <button type="button" class="article-ai-cta-btn" id="btn-generate-ai">
              <span>✨</span>
              <span>توليد المقال بالذكاء الاصطناعي (مقال احترافي ~550 كلمة + رابط إنجليزي + سيو 100%)</span>
            </button>
          </div>

          <!-- Form Fields -->
          <div class="article-form-group">
            <label for="art-title-input">عنوان المقال (جذاب ومتوافق مع السيو)</label>
            <input type="text" id="art-title-input" maxlength="180" placeholder="مثال: أفضل عروض وخدمات مطعم الباشا في مدينة المنزلة" value="${esc(editingArticle?.title || '')}">
          </div>

          <div class="article-form-group">
            <label for="art-slug-input">
              <span>رابط المقال بالإنجليزية (URL Slug)</span>
              <span style="font-size:11.5px;color:#0f766e;font-weight:normal">مختصر بالإنجليزية فقط لسهولة المشاركة والسيو</span>
            </label>
            <div style="display:flex;align-items:center;direction:ltr;background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:14px;padding:0 12px;overflow:hidden">
              <span style="color:#64748b;font-size:12.5px;font-family:monospace;white-space:nowrap">dalilmanzala.com/article/</span>
              <input type="text" id="art-slug-input" style="border:none;background:transparent;padding:12px 6px;font-family:monospace;font-size:13px;color:#0f172a;flex:1;outline:none" placeholder="al-hassan-phone-repair-offers" value="${esc(editingArticle?.slug || '')}">
            </div>
          </div>

          <div class="article-form-group">
            <label for="art-content-input">
              <span>محتوى المقال (مكتوب بأسلوب بشري جذاب ومتوافق مع السيو)</span>
              <span id="art-char-badge" class="article-counter-badge article-counter--short">0 كلمة</span>
            </label>
            <textarea id="art-content-input" placeholder="اكتب المقال هنا أو دعه يُولّد تلقائياً من الزر أعلاه...">${esc(editingArticle?.content || '')}</textarea>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#64748b">
              <span>المعيار الذهبي للسيو والذكاء الاصطناعي: حوالي 550 كلمة مقسمة بعناوين فرعية H2 و H3 وفقرة أسئلة شائعة وخاتمة</span>
              <span id="art-words-count">0 حرف</span>
            </div>
          </div>

          <div class="article-form-group">
            <label for="art-keywords-input">الكلمات المفتاحية لمساعدات البحث وجوجل (SEO / GEO)</label>
            <input type="text" id="art-keywords-input" placeholder="افصل بين الكلمات بفواصل، مثال: المنزلة، مطاعم، دليفري، حواوشي" value="${esc((editingArticle?.keywords || []).join(', '))}">
          </div>

          <!-- Uniform 16:9 Image Uploader -->
          <div class="article-form-group">
            <label>صورة الغلاف للمقال (مقاس موحد 16:9 بدقة 1200×675 مضغوطة WebP)</label>
            <div class="article-upload-zone" id="art-upload-zone">
              <input type="file" id="art-file-input" accept="image/jpeg,image/png,image/webp">
              <div style="font-size:32px;margin-bottom:6px">📷</div>
              <div style="font-weight:800;font-size:13.5px;color:#0f172a">انقر هنا أو اسحب الصورة لاقتصاصها بمقاس 16:9 القياسي</div>
              <div style="font-size:11.5px;color:#64748b;margin-top:4px">سيتم ضغطها تلقائياً بتقنية WebP لتفتح فوراً للزوار بأعلى سرعة</div>
            </div>

            <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <button type="button" class="btn btn-sm btn-outline" id="btn-use-place-cover" style="background:#f0fdfa;color:#0f766e;border-color:#99f6e4;font-weight:800;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px">
                <span>🖼️</span>
                <span>استخدام نفس صورة غلاف المكان للغلاف</span>
              </button>
              <span style="font-size:11.5px;color:#64748b">أو اختر صورة جديدة من جهازك عبر المربع أعلاه</span>
            </div>

            <div class="article-preview-container" id="art-preview-wrap" style="${(stagedPreviewUrl || editingArticle?.coverImageUrl) ? '' : 'display:none'}">
              <img id="art-preview-img" src="${esc(stagedPreviewUrl || editingArticle?.coverImageUrl || '')}" alt="معاينة غلاف المقال">
              <button type="button" class="article-preview-remove" id="btn-remove-cover">🗑️ إزالة الصورة</button>
            </div>
            <div id="art-image-status" style="font-size:11.5px;color:#047857;margin-top:6px;font-weight:700"></div>
          </div>

          <div class="article-actions-row">
            <button type="button" class="btn btn-outline" id="btn-save-draft" style="flex:1">${draftBtnText}</button>
            <button type="button" class="btn btn-primary" id="btn-publish-article" style="flex:2">${publishBtnText}</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:12px;color:#475569;line-height:1.6">
            <span>⚡</span>
            <span>نشر المقال لأول مرة يتطلب <b>200 عملة ذهبية</b> تُخصم من محفظتك. التعديلات اللاحقة على المقال المنشور <b>مجانية تماماً</b>. حفظ المسودات مجاني.</span>
          </div>
        </section>

        <!-- Sidebar: Existing Articles for this place -->
        <aside class="article-card-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <h2 style="margin:0">مقالات النشاط (${articles.length})</h2>
            <span style="font-size:12px;color:#0f766e;font-weight:800">${esc(selectedPlace.name || 'المكان')}</span>
          </div>

          ${!articles.length ? `
            <div style="text-align:center;padding:32px 14px;background:#f8fafc;border-radius:14px;border:1px dashed #cbd5e1;color:#64748b">
              <div style="font-size:36px;margin-bottom:8px">📝</div>
              <div style="font-weight:800;font-size:13px;color:#0f172a">لا توجد مقالات لهذا النشاط بعد</div>
              <p style="margin:6px 0 0;font-size:12px;line-height:1.6">المقالات تصنع روابط داخلية (Backlinks) قوية ترفع ترتيب صفحتك في جوجل والدليل.</p>
            </div>
          ` : `
            <div class="article-items-list">
              ${articles.map(a => {
                const isPub = a.status === 'published';
                const href = `/article/${encodeURIComponent(a.slug || '')}/`;
                return `
                  <article class="article-item-card">
                    ${a.coverImageUrl ? `
                      <img src="${esc(a.coverImageUrl)}" class="article-item-thumb" alt="${esc(a.title)}" loading="lazy">
                    ` : `
                      <div class="article-item-thumb article-item-thumb--placeholder">📝</div>
                    `}
                    <div class="article-item-body">
                      <div class="article-item-meta">
                        <span class="article-status-pill ${isPub ? 'article-status--published' : 'article-status--draft'}">
                          ${isPub ? '✓ منشور' : '⏳ مسودة'}
                        </span>
                        <span>${new Date(a.updatedAt || a.createdAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <h3 class="article-item-title">${esc(a.title)}</h3>
                      <p class="article-item-desc">${esc(a.excerpt || a.content || '')}</p>
                      <div class="article-item-btns">
                        <a href="${esc(href)}" target="_blank" class="btn btn-xs btn-outline" style="background:#f0fdfa;color:#0f766e;border-color:#99f6e4">عرض ↗</a>
                        <button type="button" class="btn btn-xs btn-outline" data-action="edit" data-id="${esc(a.id)}">تعديل ✏️</button>
                        <button type="button" class="btn btn-xs btn-outline" data-action="delete" data-id="${esc(a.id)}" style="color:#b91c1c">حذف 🗑️</button>
                      </div>
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          `}
        </aside>
      </div>
    `;

    // ── Setup Event Listeners ──

    // Place Switcher
    const placeSelect = bodyEl.querySelector('#art-place-select');
    if (placeSelect) {
      placeSelect.addEventListener('change', (e) => {
        currentPlaceId = e.target.value;
        editingArticle = null;
        stagedImageFile = null;
        stagedPreviewUrl = '';
        loadArticles();
      });
    }

    // Interactive Prompt Chips
    bodyEl.querySelectorAll('.article-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = bodyEl.querySelector('#art-topic-input');
        if (input) {
          const textVal = chip.dataset.chip || '';
          input.value = input.value ? `${input.value}، مع التركيز على ${textVal}` : textVal;
          input.focus();
        }
      });
    });

    // Content Character and Word Counter
    const contentInput = bodyEl.querySelector('#art-content-input');
    const charBadge = bodyEl.querySelector('#art-char-badge');
    const wordsCount = bodyEl.querySelector('#art-words-count');

    function updateCounters() {
      const val = contentInput.value || '';
      const len = val.length;
      const words = val.trim() ? val.trim().split(/\s+/).length : 0;
      if (wordsCount) wordsCount.textContent = `${len} حرف`;

      if (charBadge) {
        charBadge.className = 'article-counter-badge';
        if (words >= 480 && words <= 650) {
          charBadge.classList.add('article-counter--good');
          charBadge.textContent = `${words} كلمة — طول مثالي ومطابق لمعيار 550 كلمة ✅`;
        } else if (words < 480) {
          charBadge.classList.add('article-counter--short');
          charBadge.textContent = `${words} كلمة (الموصى به ~550 كلمة)`;
        } else {
          charBadge.classList.add('article-counter--long');
          charBadge.textContent = `${words} كلمة (مقال مفصل وممتاز)`;
        }
      }
    }
    contentInput.addEventListener('input', updateCounters);
    updateCounters();

    // AI Generation Trigger
    const btnGenAi = bodyEl.querySelector('#btn-generate-ai');
    btnGenAi.addEventListener('click', async () => {
      const topicVal = bodyEl.querySelector('#art-topic-input').value.trim();
      if (!topicVal) {
        toast.info?.('اكتب فكرة أو موضوع المقال أولاً في المربع أعلاه 💡');
        bodyEl.querySelector('#art-topic-input').focus();
        return;
      }

      btnGenAi.disabled = true;
      btnGenAi.innerHTML = '<span>⏳</span> <span>جاري صياغة مقال 550 كلمة متوافق 100% مع معايير السيو والذكاء الاصطناعي...</span>';

      try {
        const titleVal = bodyEl.querySelector('#art-title-input').value.trim();
        const kwVal = bodyEl.querySelector('#art-keywords-input').value.split(',').map(s => s.trim()).filter(Boolean);

        const draft = await generateArticle({
          placeId: currentPlaceId,
          topic: topicVal,
          title: titleVal,
          keywords: kwVal
        });

        if (draft) {
          if (draft.title) bodyEl.querySelector('#art-title-input').value = draft.title;
          if (draft.slug) {
            const slugInp = bodyEl.querySelector('#art-slug-input');
            if (slugInp) slugInp.value = draft.slug;
          }
          if (draft.content) bodyEl.querySelector('#art-content-input').value = draft.content;
          if (Array.isArray(draft.keywords) && draft.keywords.length) {
            bodyEl.querySelector('#art-keywords-input').value = draft.keywords.join(', ');
          }
          updateCounters();
          toast.success?.('تم توليد المقال بنجاح! راجع النص ورابط السيو وأضف صورة ثم انقر على نشر 🚀');
        }
      } catch (err) {
        toast.error?.(err?.message || 'تعذر توليد المقال حالياً، يرجى المحاولة مرة أخرى');
      } finally {
        btnGenAi.disabled = false;
        btnGenAi.innerHTML = '<span>✨</span> <span>توليد المقال بالذكاء الاصطناعي (مقال احترافي ~550 كلمة + رابط إنجليزي + سيو 100%)</span>';
      }
    });

    // Image Upload with Canvas 16:9 Processing
    const uploadZone = bodyEl.querySelector('#art-upload-zone');
    const fileInput = bodyEl.querySelector('#art-file-input');
    const previewWrap = bodyEl.querySelector('#art-preview-wrap');
    const previewImg = bodyEl.querySelector('#art-preview-img');
    const removeCoverBtn = bodyEl.querySelector('#btn-remove-cover');
    const imageStatus = bodyEl.querySelector('#art-image-status');

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        imageStatus.textContent = '⏳ جاري قص الصورة بنسبة 16:9 وضغطها WebP...';
        const processed = await processArticleImage(file, 1200, 675);
        stagedImageFile = processed.file;
        stagedPreviewUrl = processed.previewUrl;

        previewImg.src = stagedPreviewUrl;
        previewWrap.style.display = 'block';
        imageStatus.textContent = `✅ تم ضبط الصورة بمقاس 16:9 قياسي وخفيف جداً (${processed.sizeKb} ك.ب)`;
      } catch (err) {
        toast.error?.(err?.message || 'تعذر معالجة الصورة');
        imageStatus.textContent = '';
      }
    });

    removeCoverBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stagedImageFile = null;
      stagedPreviewUrl = '';
      fileInput.value = '';
      if (editingArticle) editingArticle.coverImageUrl = '';
      previewWrap.style.display = 'none';
      imageStatus.textContent = '';
    });

    // Use place cover button
    const btnUsePlaceCover = bodyEl.querySelector('#btn-use-place-cover');
    if (btnUsePlaceCover) {
      btnUsePlaceCover.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentPlace = places.find(p => String(p.id || p._key) === String(currentPlaceId)) || places[0];
        const placeCover = currentPlace?.coverImageUrl || currentPlace?.cover_image_url || currentPlace?.cover || currentPlace?.categoryCover || '';

        if (!placeCover) {
          toast.info?.('النشاط التجاري المختار ليس له صورة غلاف مسجلة بعد. يرجى رفع صورة مخصصة للمقال.');
          return;
        }

        stagedImageFile = null;
        stagedPreviewUrl = placeCover;
        fileInput.value = '';
        if (editingArticle) editingArticle.coverImageUrl = placeCover;

        previewImg.src = placeCover;
        previewWrap.style.display = 'block';
        imageStatus.textContent = '✅ تم اختيار صورة غلاف المكان كغلاف للمقال بنجاح';
        toast.success?.('تم استخدام صورة غلاف المكان كغلاف للمقال بنجاح 🖼️');
      });
    }

    // Cancel Edit
    const cancelEditBtn = bodyEl.querySelector('#btn-cancel-edit');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        editingArticle = null;
        stagedImageFile = null;
        stagedPreviewUrl = '';
        renderUI();
      });
    }

    // Save Article Handler (Draft or Publish)
    async function handleSave(isDraft) {
      const title = bodyEl.querySelector('#art-title-input').value.trim();
      const content = bodyEl.querySelector('#art-content-input').value.trim();
      const keywords = bodyEl.querySelector('#art-keywords-input').value.split(',').map(s => s.trim()).filter(Boolean);

      if (!title || title.length < 5) {
        toast.error?.('يرجى كتابة عنوان مناسب للمقال (5 أحرف على الأقل)');
        bodyEl.querySelector('#art-title-input').focus();
        return;
      }
      if (!content || content.length < 80) {
        toast.error?.('يرجى كتابة محتوى المقال أو توليده بالذكاء الاصطناعي');
        bodyEl.querySelector('#art-content-input').focus();
        return;
      }

      const isAlreadyPublished = editingArticle && editingArticle.status === 'published';
      const isPublishingNew = !isDraft && !isAlreadyPublished;

      if (isPublishingNew) {
        const currentBalance = getStoredCoinsBalance();
        const isSuperAdmin = user?.role === 'superadmin' || user?.isAdmin;
        if (!isSuperAdmin && currentBalance < 200) {
          toast.error?.(`رصيدك الحالي (${currentBalance} ذهبية) غير كافٍ لنشر المقال. تكلفة النشر 200 ذهبية.`);
          if (confirm(`رصيدك الحالي (${currentBalance} ذهبية) غير كافٍ لنشر المقال.\n\nتكلفة نشر المقال هي 200 ذهبية.\nهل ترغب بالانتقال لشحن محفظتك الآن؟`)) {
            window.location.href = '/wallet.html';
          }
          return;
        }
      }

      const saveBtn = isDraft ? bodyEl.querySelector('#btn-save-draft') : bodyEl.querySelector('#btn-publish-article');
      const originalText = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '⏳ جاري الحفظ والمعالجة...';

      let coverUrl = stagedPreviewUrl || editingArticle?.coverImageUrl || '';

      // Upload staged image if changed
      if (stagedImageFile) {
        try {
          coverUrl = await uploadArticleCover(stagedImageFile, title);
        } catch (imgErr) {
          console.warn('[Article cover upload warning]:', imgErr);
        }
      }

      const slug = bodyEl.querySelector('#art-slug-input')?.value.trim() || undefined;

      const payload = {
        id: editingArticle?.id,
        placeId: currentPlaceId,
        slug,
        title,
        content,
        excerpt: content.slice(0, 180),
        keywords,
        coverImageUrl: coverUrl,
        ai_generated: true
      };

      try {
        let res;
        if (editingArticle) {
          res = await updateArticle(editingArticle.id, payload, { draft: isDraft });
          if (typeof res?.newBalance === 'number') {
            setStoredCoinsBalance(res.newBalance);
          } else {
            fetchLiveCoinsBalance().catch(() => {});
          }
          toast.success?.(isDraft ? 'تم حفظ تعديلات المسودة بنجاح' : (isAlreadyPublished ? 'تم حفظ التعديلات بنجاح مجاناً 🚀' : 'تم نشر المقال بنجاح وخصم 200 ذهبية 🚀'));
        } else {
          res = await saveArticle(payload, { draft: isDraft });
          if (typeof res?.newBalance === 'number') {
            setStoredCoinsBalance(res.newBalance);
          } else {
            fetchLiveCoinsBalance().catch(() => {});
          }
          toast.success?.(isDraft ? 'تم حفظ المقال كمسودة' : 'تم نشر المقال بنجاح وتثبيته في صفحة المكان وخصم 200 ذهبية 🚀');
        }

        const savedSlug = res?.data?.slug;
        editingArticle = null;
        stagedImageFile = null;
        stagedPreviewUrl = '';
        await loadArticles();
        window.scrollTo({ top: Math.max(0, container.offsetTop - 40), behavior: 'smooth' });
      } catch (saveErr) {
        toast.error?.(saveErr?.message || 'تعذر حفظ المقال، يرجى المحاولة مرة أخرى');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    }

    bodyEl.querySelector('#btn-save-draft').addEventListener('click', () => handleSave(true));
    bodyEl.querySelector('#btn-publish-article').addEventListener('click', () => handleSave(false));

    // Edit and Delete buttons in sidebar
    bodyEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        editingArticle = articles.find(a => String(a.id) === String(id)) || null;
        stagedImageFile = null;
        stagedPreviewUrl = '';
        renderUI();
        window.scrollTo({ top: container.offsetTop - 40, behavior: 'smooth' });
      });
    });

    bodyEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const target = articles.find(a => String(a.id) === String(id));
        if (!confirm(`هل أنت متأكد من حذف مقال «${target?.title || 'المقال'}» نهائياً؟`)) return;

        try {
          await deleteArticle(id);
          toast.success?.('تم حذف المقال بنجاح');
          if (editingArticle && String(editingArticle.id) === String(id)) {
            editingArticle = null;
          }
          await loadArticles();
        } catch (delErr) {
          toast.error?.(delErr?.message || 'تعذر حذف المقال');
        }
      });
    });
  }

  await loadArticles();
}
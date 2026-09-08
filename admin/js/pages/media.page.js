/**
 * المنزلة وناسها — Admin R2 Media Manager Page
 * Manages Cloudflare R2 files securely through Worker /api/admin/media.
 */

import { AdminService } from '../services/admin.service.js';
import { confirmModal, showModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderMediaPage(container) {
  let currentPrefix = '';

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">مكتبة الوسائط R2</h1>
        <p class="admin-page-desc">تصفح ورفع وإدارة الصور والملفات المخزنة على Cloudflare R2 Storage</p>
      </div>
      <div class="admin-page-actions">
        ${can('media.upload') ? `
          <label class="btn btn-primary btn-upload-media">
            <span>⬆ رفع ملف جديد</span>
            <input type="file" id="media-file-input" accept="image/*" style="display:none;"/>
          </label>
        ` : ''}
      </div>
    </div>

    <!-- Storage Bucket Status Banner -->
    <div class="media-folder-bar admin-card mb-3">
      <div class="folder-breadcrumbs">
        <button type="button" class="btn-folder-crumb" data-prefix="">المجلد الرئيسي (Root)</button>
        <span id="crumb-subfolder"></span>
      </div>
      <div class="folder-search">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-media">↻ تحديث الملفات</button>
      </div>
    </div>

    <!-- Media Grid -->
    <div class="admin-card">
      <div class="admin-card-body" id="media-grid-container">
        <div class="spinner"></div>
      </div>
    </div>
  `;

  const gridContainer = container.querySelector('#media-grid-container');
  const refreshBtn = container.querySelector('#btn-refresh-media');
  const fileInput = container.querySelector('#media-file-input');
  const rootCrumb = container.querySelector('.btn-folder-crumb');

  rootCrumb.addEventListener('click', () => {
    currentPrefix = '';
    container.querySelector('#crumb-subfolder').innerHTML = '';
    loadMedia(gridContainer, currentPrefix);
  });

  refreshBtn.addEventListener('click', () => loadMedia(gridContainer, currentPrefix));

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      toast.info(`جاري رفع "${file.name}" إلى مخزن R2...`);
      try {
        await AdminService.uploadMedia(file, currentPrefix || 'uploads');
        toast.success(`تم رفع "${file.name}" بنجاح`);
        fileInput.value = '';
        loadMedia(gridContainer, currentPrefix);
      } catch (err) {
        toast.error(err.message || 'فشل رفع الملف');
      }
    });
  }

  await loadMedia(gridContainer, currentPrefix);
}

async function loadMedia(container, prefix = '') {
  container.innerHTML = `
    <div style="padding:2rem;text-align:center;">
      <div class="spinner"></div>
      <p class="mt-2 text-muted">جاري فحص محتويات مخزن R2...</p>
    </div>
  `;

  try {
    const res = await AdminService.getMediaList({ prefix, limit: 100 });
    const files = res.data || [];
    const prefixes = res.prefixes || [];

    if (files.length === 0 && prefixes.length === 0) {
      container.innerHTML = `
        <div class="dt-empty-content">
          <span class="dt-empty-icon">📁</span>
          <p>لا توجد ملفات في هذا المسار</p>
        </div>
      `;
      return;
    }

    let html = '<div class="media-grid">';

    // Render Folders
    prefixes.forEach(p => {
      const folderName = p.replace(prefix, '').replace(/\/$/, '');
      html += `
        <div class="media-item media-folder-item" data-folder="${escapeAttr(p)}">
          <div class="folder-icon">📁</div>
          <span class="folder-name">${escapeHtml(folderName)}/</span>
        </div>
      `;
    });

    // Render Files
    files.forEach(f => {
      const isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.key);
      const sizeStr = formatBytes(f.size);
      const url = f.url || `https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/${f.key}`;
      const fileName = f.key.split('/').pop();

      html += `
        <div class="media-item media-file-item" data-key="${escapeAttr(f.key)}" data-url="${escapeAttr(url)}">
          <div class="media-thumb-box">
            ${isImg ? `<img src="${url}" alt="${escapeHtml(fileName)}" class="media-thumb-img" loading="lazy"/>` : '<span class="file-icon">📄</span>'}
          </div>
          <div class="media-info">
            <span class="media-filename" title="${escapeHtml(fileName)}">${escapeHtml(fileName)}</span>
            <small class="media-filesize">${sizeStr}</small>
          </div>
          <div class="media-actions">
            <button type="button" class="btn-copy-url" title="نسخ رابط الملف" data-url="${escapeAttr(url)}">📋 نسخ الرابط</button>
            ${can('media.delete') ? `<button type="button" class="btn-del-file text-danger" title="حذف الملف" data-key="${escapeAttr(f.key)}">🗑</button>` : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Folder navigation clicks
    container.querySelectorAll('.media-folder-item').forEach(el => {
      el.addEventListener('click', () => {
        const targetPrefix = el.getAttribute('data-folder');
        document.getElementById('crumb-subfolder').innerHTML = ` / <span>${escapeHtml(targetPrefix)}</span>`;
        loadMedia(container, targetPrefix);
      });
    });

    // Copy URL clicks
    container.querySelectorAll('.btn-copy-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        navigator.clipboard.writeText(url).then(() => {
          toast.success('تم نسخ رابط الملف إلى الحافظة');
        }).catch(() => {
          prompt('رابط الملف:', url);
        });
      });
    });

    // Delete file clicks
    container.querySelectorAll('.btn-del-file').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-key');
        const ok = await confirmModal({
          title: 'حذف ملف من R2',
          message: `تحذير: هل أنت متأكد من حذف الملف "${key}" نهائياً من مخزن R2؟ لن تعمل أي روابط كانت تشير إليه.`,
          variant: 'danger'
        });
        if (!ok) return;

        try {
          await AdminService.deleteMedia(key);
          toast.success('تم حذف الملف من R2 بنجاح');
          loadMedia(container, prefix);
        } catch (err) {
          toast.error(err.message || 'فشل حذف الملف');
        }
      });
    });

  } catch (err) {
    console.error('Media error:', err);
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong>تعذر الاتصال بمخزن R2</strong>
        <p>${escapeHtml(err.message || 'خطأ أثناء استعلام الملفات')}</p>
        <button type="button" class="btn btn-warning btn-sm mt-2" onclick="location.reload()">↻ إعادة المحاولة</button>
      </div>
    `;
  }
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * المنزلة وناسها — Admin Categories Management Page
 * Handles CRUD and visual ordering of main categories and subcategories.
 */

import { AdminService } from '../services/admin.service.js';
import { showModal, confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderCategoriesPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">الأقسام والتصنيفات</h1>
        <p class="admin-page-desc">إدارة شجرة التصنيفات الرئيسية والفرعية وأيقونات العرض</p>
      </div>
      <div class="admin-page-actions">
        ${can('categories.create') ? `<button type="button" class="btn btn-primary" id="btn-add-category">+ إضافة قسم جديد</button>` : ''}
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-body" id="categories-list-container">
        <div class="spinner"></div>
      </div>
    </div>
  `;

  const listContainer = container.querySelector('#categories-list-container');
  const addBtn = container.querySelector('#btn-add-category');

  if (addBtn) {
    addBtn.addEventListener('click', () => openCategoryEditModal(null, () => loadCategories(listContainer)));
  }

  await loadCategories(listContainer);
}

async function loadCategories(container) {
  container.innerHTML = `
    <div style="padding:2rem;text-align:center;">
      <div class="spinner"></div>
      <p class="mt-2 text-muted">جاري تحميل الأقسام...</p>
    </div>
  `;

  try {
    const categories = await AdminService.getCategories();
    if (!Array.isArray(categories) || categories.length === 0) {
      container.innerHTML = `
        <div class="dt-empty-content">
          <span class="dt-empty-icon">🗂️</span>
          <p>لا توجد أقسام مسجلة حتى الآن</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="categories-grid" id="categories-grid">
        ${categories.map((cat, idx) => `
          <div class="category-item-card" data-id="${cat.id}">
            <div class="cat-card-header">
              <span class="cat-icon-badge">${escapeHtml(cat.icon || '📁')}</span>
              <div class="cat-card-titles">
                <strong>${escapeHtml(cat.name)}</strong>
                <small class="text-muted">المعرف: ${escapeHtml(cat.id)}</small>
              </div>
              <span class="cat-places-count" title="عدد الأماكن في هذا القسم">${(cat.places_count || 0).toLocaleString('ar-EG')} مكان</span>
            </div>

            ${cat.description ? `<p class="cat-desc">${escapeHtml(cat.description)}</p>` : ''}

            <div class="cat-card-actions">
              ${can('categories.update') ? `<button type="button" class="btn btn-sm btn-outline btn-edit-cat" data-cat='${escapeAttr(JSON.stringify(cat))}'>✏ تعديل</button>` : ''}
              ${can('categories.delete') ? `<button type="button" class="btn btn-sm btn-action-delete text-danger btn-delete-cat" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}" data-places="${cat.places_count || 0}">🗑 حذف</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Bind Edit Buttons
    container.querySelectorAll('.btn-edit-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = JSON.parse(btn.getAttribute('data-cat') || '{}');
        openCategoryEditModal(cat, () => loadCategories(container));
      });
    });

    // Bind Delete Buttons
    container.querySelectorAll('.btn-delete-cat').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const placesCount = parseInt(btn.getAttribute('data-places') || '0', 10);

        if (placesCount > 0) {
          toast.error(`لا يمكن حذف قسم "${name}" لأنه يحتوي على (${placesCount}) مكان مسجل. يرجى نقل أو حذف الأماكن أولاً.`);
          return;
        }

        const ok = await confirmModal({
          title: 'حذف القسم',
          message: `هل أنت متأكد من حذف قسم "${name}"؟`,
          variant: 'danger'
        });
        if (!ok) return;

        try {
          await AdminService.deleteCategory(id);
          toast.success(`تم حذف قسم "${name}" بنجاح`);
          loadCategories(container);
        } catch (err) {
          toast.error(err.message || 'فشل حذف القسم');
        }
      });
    });

  } catch (err) {
    console.error('Load categories error:', err);
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong>تعذر تحميل الأقسام من قاعدة البيانات</strong>
        <p>${escapeHtml(err.message || 'خطأ في الاتصال')}</p>
        <button type="button" class="btn btn-warning btn-sm mt-2" onclick="location.reload()">↻ إعادة المحاولة</button>
      </div>
    `;
  }
}

function openCategoryEditModal(cat = null, onSuccess) {
  const isNew = !cat;
  const title = isNew ? 'إضافة قسم جديد' : `تعديل قسم "${cat.name}"`;

  const content = `
    <form id="cat-modal-form">
      <div class="form-group">
        <label class="form-label required">اسم القسم (بالعربية):</label>
        <input type="text" id="cat-name" class="form-input" required value="${escapeHtml(cat?.name || '')}" placeholder="مثال: مطاعم ومأكولات"/>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">الرمز التعبيري / الأيقونة (Emoji):</label>
          <input type="text" id="cat-icon" class="form-input" value="${escapeHtml(cat?.icon || '📁')}" placeholder="🍽️"/>
        </div>
        <div class="form-group">
          <label class="form-label">الترتيب التسلسلي:</label>
          <input type="number" id="cat-order" class="form-input" value="${cat?.order_num ?? 0}" min="0"/>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">وصف القسم:</label>
        <textarea id="cat-desc" class="form-textarea" rows="2" placeholder="وصف موجز لهذا التصنيف...">${escapeHtml(cat?.description || '')}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button type="button" class="btn btn-secondary btn-modal-cancel">إلغاء</button>
    <button type="button" class="btn btn-primary btn-modal-save">💾 ${isNew ? 'إضافة القسم' : 'حفظ التعديلات'}</button>
  `;

  const modal = showModal({
    title,
    content,
    footer,
    size: 'sm'
  });

  modal.element.querySelector('.btn-modal-cancel').addEventListener('click', () => modal.close());

  modal.element.querySelector('.btn-modal-save').addEventListener('click', async () => {
    const name = modal.element.querySelector('#cat-name').value.trim();
    const icon = modal.element.querySelector('#cat-icon').value.trim() || '📁';
    const orderNum = parseInt(modal.element.querySelector('#cat-order').value, 10) || 0;
    const desc = modal.element.querySelector('#cat-desc').value.trim();

    if (!name) {
      toast.warning('يرجى كتابة اسم القسم');
      return;
    }

    modal.setLoading(true);
    try {
      const payload = {
        id: cat?.id || undefined,
        name,
        icon,
        order_num: orderNum,
        description: desc
      };
      await AdminService.saveCategory(payload);
      toast.success(isNew ? 'تم إضافة القسم بنجاح' : 'تم حفظ بيانات القسم');
      modal.close();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'فشل حفظ القسم');
      modal.setLoading(false);
    }
  });
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

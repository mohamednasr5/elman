/**
 * المنزلة وناسها — Production Server-Side DataTable Component
 * Features:
 * - Server-side pagination & sorting
 * - Debounced instant search
 * - Bulk selection and multi-item operations
 * - Strict error state handling (never displays empty/0 on query failure)
 * - Skeleton loading state
 */

export class DataTable {
  constructor({
    container,
    columns = [],
    fetchData, // async ({ page, limit, search, sort, order, filters }) => { data, pagination: { total, page, limit, totalPages } }
    defaultSort = 'id',
    defaultOrder = 'DESC',
    defaultLimit = 25,
    limits = [10, 25, 50, 100],
    searchPlaceholder = 'بحث...',
    bulkActions = [], // [{ label, variant, action: async (selectedIds) => void }]
    emptyText = 'لا توجد بيانات متاحة',
    filters = {}
  }) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.columns = columns;
    this.fetchData = fetchData;
    this.sort = defaultSort;
    this.order = defaultOrder;
    this.limit = defaultLimit;
    this.limits = limits;
    this.page = 1;
    this.search = '';
    this.filters = { ...filters };
    this.searchPlaceholder = searchPlaceholder;
    this.bulkActions = bulkActions;
    this.emptyText = emptyText;

    this.selectedIds = new Set();
    this.currentData = [];
    this.total = 0;
    this.totalPages = 1;
    this.isLoading = false;
    this.error = null;

    this._searchDebounceTimer = null;

    this._initDom();
    this.load();
  }

  _initDom() {
    this.container.innerHTML = `
      <div class="dt-wrapper">
        <!-- Top Toolbar -->
        <div class="dt-toolbar">
          <div class="dt-toolbar-left">
            <div class="dt-search-box">
              <span class="dt-search-icon">🔍</span>
              <input type="search" class="dt-search-input" placeholder="${escapeHtml(this.searchPlaceholder)}" value="${escapeHtml(this.search)}"/>
            </div>
            <div class="dt-filters-slot"></div>
          </div>
          <div class="dt-toolbar-right">
            <div class="dt-bulk-toolbar" style="display: none;">
              <span class="dt-selected-count">محدد: <strong>0</strong></span>
              <div class="dt-bulk-buttons"></div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm dt-btn-refresh" title="تحديث البيانات">↻ تحديث</button>
          </div>
        </div>

        <!-- Table Responsive Container -->
        <div class="dt-table-container">
          <div class="dt-table-scroll">
            <table class="dt-table">
              <thead>
                <tr class="dt-header-row">
                  <th class="dt-th-select" style="width: 42px;">
                    <input type="checkbox" class="dt-select-all" aria-label="تحديد الكل"/>
                  </th>
                  ${this.columns.map(col => `
                    <th class="dt-th ${col.sortable ? 'dt-sortable' : ''} ${col.key === this.sort ? `dt-sorted-${this.order.toLowerCase()}` : ''}" 
                        data-key="${escapeHtml(col.key)}"
                        style="${col.width ? `width:${col.width};` : ''} ${col.align ? `text-align:${col.align};` : ''}">
                      <div class="dt-th-content">
                        <span>${escapeHtml(col.label)}</span>
                        ${col.sortable ? `<span class="dt-sort-arrow">${col.key === this.sort ? (this.order === 'ASC' ? '▲' : '▼') : '↕'}</span>` : ''}
                      </div>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody class="dt-tbody">
                <!-- Rows or skeleton rendered here -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- State Overlays (Error & Empty) -->
        <div class="dt-state-message dt-error-banner" style="display: none;"></div>
        <div class="dt-state-message dt-empty-banner" style="display: none;"></div>

        <!-- Bottom Pagination Bar -->
        <div class="dt-pagination-bar">
          <div class="dt-pagination-info">
            <span class="dt-info-text">جاري التحميل...</span>
            <div class="dt-limit-selector">
              <label>عرض:
                <select class="dt-select-limit">
                  ${this.limits.map(l => `<option value="${l}" ${l === this.limit ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
              </label>
            </div>
          </div>
          <div class="dt-pagination-controls">
            <button type="button" class="btn-dt-page dt-page-prev" title="الصفحة السابقة">&laquo; السابق</button>
            <div class="dt-page-numbers"></div>
            <button type="button" class="btn-dt-page dt-page-next" title="الصفحة التالية">التالي &raquo;</button>
          </div>
        </div>
      </div>
    `;

    // Bind DOM events
    this.searchInput = this.container.querySelector('.dt-search-input');
    this.refreshBtn = this.container.querySelector('.dt-btn-refresh');
    this.tbody = this.container.querySelector('.dt-tbody');
    this.selectAllCb = this.container.querySelector('.dt-select-all');
    this.bulkToolbar = this.container.querySelector('.dt-bulk-toolbar');
    this.bulkCountEl = this.container.querySelector('.dt-selected-count strong');
    this.bulkButtonsContainer = this.container.querySelector('.dt-bulk-buttons');
    this.limitSelect = this.container.querySelector('.dt-select-limit');
    this.prevBtn = this.container.querySelector('.dt-page-prev');
    this.nextBtn = this.container.querySelector('.dt-page-next');
    this.pageNumbersContainer = this.container.querySelector('.dt-page-numbers');
    this.infoText = this.container.querySelector('.dt-info-text');
    this.errorBanner = this.container.querySelector('.dt-error-banner');
    this.emptyBanner = this.container.querySelector('.dt-empty-banner');

    // Search input debouncing
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this._searchDebounceTimer);
      this._searchDebounceTimer = setTimeout(() => {
        this.search = e.target.value.trim();
        this.page = 1;
        this.load();
      }, 350);
    });

    // Refresh button
    this.refreshBtn.addEventListener('click', () => this.load());

    // Page limit change
    this.limitSelect.addEventListener('change', (e) => {
      this.limit = parseInt(e.target.value, 10);
      this.page = 1;
      this.load();
    });

    // Next / Prev buttons
    this.prevBtn.addEventListener('click', () => {
      if (this.page > 1) {
        this.page--;
        this.load();
      }
    });

    this.nextBtn.addEventListener('click', () => {
      if (this.page < this.totalPages) {
        this.page++;
        this.load();
      }
    });

    // Column sorting clicks
    const headers = this.container.querySelectorAll('.dt-sortable');
    headers.forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-key');
        if (this.sort === key) {
          this.order = this.order === 'ASC' ? 'DESC' : 'ASC';
        } else {
          this.sort = key;
          this.order = 'ASC';
        }
        this.page = 1;
        this._updateSortHeaderUI();
        this.load();
      });
    });

    // Select all checkbox
    this.selectAllCb.addEventListener('change', (e) => {
      const checked = e.target.checked;
      this.container.querySelectorAll('.dt-row-checkbox').forEach(cb => {
        cb.checked = checked;
        const id = cb.getAttribute('data-id');
        if (checked) this.selectedIds.add(id);
        else this.selectedIds.delete(id);
      });
      this._updateBulkToolbar();
    });

    // Setup bulk buttons
    this._renderBulkButtons();
  }

  _updateSortHeaderUI() {
    this.container.querySelectorAll('.dt-th').forEach(th => {
      const key = th.getAttribute('data-key');
      const arrow = th.querySelector('.dt-sort-arrow');
      th.classList.remove('dt-sorted-asc', 'dt-sorted-desc');
      if (key === this.sort) {
        th.classList.add(this.order === 'ASC' ? 'dt-sorted-asc' : 'dt-sorted-desc');
        if (arrow) arrow.textContent = this.order === 'ASC' ? '▲' : '▼';
      } else if (arrow) {
        arrow.textContent = '↕';
      }
    });
  }

  _renderBulkButtons() {
    this.bulkButtonsContainer.innerHTML = '';
    this.bulkActions.forEach(action => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn-sm btn-${action.variant || 'primary'} dt-bulk-btn`;
      btn.textContent = action.label;
      btn.addEventListener('click', async () => {
        if (this.selectedIds.size === 0) return;
        btn.disabled = true;
        try {
          await action.action(Array.from(this.selectedIds));
          this.selectedIds.clear();
          this.selectAllCb.checked = false;
          this._updateBulkToolbar();
          this.load();
        } catch (err) {
          console.error(err);
        } finally {
          btn.disabled = false;
        }
      });
      this.bulkButtonsContainer.appendChild(btn);
    });
  }

  _updateBulkToolbar() {
    const count = this.selectedIds.size;
    this.bulkCountEl.textContent = count;
    if (count > 0 && this.bulkActions.length > 0) {
      this.bulkToolbar.style.display = 'flex';
    } else {
      this.bulkToolbar.style.display = 'none';
    }
  }

  setFilters(filters) {
    this.filters = { ...filters };
    this.page = 1;
    this.load();
  }

  async load() {
    this.isLoading = true;
    this.error = null;
    this.errorBanner.style.display = 'none';
    this.emptyBanner.style.display = 'none';
    this._renderSkeleton();

    try {
      const result = await this.fetchData({
        page: this.page,
        limit: this.limit,
        search: this.search,
        sort: this.sort,
        order: this.order,
        filters: this.filters
      });

      this.isLoading = false;

      if (!result || typeof result !== 'object') {
        throw new Error('استجابة غير صحيحة من الخادم');
      }

      this.currentData = result.data || [];
      const pagination = result.pagination || {};
      this.total = pagination.total ?? this.currentData.length;
      this.totalPages = pagination.totalPages || Math.max(1, Math.ceil(this.total / this.limit));
      this.page = pagination.page || this.page;

      this._renderData();
      this._renderPagination();
    } catch (err) {
      this.isLoading = false;
      this.error = err;
      this._renderError(err);
    }
  }

  _renderSkeleton() {
    const colSpan = this.columns.length + 1;
    this.tbody.innerHTML = Array.from({ length: Math.min(this.limit, 6) }).map(() => `
      <tr class="dt-skeleton-row">
        <td><div class="skeleton-text" style="width: 18px; height: 18px;"></div></td>
        ${this.columns.map(() => `
          <td><div class="skeleton-text" style="width: 70%; height: 16px;"></div></td>
        `).join('')}
      </tr>
    `).join('');
    this.infoText.textContent = 'جاري الاتصال بقاعدة البيانات...';
  }

  _renderError(err) {
    this.tbody.innerHTML = '';
    this.errorBanner.style.display = 'block';
    this.errorBanner.innerHTML = `
      <div class="dt-error-content">
        <span class="dt-error-icon">⚠</span>
        <div class="dt-error-text">
          <strong>تعذر تحميل البيانات من الخادم</strong>
          <p>${escapeHtml(err.message || 'حدث خطأ أثناء تنفيذ الاستعلام')}</p>
        </div>
        <button type="button" class="btn btn-warning btn-sm dt-btn-retry">↻ إعادة المحاولة</button>
      </div>
    `;

    const retryBtn = this.errorBanner.querySelector('.dt-btn-retry');
    if (retryBtn) retryBtn.addEventListener('click', () => this.load());

    this.infoText.innerHTML = `<span class="text-danger font-bold">الحالة: غير متاح (${escapeHtml(err.code || 'ERROR')})</span>`;
    this.pageNumbersContainer.innerHTML = '';
    this.prevBtn.disabled = true;
    this.nextBtn.disabled = true;
  }

  _renderData() {
    this.tbody.innerHTML = '';

    if (this.currentData.length === 0) {
      this.emptyBanner.style.display = 'block';
      this.emptyBanner.innerHTML = `
        <div class="dt-empty-content">
          <span class="dt-empty-icon">📂</span>
          <p>${escapeHtml(this.emptyText)}</p>
        </div>
      `;
      this.selectAllCb.checked = false;
      this.selectAllCb.disabled = true;
      return;
    }

    this.selectAllCb.disabled = false;
    let allOnPageSelected = true;

    this.currentData.forEach(row => {
      const rowId = String(row.id ?? row.key ?? '');
      const isSelected = this.selectedIds.has(rowId);
      if (!isSelected) allOnPageSelected = false;

      const tr = document.createElement('tr');
      tr.className = `dt-row ${isSelected ? 'dt-row-selected' : ''}`;
      tr.setAttribute('data-id', rowId);

      tr.innerHTML = `
        <td class="dt-td-select">
          <input type="checkbox" class="dt-row-checkbox" data-id="${escapeHtml(rowId)}" ${isSelected ? 'checked' : ''} aria-label="تحديد"/>
        </td>
        ${this.columns.map(col => {
          let val = row[col.key];
          let formatted = val;
          if (typeof col.render === 'function') {
            formatted = col.render(val, row);
          } else if (val === null || val === undefined) {
            formatted = '<span class="text-muted">-</span>';
          } else {
            formatted = escapeHtml(String(val));
          }
          return `<td class="dt-td" style="${col.align ? `text-align:${col.align};` : ''}">${formatted}</td>`;
        }).join('')}
      `;

      // Row checkbox
      const cb = tr.querySelector('.dt-row-checkbox');
      cb.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedIds.add(rowId);
          tr.classList.add('dt-row-selected');
        } else {
          this.selectedIds.delete(rowId);
          tr.classList.remove('dt-row-selected');
        }
        this._updateSelectAllState();
        this._updateBulkToolbar();
      });

      this.tbody.appendChild(tr);
    });

    this.selectAllCb.checked = this.currentData.length > 0 && allOnPageSelected;
  }

  _updateSelectAllState() {
    let allSelected = true;
    this.tbody.querySelectorAll('.dt-row-checkbox').forEach(cb => {
      if (!cb.checked) allSelected = false;
    });
    this.selectAllCb.checked = allSelected;
  }

  _renderPagination() {
    const startItem = this.total === 0 ? 0 : (this.page - 1) * this.limit + 1;
    const endItem = Math.min(this.page * this.limit, this.total);
    
    this.infoText.innerHTML = `عرض <strong>${startItem}</strong> إلى <strong>${endItem}</strong> من إجمالي <strong>${this.total.toLocaleString('ar-EG')}</strong> سجل`;

    this.prevBtn.disabled = this.page <= 1;
    this.nextBtn.disabled = this.page >= this.totalPages;

    // Build page buttons
    this.pageNumbersContainer.innerHTML = '';
    const maxBtns = 5;
    let startPage = Math.max(1, this.page - Math.floor(maxBtns / 2));
    let endPage = Math.min(this.totalPages, startPage + maxBtns - 1);
    if (endPage - startPage + 1 < maxBtns) {
      startPage = Math.max(1, endPage - maxBtns + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      const pBtn = document.createElement('button');
      pBtn.type = 'button';
      pBtn.className = `btn-dt-page ${p === this.page ? 'active' : ''}`;
      pBtn.textContent = p.toLocaleString('ar-EG');
      pBtn.addEventListener('click', () => {
        if (p !== this.page) {
          this.page = p;
          this.load();
        }
      });
      this.pageNumbersContainer.appendChild(pBtn);
    }
  }

  refresh() {
    return this.load();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * المنزلة وناسها — Admin Service
 * Production API service connecting all admin views to Worker /api/admin/* endpoints.
 */

import { api } from '../core/api.js';
import { setCurrentAdminRole } from '../core/auth.js';

export const AdminService = {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboard() {
    const res = await api.get('/api/admin/dashboard');
    if (res?.data?.admin?.role) {
      setCurrentAdminRole(res.data.admin.role);
    }
    return res.data;
  },

  // ── Places ────────────────────────────────────────────────────────────────
  async getPlaces(params = {}) {
    const res = await api.get('/api/admin/places', params);
    return res;
  },

  async getPlace(id) {
    const res = await api.get(`/api/admin/places/${encodeURIComponent(id)}`);
    return res.data;
  },

  async createPlace(placeData) {
    const res = await api.post('/api/admin/places', placeData);
    return res.data;
  },

  async updatePlace(id, placeData) {
    const res = await api.put(`/api/admin/places/${encodeURIComponent(id)}`, placeData);
    return res.data;
  },

  async deletePlace(id) {
    const res = await api.delete(`/api/admin/places/${encodeURIComponent(id)}`);
    return res;
  },

  async verifyPlace(id, isVerified, notes = '') {
    const res = await api.patch(`/api/admin/places/${encodeURIComponent(id)}/verify`, {
      is_verified: isVerified ? 1 : 0,
      notes
    });
    return res;
  },

  async publishPlace(id, isPublished) {
    const res = await api.patch(`/api/admin/places/${encodeURIComponent(id)}/publish`, {
      is_published: isPublished ? 1 : 0
    });
    return res;
  },

  async updatePlaceStatus(id, status) {
    const res = await api.patch(`/api/admin/places/${encodeURIComponent(id)}/status`, {
      status
    });
    return res;
  },

  async bulkPlacesAction(action, placeIds) {
    const res = await api.post('/api/admin/places/bulk', {
      action,
      placeIds
    });
    return res;
  },

  // ── Users & RBAC ──────────────────────────────────────────────────────────
  async getUsers(params = {}) {
    const res = await api.get('/api/admin/users', params);
    return res;
  },

  async updateUserRole(id, role) {
    const res = await api.put(`/api/admin/users/${encodeURIComponent(id)}/role`, { role });
    return res;
  },

  async updateUserStatus(id, status, reason = '') {
    const res = await api.post(`/api/admin/users/${encodeURIComponent(id)}/status`, { status, reason });
    return res;
  },

  // ── Verification Queue ────────────────────────────────────────────────────
  async getVerificationQueue(params = {}) {
    const res = await api.get('/api/admin/verification-queue', params);
    return res;
  },

  async decideVerification(id, decision, notes = '') {
    const res = await api.post(`/api/admin/verification-queue/${encodeURIComponent(id)}/decide`, {
      decision,
      notes
    });
    return res;
  },

  // ── Categories ────────────────────────────────────────────────────────────
  async getCategories() {
    const res = await api.get('/api/admin/categories');
    return res.data;
  },

  async saveCategory(categoryData) {
    const res = await api.put('/api/admin/categories', categoryData);
    return res.data;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/api/admin/categories/${encodeURIComponent(id)}`);
    return res;
  },

  async reorderCategories(orderedIds) {
    const res = await api.put('/api/admin/categories/reorder', { order: orderedIds });
    return res;
  },

  // ── Reviews ───────────────────────────────────────────────────────────────
  async getReviews(params = {}) {
    const res = await api.get('/api/admin/reviews', params);
    return res;
  },

  async deleteReview(id) {
    const res = await api.delete(`/api/admin/reviews/${encodeURIComponent(id)}`);
    return res;
  },

  // ── Products ──────────────────────────────────────────────────────────────
  async getProducts(params = {}) {
    const res = await api.get('/api/admin/products', params);
    return res;
  },

  async moderateProduct(id, status, notes = '') {
    const res = await api.put(`/api/admin/products/${encodeURIComponent(id)}/moderate`, {
      status,
      notes
    });
    return res;
  },

  // ── R2 Media Manager ──────────────────────────────────────────────────────
  async getMediaList(params = {}) {
    const res = await api.get('/api/admin/media', params);
    return res;
  },

  async deleteMedia(key) {
    const res = await api.delete(`/api/admin/media/${encodeURIComponent(key)}`);
    return res;
  },

  async uploadMedia(file, folder = 'uploads') {
    // Media uploads go via worker media upload route or worker API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await api.post('/api/upload', formData);
    return res;
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  async getAuditLogs(params = {}) {
    const res = await api.get('/api/admin/audit-logs', params);
    return res;
  },

  // ── System Health ─────────────────────────────────────────────────────────
  async getSystemHealth() {
    const res = await api.get('/api/admin/system-health');
    return res.data;
  },

  // ── Global Search ─────────────────────────────────────────────────────────
  async globalSearch(query) {
    const res = await api.get('/api/admin/search', { q: query });
    return res.data;
  },

  // ── Security & IP Bans ────────────────────────────────────────────────────
  async getBannedIps() {
    const res = await api.get('/api/admin/security/bans');
    return res.data;
  },

  async banIp(ip, reason = '', expiresAt = null) {
    const res = await api.post('/api/admin/security/bans', {
      ip,
      reason,
      expiresAt
    });
    return res;
  },

  async unbanIp(ip) {
    const res = await api.delete(`/api/admin/security/bans/${encodeURIComponent(ip)}`);
    return res;
  },

  // ── Push Notifications (FCM) ──────────────────────────────────────────────
  async sendNotification(payload) {
    const res = await api.post('/api/admin/notifications/send', payload);
    return res;
  }
};

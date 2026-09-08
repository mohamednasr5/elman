/**
 * المنزلة وناسها — Admin RBAC & Permissions Module
 * Controls UI element visibility and action authorizations client-side.
 */

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  EDITOR: 'EDITOR',
  SUPPORT: 'SUPPORT'
};

export const ROLE_LABELS = {
  SUPERADMIN: 'مدير عام المنظومة',
  ADMIN: 'مسؤول إدارة',
  MODERATOR: 'مشرف محتوى وتوثيق',
  EDITOR: 'محرر بيانات',
  SUPPORT: 'دعم فني واستعلام'
};

export const ROLE_BADGE_CLASSES = {
  SUPERADMIN: 'badge-superadmin',
  ADMIN: 'badge-admin',
  MODERATOR: 'badge-moderator',
  EDITOR: 'badge-editor',
  SUPPORT: 'badge-support'
};

export const ROLE_PERMISSIONS = {
  SUPERADMIN: ['*'],
  ADMIN: [
    'dashboard.read',
    'places.read', 'places.create', 'places.update', 'places.delete', 'places.verify', 'places.publish',
    'users.read', 'users.role', 'users.suspend',
    'verification.read', 'verification.decide',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'reviews.read', 'reviews.delete',
    'products.read', 'products.approve',
    'media.read', 'media.upload', 'media.delete',
    'audit.read',
    'system.read',
    'security.read', 'security.ban',
    'notifications.send',
    'settings.read', 'settings.update'
  ],
  MODERATOR: [
    'dashboard.read',
    'places.read', 'places.update', 'places.verify', 'places.publish',
    'verification.read', 'verification.decide',
    'reviews.read', 'reviews.delete',
    'products.read', 'products.approve',
    'media.read', 'media.upload',
    'categories.read'
  ],
  EDITOR: [
    'dashboard.read',
    'places.read', 'places.create', 'places.update',
    'categories.read',
    'media.read', 'media.upload',
    'reviews.read',
    'products.read'
  ],
  SUPPORT: [
    'dashboard.read',
    'places.read',
    'users.read',
    'verification.read',
    'reviews.read',
    'audit.read',
    'system.read'
  ]
};

/**
 * Check whether a role has a given permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role) return false;
  const upperRole = String(role).toUpperCase();
  const perms = ROLE_PERMISSIONS[upperRole];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}

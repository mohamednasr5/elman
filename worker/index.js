/**
 * المنزلة وناسها — Cloudflare Worker API Backend
 * Bound to R2 Bucket: elmanzala
 * OpenRouter AI Integration (Ox Alpha model)
 * Server-side Quota Enforcement (Offers & Products Limits)
 * Telegram Bot & Instant Notification System
 */

import { handleTelegramWebhook, sendAdminPushNotification, telegramApi } from './telegram.js';
import { createTursoDB, checkTursoHealth } from './turso.js';
const SUPERADMIN_EMAILS = new Set([
  'elfannanm@gmail.com',
  'mohamednasrofficial@gmail.com'
]);

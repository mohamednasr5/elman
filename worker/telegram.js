/**
 * المنزلة وناسها — Telegram Admin Bot & Notification Engine
 * Uses Turso for application data. Firebase is not a database dependency.
 */
import { createTursoDB } from './turso.js';

async function tursoRows(env, sql, ...args) {
  return (await createTursoDB(env).prepare(sql).bind(...args).all())?.results || [];
}
async function tursoFirst(env, sql, ...args) {
  return createTursoDB(env).prepare(sql).bind(...args).first();
}
async function tursoRun(env, sql, ...args) {
  return createTursoDB(env).prepare(sql).bind(...args).run();
}
function mapPlaceRow(p) {
  if (!p) return null;
  return {_id:p.id,id:p.id,name:p.name,nameEn:p.name_en,slug:p.slug,
    categoryName:p.category_name||p.custom_category||p.category_id||'عام',
    customCategory:p.custom_category,phone:p.phone,whatsapp:p.whatsapp,address:p.address,area:p.area,
    description:p.description,coverImageUrl:p.cover_image_url,logoUrl:p.logo_url,
    isVerified:Boolean(p.is_verified),isSponsored:Boolean(p.is_sponsored),isFeatured:Boolean(p.is_featured),
    sponsoredUntil:p.sponsored_until,createdAt:p.created_at,updatedAt:p.updated_at};
}
function mapOfferRow(o) {
  if (!o) return null;
  return {_id:o.id,id:o.id,title:o.title,description:o.description,placeId:o.place_id,placeName:o.place_name,
    discount:o.discount_percent,price:o.new_price,oldPrice:o.old_price,expiresAt:o.end_date,status:o.status};
}
function mapVerificationRow(r) {
  if (!r) return null;
  return {_id:r.id,id:r.id,placeId:r.place_id,placeName:r.place_name,requesterName:r.owner_name,
    requesterEmail:r.owner_email,phone:r.phone,notes:r.notes,status:r.status,verifiedUntil:r.verified_until,createdAt:r.created_at};
}
export async function resolveTelegramCredentials(env) {
  return {token:env?.TELEGRAM_BOT_TOKEN,adminId:env?.TELEGRAM_ADMIN_ID};
}

/**
 * Send HTTP request to Telegram Bot API
 */
export async function telegramApi(method, body, env) {
  const { token } = await resolveTelegramCredentials(env);
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN is not configured in Worker or Firebase settings.');
    return { ok: false, description: 'Bot token not set' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error(`[Telegram API Error - ${method}]:`, err);
    return { ok: false, error: err.message };
  }
}

/**
 * Handle incoming Telegram Webhook Updates
 */
export async function handleTelegramWebhook(request, env) {
  try {
    const update = await request.json();

    // 1. Handle Callback Queries (Inline Buttons)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, env);
      return new Response('OK', { status: 200 });
    }

    // 2. Handle Messages
    if (update.message) {
      await handleMessage(update.message, env);
      return new Response('OK', { status: 200 });
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('[Telegram Webhook Error]:', err);
    return new Response('Error: ' + err.message, { status: 500 });
  }
}

/**
 * Handle Incoming Text / Commands Messages
 */
async function handleMessage(msg, env) {
  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();
  const fromUser = msg.from?.first_name || 'Admin';

  if (!chatId) return;

  // Authorization check (if env.TELEGRAM_ADMIN_ID is set)
  if (env.TELEGRAM_ADMIN_ID && String(chatId) !== String(env.TELEGRAM_ADMIN_ID)) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `⚠️ عذراً ${fromUser}، هذا البوت مخصص فقط لإدارة منصة دليل المنزلة والمطرية الرقمي. المعرف الخاص بك هو: \`${chatId}\``,
      parse_mode: 'Markdown'
    }, env);
    return;
  }

  // Command: /start or /menu
  if (text.startsWith('/start') || text.startsWith('/menu') || text === 'الرئيسية') {
    await sendMainMenu(chatId, fromUser, env);
    return;
  }

  // Command: /stats
  if (text.startsWith('/stats') || text === '📊 الإحصائيات') {
    await sendStats(chatId, env);
    return;
  }

  // Command: /verifications
  if (text.startsWith('/verifications') || text === '🛡️ طلبات التوثيق') {
    await sendVerificationRequests(chatId, env);
    return;
  }

  // Command: /offers
  if (text.startsWith('/offers') || text === '🔥 العروض النشطة') {
    await sendActiveOffers(chatId, env);
    return;
  }

  // Command: /sponsored
  if (text.startsWith('/sponsored') || text === '🌟 الإعلانات المميزة') {
    await sendSponsoredShowcase(chatId, env);
    return;
  }

  // Command: /search <query>
  if (text.startsWith('/search ') || text.startsWith('بحث ')) {
    const q = text.replace(/^(\/search|بحث)\s+/i, '').trim();
    await searchPlaces(chatId, q, env);
    return;
  }

  // Command: /verify <placeId>
  if (text.startsWith('/verify ')) {
    const placeId = text.replace('/verify ', '').trim();
    await togglePlaceVerification(chatId, placeId, true, env);
    return;
  }

  // Command: /unverify <placeId>
  if (text.startsWith('/unverify ')) {
    const placeId = text.replace('/unverify ', '').trim();
    await togglePlaceVerification(chatId, placeId, false, env);
    return;
  }

  // Command: /promote <placeId> (Toggle sponsored ad)
  if (text.startsWith('/promote ')) {
    const placeId = text.replace('/promote ', '').trim();
    await toggleSponsored(chatId, placeId, env);
    return;
  }

  // Command: /edit <placeId> <field> <value...>
  if (text.startsWith('/edit ')) {
    const parts = text.split(' ');
    if (parts.length >= 4) {
      const placeId = parts[1];
      const field = parts[2].toLowerCase();
      const val = parts.slice(3).join(' ');
      await editPlaceField(chatId, placeId, field, val, env);
      return;
    } else {
      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: `✏️ *صيغة التعديل:*\n\`/edit <كود_المكان> <الحقل> <القيمة_الجديدة>\`\n\n*الحقول المدعومة:*\n• \`name\` (الاسم)\n• \`phone\` (الهاتف)\n• \`category\` (التصنيف)\n• \`area\` (المنطقة)\n• \`description\` (الوصف)\n• \`cover\` (رابط الغلاف)\n• \`logo\` (رابط الشعار)`,
        parse_mode: 'Markdown'
      }, env);
      return;
    }
  }

  // Command: /addplace <name> | <category> | <phone> | <area>
  if (text.startsWith('/addplace')) {
    const content = text.replace('/addplace', '').trim();
    if (!content) {
      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: `➕ *إضافة مكان جديد سريعاً:*\n\nأرسل الأمر بهذا الشكل:\n\`/addplace اسم المكان | التصنيف | رقم الهاتف | المنطقة\`\n\n*مثال:*\n\`/addplace صيدلية النور | صيدلية | 01099887766 | طريق المطرية\``,
        parse_mode: 'Markdown'
      }, env);
      return;
    }
    await addPlaceQuick(chatId, content, env);
    return;
  }

  // If text is a query string, treat it as a search!
  if (text.length >= 2) {
    await searchPlaces(chatId, text, env);
    return;
  }

  // Default fallback
  await sendMainMenu(chatId, fromUser, env);
}

/**
 * Handle Inline Button Clicks (Callback Queries)
 */
async function handleCallbackQuery(cb, env) {
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const data = cb.data || '';
  const queryId = cb.id;

  await telegramApi('answerCallbackQuery', { callback_query_id: queryId }, env);

  if (data === 'menu_stats') {
    await sendStats(chatId, env, messageId);
  } else if (data === 'menu_verifications') {
    await sendVerificationRequests(chatId, env, messageId);
  } else if (data === 'menu_offers') {
    await sendActiveOffers(chatId, env, messageId);
  } else if (data === 'menu_sponsored') {
    await sendSponsoredShowcase(chatId, env, messageId);
  } else if (data === 'menu_main') {
    await sendMainMenu(chatId, 'Admin', env, messageId);
  } else if (data.startsWith('verify_accept:')) {
    const placeId = data.replace('verify_accept:', '');
    await togglePlaceVerification(chatId, placeId, true, env, messageId);
  } else if (data.startsWith('verify_reject:')) {
    const placeId = data.replace('verify_reject:', '');
    await rejectVerification(chatId, placeId, env, messageId);
  } else if (data.startsWith('toggle_sponsored:')) {
    const placeId = data.replace('toggle_sponsored:', '');
    await toggleSponsored(chatId, placeId, env, messageId);
  } else if (data.startsWith('view_place:')) {
    const placeId = data.replace('view_place:', '');
    await viewPlaceDetails(chatId, placeId, env);
  }
}

/**
 * Main Interactive Menu
 */
async function sendMainMenu(chatId, name, env, editMessageId = null) {
  const text = `👋 *أهلاً بك يا ${name} في لوحة تحكم المنزلة وناسها عبر تليجرام!*\n\nيمكنك إدارة المنصة بالكامل، متابعة الإحصائيات، التوثيق، الإعلانات، وتعديل أي مكان مباشرة من هنا.`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📊 الإحصائيات الشاملة', callback_data: 'menu_stats' },
        { text: '🛡️ طلبات التوثيق', callback_data: 'menu_verifications' }
      ],
      [
        { text: '🌟 الإعلانات المميزة', callback_data: 'menu_sponsored' },
        { text: '🔥 العروض والخصومات', callback_data: 'menu_offers' }
      ],
      [
        { text: '🌐 فتح المنصة مباشرة', url: 'https://elmanzla.web.app' }
      ]
    ]
  };

  if (editMessageId) {
    await telegramApi('editMessageText', {
      chat_id: chatId,
      message_id: editMessageId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }, env);
  } else {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }, env);
  }
}

/**
 * Detailed Statistics
 */
async function sendStats(chatId, env, editMessageId = null) {
  try {
    const [placeRows, verifRows, offerRows] = await Promise.all([
      tursoRows(env, 'SELECT p.*, c.name AS category_name FROM places p LEFT JOIN categories c ON c.id = p.category_id'),
      tursoRows(env, 'SELECT id, status FROM verification_requests'),
      tursoRows(env, 'SELECT status FROM offers')
    ]);
    const places = placeRows.map(mapPlaceRow);
    const totalPlaces = places.length;
    const verifiedPlaces = places.filter(p => p.isVerified).length;
    const sponsoredPlaces = places.filter(p => p.isSponsored || p.isFeatured).length;

    // Count per category
    const catCounts = {};
    places.forEach(p => {
      const c = p.categoryName || p.customCategory || 'أخرى';
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    const sortedCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const catListStr = sortedCats
      .map(([cat, count]) => `  ▫️ *${cat}:* ${count} مكان`)
      .join('\n');

    // Last added place
    const sortedPlaces = [...places].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const lastPlace = sortedPlaces[0];
    const lastPlaceStr = lastPlace 
      ? `🏢 *آخر نشاط مضاف:* [${lastPlace.name}](https://elmanzla.web.app/place.html?slug=${lastPlace.slug || lastPlace._id}) (${lastPlace.categoryName || 'عام'})` 
      : 'لا يوجد';

    // Pending verifications
    const pendingVerifs = verifRows.filter(v => v.status === 'pending').length;
    const totalOffers = offerRows.filter(o => o.status === 'active' || !o.status).length;

    const report = `📊 *تقرير منصة المنزلة وناسها اللحظي:*\n\n` +
      `📌 *إجمالي الأماكن:* ${totalPlaces} مكان\n` +
      `🛡️ *الأماكن الموثقة (العلامة الزرقاء):* ${verifiedPlaces}\n` +
      `🌟 *الإعلانات المميزة:* ${sponsoredPlaces}\n` +
      `⏳ *طلبات التوثيق المعلقة:* ${pendingVerifs}\n` +
      `🔥 *العروض النشطة:* ${totalOffers}\n\n` +
      `🗂️ *توزيع الأماكن حسب التصنيف:*\n${catListStr || '  ▫️ لا توجد تصنيفات'}\n\n` +
      `${lastPlaceStr}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 تحديث الأرقام', callback_data: 'menu_stats' },
          { text: '🛡️ طلبات التوثيق', callback_data: 'menu_verifications' }
        ],
        [
          { text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }
        ]
      ]
    };

    if (editMessageId) {
      await telegramApi('editMessageText', {
        chat_id: chatId,
        message_id: editMessageId,
        text: report,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }, env);
    } else {
      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: report,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }, env);
    }
  } catch (err) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: '❌ حدث خطأ أثناء جلب الإحصائيات: ' + err.message
    }, env);
  }
}

/**
 * Verification Requests Manager
 */
async function sendVerificationRequests(chatId, env, editMessageId = null) {
  try {
    const requests = (await tursoRows(env, 'SELECT id, place_id, place_name, owner_name, owner_email, phone, notes, status, verified_until, created_at FROM verification_requests ORDER BY created_at DESC')).map(mapVerificationRow).filter(r => r.status === 'pending');

    if (requests.length === 0) {
      const emptyText = '🛡️ *طلبات التوثيق:*\n\n✅ لا توجد أي طلبات توثيق معلقة حالياً!';
      const keyboard = {
        inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]]
      };
      if (editMessageId) {
        await telegramApi('editMessageText', {
          chat_id: chatId,
          message_id: editMessageId,
          text: emptyText,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }, env);
      } else {
        await telegramApi('sendMessage', {
          chat_id: chatId,
          text: emptyText,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }, env);
      }
      return;
    }

    for (const req of requests.slice(0, 5)) {
      const msg = `🛡️ *طلب توثيق جديد:*\n\n` +
        `🏢 *المكان:* ${req.placeName || req.placeId}\n` +
        `👤 *المقدم:* ${req.requesterName || req.requesterEmail || 'صاحب المكان'}\n` +
        `📞 *الهاتف:* \`${req.phone || 'غير مسجل'}\`\n` +
        `💬 *ملاحظات:* ${req.notes || 'لا يوجد'}\n` +
        `📅 *التاريخ:* ${req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-EG') : 'حديثاً'}`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ قبول وتوثيق المكان', callback_data: `verify_accept:${req.placeId || req._id}` },
            { text: '❌ رفض الطلب', callback_data: `verify_reject:${req._id}` }
          ],
          [
            { text: '🔍 معاينة المكان', callback_data: `view_place:${req.placeId || req._id}` }
          ]
        ]
      };

      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }, env);
    }
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ خطأ: ' + err.message }, env);
  }
}

/**
 * Toggle Place Verification
 */
async function togglePlaceVerification(chatId, placeId, isVerified, env, editMessageId = null) {
  try {
    const verifiedUntil = isVerified ? (Date.now() + (90 * 24 * 60 * 60 * 1000)) : null; // 3 months default
    const result = await tursoRun(env, 'UPDATE places SET is_verified = ?, verification_status = ?, updated_at = ? WHERE id = ?', isVerified ? 1 : 0, isVerified ? 'verified' : 'unverified', Date.now(), placeId);
    if (Number(result?.meta?.changes || 0) !== 1) throw new Error('المكان غير موجود أو لم يتم تحديثه');

    const statusText = isVerified 
      ? `✅ تم توثيق المكان بنجاح وتفعيل العلامة الزرقاء! 🛡️` 
      : `⚠️ تم إلغاء توثيق المكان.`;

    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `${statusText}\nID: \`${placeId}\``,
      parse_mode: 'Markdown'
    }, env);
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ فشل التوثيق: ' + err.message }, env);
  }
}

/**
 * Reject Verification
 */
async function rejectVerification(chatId, requestId, env, editMessageId = null) {
  try {
    const result = await tursoRun(env, 'UPDATE verification_requests SET status = ?, reviewed_at = ? WHERE id = ? AND status = ?', 'rejected', Date.now(), requestId, 'pending');
    if (Number(result?.meta?.changes || 0) !== 1) throw new Error('طلب التوثيق غير موجود أو تمت معالجته بالفعل');
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `❌ تم رفض طلب التوثيق رقم: \`${requestId}\``,
      parse_mode: 'Markdown'
    }, env);
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ فشل رفض الطلب: ' + err.message }, env);
  }
}

/**
 * Toggle Sponsored / Featured Showcase
 */
async function toggleSponsored(chatId, placeId, env, editMessageId = null) {
  try {
    const place = mapPlaceRow(await tursoFirst(env, 'SELECT p.*, c.name AS category_name FROM places p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ? LIMIT 1', placeId));
    if (!place) {
      await telegramApi('sendMessage', { chat_id: chatId, text: 'لم يتم العثور على المكان' }, env);
      return;
    }

    const newSponsored = !place.isSponsored;
    const result = await tursoRun(env, 'UPDATE places SET is_sponsored = ?, is_featured = ?, updated_at = ? WHERE id = ?', newSponsored ? 1 : 0, newSponsored ? 1 : 0, Date.now(), placeId);
    if (Number(result?.meta?.changes || 0) !== 1) throw new Error('تعذر تحديث الإعلان المميز');

    const txt = newSponsored 
      ? `🌟 تم تثبيت "${place.name}" كإعلان مميز في صدارة الموقع!` 
      : `تمت إزالة "${place.name}" من الإعلانات المميزة.`;

    await telegramApi('sendMessage', { chat_id: chatId, text: txt }, env);
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ خطأ: ' + err.message }, env);
  }
}

/**
 * Search Places via Telegram
 */
async function searchPlaces(chatId, query, env) {
  try {
    const places = (await tursoRows(env, 'SELECT p.*, c.name AS category_name FROM places p LEFT JOIN categories c ON c.id = p.category_id')).map(mapPlaceRow);

    const q = query.toLowerCase().trim();
    const results = places.filter(p => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.categoryName || p.customCategory || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const area = (p.area || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || phone.includes(q) || area.includes(q);
    }).slice(0, 6);

    if (results.length === 0) {
      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: `🔍 لم يتم العثور على نتائج بحث تطابق: "${query}"\n\nجرّب البحث باسم آخر أو تصنيف مثل (صيدلية، دكتور، ورشة).`
      }, env);
      return;
    }

    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `🔍 *نتائج البحث عن:* "${query}" (${results.length} مكان):\n`
    }, env);

    for (const p of results) {
      const isVer = p.isVerified ? '🛡️ موثق' : 'غير موثق';
      const isSpon = p.isSponsored ? '🌟 إعلان مميز' : '';
      const text = `🏢 *${p.name}* (${isVer}) ${isSpon}\n` +
        `📂 *التصنيف:* ${p.categoryName || p.customCategory || 'عام'}\n` +
        `📍 *المنطقة:* ${p.area || 'المنزلة'}\n` +
        `📞 *الهاتف:* \`${p.phone || 'بدون'}\`\n` +
        `🆔 *الكود:* \`${p._id}\``;

      const keyboard = {
        inline_keyboard: [
          [
            { text: p.isVerified ? '❌ إلغاء التوثيق' : '🛡️ توثيق المكان', callback_data: `verify_accept:${p._id}` },
            { text: p.isSponsored ? '⭐ إلغاء التمييز' : '🌟 جعله إعلان مميز', callback_data: `toggle_sponsored:${p._id}` }
          ],
          [
            { text: '🌐 فتح في الموقع', url: `https://elmanzla.web.app/place.html?slug=${p.slug || p._id}` }
          ]
        ]
      };

      if (p.coverImageUrl || p.logoUrl) {
        await telegramApi('sendPhoto', {
          chat_id: chatId,
          photo: p.coverImageUrl || p.logoUrl,
          caption: text,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }, env);
      } else {
        await telegramApi('sendMessage', {
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }, env);
      }
    }
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ خطأ في البحث: ' + err.message }, env);
  }
}

/**
 * View Place Details
 */
async function viewPlaceDetails(chatId, placeId, env) {
  try {
    const p = mapPlaceRow(await tursoFirst(env, 'SELECT p.*, c.name AS category_name FROM places p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ? LIMIT 1', placeId));
    if (!p) {
      await telegramApi('sendMessage', { chat_id: chatId, text: 'المكان غير موجود' }, env);
      return;
    }
    const text = `🏢 *${p.name}*\n` +
      `📂 *التصنيف:* ${p.categoryName || p.customCategory || 'عام'}\n` +
      `📍 *العنوان:* ${p.address || p.area || 'المنزلة'}\n` +
      `📞 *الهاتف:* \`${p.phone || 'غير مسجل'}\`\n` +
      `💬 *واتساب:* \`${p.whatsapp || 'غير مسجل'}\`\n` +
      `🛡️ *الحالة:* ${p.isVerified ? 'موثق ✓' : 'غير موثق'}\n` +
      `📝 *الوصف:* ${p.description || 'لا يوجد'}\n` +
      `🆔 *الكود:* \`${placeId}\``;

    const keyboard = {
      inline_keyboard: [
        [
          { text: p.isVerified ? '❌ إلغاء التوثيق' : '🛡️ توثيق المكان', callback_data: `verify_accept:${placeId}` },
          { text: p.isSponsored ? '⭐ إلغاء الإعلان' : '🌟 تثبيت كإعلان', callback_data: `toggle_sponsored:${placeId}` }
        ],
        [
          { text: '🌐 معاينة بالموقع', url: `https://elmanzla.web.app/place.html?slug=${p.slug || placeId}` }
        ]
      ]
    };

    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }, env);
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ خطأ: ' + err.message }, env);
  }
}

/**
 * Edit Place Field
 */
async function editPlaceField(chatId, placeId, field, value, env) {
  try {
    const fieldMap = {
      'name': 'name',
      'الاسم': 'name',
      'phone': 'phone',
      'هاتف': 'phone',
      'category': 'categoryName',
      'تصنيف': 'categoryName',
      'area': 'area',
      'منطقة': 'area',
      'description': 'description',
      'وصف': 'description',
      'cover': 'coverImageUrl',
      'غلاف': 'coverImageUrl',
      'logo': 'logoUrl',
      'شعار': 'logoUrl'
    };

    const targetKey = fieldMap[field] || field;
    const updates = {
      [targetKey]: value,
      updatedAt: Date.now()
    };

    const allowedColumns = {name:'name',phone:'phone',area:'area',description:'description',coverImageUrl:'cover_image_url',logoUrl:'logo_url'};
    const column = allowedColumns[targetKey];
    if (!column) throw new Error('حقل غير مسموح بتعديله من Telegram');
    const result = await tursoRun(env, `UPDATE places SET ${column} = ?, updated_at = ? WHERE id = ?`, value, Date.now(), placeId);
    if (Number(result?.meta?.changes || 0) !== 1) throw new Error('المكان غير موجود أو لم يتم التعديل');

    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `✅ تم تعديل *${targetKey}* بنجاح إلى:\n"${value}"\nللمكان: \`${placeId}\``,
      parse_mode: 'Markdown'
    }, env);
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ فشل التعديل: ' + err.message }, env);
  }
}

/**
 * Add Place Quick
 */
async function addPlaceQuick(chatId, content, env) {
  try {
    const parts = content.split('|').map(s => s.trim());
    const name = parts[0] || '';
    const categoryName = parts[1] || 'خدمات عامة';
    const phone = parts[2] || '';
    const area = parts[3] || 'المنزلة';

    if (!name) {
      await telegramApi('sendMessage', { chat_id: chatId, text: '❌ يرجى كتابة اسم المكان على الأقل' }, env);
      return;
    }

    const slug = name.replace(/[^\u0621-\u064A\w\s-]/g, '').trim().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    const newPlace = {
      name,
      slug,
      categoryName,
      phone,
      area,
      status: 'active',
      isVerified: true,
      verifiedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const id = 'tg_' + crypto.randomUUID();
    await tursoRun(env, 'INSERT INTO places (id,name,slug,custom_category,phone,area,status,is_verified,verification_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)', id, name, slug, categoryName, phone, area, 'published', 1, 'verified', Date.now(), Date.now());
    const data = {name:id};

    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `🎉 *تمت إضافة المكان الجديد بنجاح وتم توثيقه تلقائياً!* 🛡️\n\n` +
        `🏢 *الاسم:* ${name}\n` +
        `📂 *التصنيف:* ${categoryName}\n` +
        `📞 *الهاتف:* ${phone || 'بدون'}\n` +
        `📍 *المنطقة:* ${area}\n` +
        `🆔 *الكود:* \`${data.name}\``,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 فتح في الموقع', url: `https://elmanzla.web.app/place.html?slug=${slug}` }]
        ]
      }
    }, env);
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ خطأ أثناء الإضافة: ' + err.message }, env);
  }
}

/**
 * Send Active Offers List
 */
async function sendActiveOffers(chatId, env, editMessageId = null) {
  try {
    const offers = (await tursoRows(env, 'SELECT o.*, p.name AS place_name FROM offers o LEFT JOIN places p ON p.id = o.place_id ORDER BY o.created_at DESC')).map(mapOfferRow);

    if (offers.length === 0) {
      const msg = '🔥 *العروض والخصومات:*\n\nلا توجد عروض منشورة حالياً.';
      const kb = { inline_keyboard: [[{ text: '🔙 الرئيسية', callback_data: 'menu_main' }]] };
      if (editMessageId) {
        await telegramApi('editMessageText', { chat_id: chatId, message_id: editMessageId, text: msg, reply_markup: kb }, env);
      } else {
        await telegramApi('sendMessage', { chat_id: chatId, text: msg, reply_markup: kb }, env);
      }
      return;
    }

    let report = `🔥 *العروض والخصومات النشطة (${offers.length} عرض):*\n\n`;
    offers.slice(0, 10).forEach((o, i) => {
      report += `${i + 1}. *${o.title || 'عرض بدون عنوان'}*\n` +
        `   🏢 المكان: ${o.placeName || 'مكان'}\n` +
        `   🏷️ الخصم: ${o.discount ? o.discount + '%' : (o.price ? o.price + ' ج.م' : 'خصم خاص')}\n` +
        `   ⏳ ينتهي في: ${o.expiresAt ? new Date(o.expiresAt).toLocaleDateString('ar-EG') : 'غير محدد'}\n\n`;
    });

    const kb = {
      inline_keyboard: [
        [{ text: '🔄 تحديث', callback_data: 'menu_offers' }, { text: '🔙 الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    if (editMessageId) {
      await telegramApi('editMessageText', { chat_id: chatId, message_id: editMessageId, text: report, parse_mode: 'Markdown', reply_markup: kb }, env);
    } else {
      await telegramApi('sendMessage', { chat_id: chatId, text: report, parse_mode: 'Markdown', reply_markup: kb }, env);
    }
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ خطأ: ' + err.message }, env);
  }
}

/**
 * Send Sponsored Showcase List
 */
async function sendSponsoredShowcase(chatId, env, editMessageId = null) {
  try {
    const sponsored = (await tursoRows(env, 'SELECT p.*, c.name AS category_name FROM places p LEFT JOIN categories c ON c.id = p.category_id WHERE p.is_sponsored = 1 OR p.is_featured = 1')).map(mapPlaceRow);

    let report = `🌟 *الأماكن المثبتة في الإعلانات المميزة (${sponsored.length}):*\n\n`;
    if (sponsored.length === 0) {
      report += 'لا توجد أماكن مثبتة في شريط الإعلانات حالياً.\nيمكنك كتابة \`/promote <كود_المكان>\` لتثبيت أي مكان كإعلان مميز!';
    } else {
      sponsored.forEach((p, i) => {
        report += `${i + 1}. *${p.name}* (${p.categoryName || 'عام'})\n   🆔 الكود: \`${p._id}\`\n\n`;
      });
    }

    const kb = {
      inline_keyboard: [
        [{ text: '🔄 تحديث', callback_data: 'menu_sponsored' }, { text: '🔙 الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    if (editMessageId) {
      await telegramApi('editMessageText', { chat_id: chatId, message_id: editMessageId, text: report, parse_mode: 'Markdown', reply_markup: kb }, env);
    } else {
      await telegramApi('sendMessage', { chat_id: chatId, text: report, parse_mode: 'Markdown', reply_markup: kb }, env);
    }
  } catch (err) {
    await telegramApi('sendMessage', { chat_id: chatId, text: '❌ خطأ: ' + err.message }, env);
  }
}

/**
 * Send Instant Push Notification to Admin Telegram
 */
export async function sendAdminPushNotification(type, payload, env) {
  const { adminId: chatId } = await resolveTelegramCredentials(env);
  if (!chatId) return { ok: false, error: 'No admin chat ID configured in Worker env nor in Firebase settings/telegram' };

  let text = '';
  let keyboard = null;

  if (type === 'new_place') {
    text = `🏢 *تمت إضافة مكان جديد للمنصة:*\n\n` +
      `📌 *الاسم:* ${payload.name}\n` +
      `📂 *التصنيف:* ${payload.categoryName || payload.customCategory || 'عام'}\n` +
      `📞 *الهاتف:* ${payload.phone || 'غير مسجل'}\n` +
      `📍 *المنطقة:* ${payload.area || 'المنزلة'}\n` +
      `👤 *المالك:* ${payload.ownerName || payload.ownerEmail || 'بدون'}\n` +
      `🆔 *الكود:* \`${payload.id || payload._id}\``;

    keyboard = {
      inline_keyboard: [
        [
          { text: '🛡️ توثيق فوري', callback_data: `verify_accept:${payload.id || payload._id}` },
          { text: '🌟 جعله إعلان', callback_data: `toggle_sponsored:${payload.id || payload._id}` }
        ]
      ]
    };
  } else if (type === 'verification_request') {
    text = `🛡️ *طلب توثيق جديد ورد الآن!*\n\n` +
      `🏢 *المكان:* ${payload.placeName}\n` +
      `👤 *مقدم الطلب:* ${payload.requesterName || payload.requesterEmail}\n` +
      `📞 *الهاتف:* \`${payload.phone || 'غير مسجل'}\`\n` +
      `💬 *الرسالة:* ${payload.notes || 'طلب تفعيل الشارة الموثقة'}`;

    keyboard = {
      inline_keyboard: [
        [
          { text: '✅ قبول وتوثيق المكان', callback_data: `verify_accept:${payload.placeId}` },
          { text: '❌ رفض', callback_data: `verify_reject:${payload.requestId || payload.placeId}` }
        ]
      ]
    };
  } else if (type === 'new_offer') {
    text = `🔥 *تم نشر عرض جديد على المنصة!*\n\n` +
      `🏷️ *العرض:* ${payload.title}\n` +
      `🏢 *المكان:* ${payload.placeName}\n` +
      `💰 *الخصم/السعر:* ${payload.discount || payload.price || 'عرض خاص'}`;
  } else if (type === 'new_review') {
    const starStr = '⭐'.repeat(Math.min(5, Math.max(1, payload.rating || 5)));
    text = `🔔 *تعليق جديد على مكان في المنزلة!*\n\n` +
      `🏢 *المكان / * ${payload.placeName || 'المكان'}\n` +
      `👤 *صاحب التعليق / * ${payload.userName || 'عميل'}\n` +
      `⭐ *عدد النجوم / * ${payload.rating || 5} ${starStr}\n` +
      `💬 *نص التعليق / *\n"${payload.comment || ''}"`;

    keyboard = {
      inline_keyboard: [
        [
          { text: '🌐 عرض في صفحة المكان', url: `https://elmanzla.web.app/place.html?slug=${payload.placeSlug || payload.placeId}` }
        ]
      ]
    };
  } else if (type === 'review_reported') {
    text = `🚩 *تم الإبلاغ عن تعليق كمسيء!*\n\n` +
      `🏢 *المكان / * ${payload.placeName || 'المكان'}\n` +
      `👤 *كاتب التعليق / * ${payload.userName || 'عميل'}\n` +
      `💬 *التعليق / * "${payload.comment || ''}"\n` +
      `⚠️ *سبب الإبلاغ / * ${payload.reason || 'محتوى غير لائق'}\n` +
      `👤 *مُقدّم البلاغ / * ${payload.reporterName || 'مستخدم'}`;
  } else if (type === 'contact_message') {
    text = `📩 *رسالة جديدة من صفحة تواصل معنا!*\n\n` +
      `👤 *الاسم:* ${payload.name}\n` +
      `📞 *الهاتف/الإيميل:* ${payload.contact}\n` +
      `📝 *الرسالة:* ${payload.message}`;
  } else {
    text = `📢 *إشعار من المنصة:*\n\n${JSON.stringify(payload, null, 2)}`;
  }

  return await telegramApi('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    reply_markup: keyboard
  }, env);
}

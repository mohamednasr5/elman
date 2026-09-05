/**
 * telegram-moderator.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * بوت تليجرام لإدارة واعتماد أخبار وتحديثات "المنزلة والمطرية الآن"
 * يتيح للإدارة تلقي التنبيهات الفورية والموافقة أو الرفض بنقرة واحدة من تليجرام.
 * ─────────────────────────────────────────────────────────────────────────
 * 
 * طريقة التشغيل:
 * 1. أنشئ بوت جديد من @BotFather في تليجرام واحصل على الـ Token.
 * 2. احصل على الـ Chat ID الخاص بك من @userinfobot.
 * 3. شغّل الأمر: node telegram-moderator.mjs
 */

const CONFIG = {
  // أدخل الـ Token الخاص ببوتك هنا أو مرره كمتغير بيئة BOT_TOKEN
  BOT_TOKEN: process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_HERE',
  
  // الـ Chat ID الخاص بالمشرف لاستقبال طلبات المراجعة
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID || 'YOUR_ADMIN_CHAT_ID_HERE',
  
  // رابط قاعدة بيانات فايربيز RTDB
  FIREBASE_DB_URL: 'https://elmanzla-default-rtdb.firebaseio.com',
  
  // النطاق الرسمي للدليل
  SITE_DOMAIN: 'https://dalilmanzala.com'
};

const TELEGRAM_API = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}`;

/**
 * دالة إرسال رسالة لتليجرام مع لوحة أزرار تفاعلية (Inline Keyboard)
 */
export async function sendTelegramMessage(chatId, text, inlineKeyboard = null) {
  try {
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    };

    if (inlineKeyboard) {
      body.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    return await res.json();
  } catch (err) {
    console.error('[TelegramBot] Error sending message:', err.message);
    return null;
  }
}

/**
 * دالة تعديل رسالة تليجرام عند اتخاذ قرار (الموافقة أو الرفض)
 */
export async function editTelegramMessage(chatId, messageId, newText, inlineKeyboard = null) {
  try {
    const body = {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'HTML'
    };

    if (inlineKeyboard) {
      body.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const res = await fetch(`${TELEGRAM_API}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    return await res.json();
  } catch (err) {
    console.error('[TelegramBot] Error editing message:', err.message);
  }
}

/**
 * دالة الإجابة على النقر (Callback Query Answer)
 */
export async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
  try {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
      })
    });
  } catch (_) {}
}

/**
 * إشعار المشرف بتقرير أو خبر جديد ينتظر المراجعة
 */
export async function notifyAdminNewLiveReport(report) {
  if (!CONFIG.BOT_TOKEN || CONFIG.BOT_TOKEN.includes('YOUR_')) {
    console.log('[TelegramBot] Bot Token not configured yet. Skipping broadcast.');
    return;
  }

  const categoryIcons = {
    jobs_vacant: '💼 وظيفة شاغرة',
    jobs_seeker: '🧑‍💼 باحث عن عمل',
    atm: '🏧 ماكينة صراف ATM',
    traffic: '🚧 حالة الطرق والازدحام',
    offers: '🛒 عروض وتخفيضات',
    food: '🍔 مطاعم ومأكولات',
    openings: '🏪 افتتاح جديد',
    events: '🎉 مناسبات',
    general: '🔥 خبر محلي'
  };

  const catLabel = categoryIcons[report.category] || '📢 خبر عام';

  const messageText = `
🚨 <b>طلب نشر خبر / تحديث جديد في (يحدث الآن)</b>
━━━━━━━━━━━━━━━━━━━━
📌 <b>العنوان:</b> ${escapeHtml(report.title)}
📍 <b>المكان:</b> ${escapeHtml(report.location)} (<b>${escapeHtml(report.city || 'المنزلة والمطرية')}</b>)
🏷️ <b>التصنيف:</b> ${catLabel}
👤 <b>المرسل:</b> ${escapeHtml(report.userName || 'مواطن')}
${report.phone ? `📞 <b>الهاتف/واتساب:</b> <code>${escapeHtml(report.phone)}</code>\n` : ''}
${report.details ? `📝 <b>التفاصيل:</b> <i>${escapeHtml(report.details)}</i>\n` : ''}
━━━━━━━━━━━━━━━━━━━━
⏳ <i>يرجى اتخاذ إجراء بالموافقة أو الرفض:</i>
  `.trim();

  const keyboard = [
    [
      { text: '✅ موافقة ونشر فوري', callback_data: `approve_${report.id}` },
      { text: '❌ رفض وحذف', callback_data: `reject_${report.id}` }
    ],
    [
      { text: '🌐 فتح قسم يحدث الآن', url: `${CONFIG.SITE_DOMAIN}/now.html` },
      { text: '👑 لوحة الإدارة', url: `${CONFIG.SITE_DOMAIN}/admin.html?section=live-news` }
    ]
  ];

  return await sendTelegramMessage(CONFIG.ADMIN_CHAT_ID, messageText, keyboard);
}

/**
 * جلب الأخبار المعلقة من فايربيز
 */
async function fetchPendingReportsFromFirebase() {
  try {
    const res = await fetch(`${CONFIG.FIREBASE_DB_URL}/liveNews.json`);
    const data = await res.json();
    if (!data) return [];

    return Object.entries(data)
      .map(([id, item]) => ({ id, ...item }))
      .filter(item => item.status === 'pending' && item.status !== 'deleted')
      .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  } catch (err) {
    console.error('[TelegramBot] Firebase read error:', err.message);
    return [];
  }
}

/**
 * تحديث حالة الخبر في فايربيز (الموافقة أو الرفض)
 */
async function updateNewsStatusInFirebase(newsId, newStatus) {
  try {
    const updates = {
      status: newStatus,
      updatedAt: Date.now()
    };
    if (newStatus === 'published') {
      updates.publishedAt = Date.now();
    } else if (newStatus === 'deleted') {
      updates.deletedAt = Date.now();
    }

    await fetch(`${CONFIG.FIREBASE_DB_URL}/liveNews/${newsId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    return true;
  } catch (err) {
    console.error('[TelegramBot] Firebase update error:', err.message);
    return false;
  }
}

/**
 * معالج استجابة أزرار تليجرام التفاعلية (Inline Buttons)
 */
async function handleCallbackQuery(callbackQuery) {
  const queryId = callbackQuery.id;
  const data = callbackQuery.data;
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  if (data.startsWith('approve_')) {
    const newsId = data.replace('approve_', '');
    const ok = await updateNewsStatusInFirebase(newsId, 'published');

    if (ok) {
      await answerCallbackQuery(queryId, '✅ تم اعتماد الخبر ونشره فوراً على الموقع والهواتف!', true);
      const updatedText = message.text + '\n\n✅ <b>تم النشر بنجاح بواسطة الإدارة عبر تليجرام 🚀</b>';
      await editTelegramMessage(chatId, messageId, updatedText, [
        [{ text: '👁️ مشاهدة الخبر في الموقع', url: `${CONFIG.SITE_DOMAIN}/now.html` }]
      ]);
    } else {
      await answerCallbackQuery(queryId, '⚠️ حدث خطأ أثناء النشر، تأكد من اتصال قاعدة البيانات.');
    }
  } else if (data.startsWith('reject_')) {
    const newsId = data.replace('reject_', '');
    const ok = await updateNewsStatusInFirebase(newsId, 'deleted');

    if (ok) {
      await answerCallbackQuery(queryId, '❌ تم رفض الخبر وحذفه نهائياً.', true);
      const updatedText = message.text + '\n\n❌ <b>تم رفض هذا الخبر وحذفه من قبل الإدارة</b>';
      await editTelegramMessage(chatId, messageId, updatedText, []);
    } else {
      await answerCallbackQuery(queryId, '⚠️ حدث خطأ أثناء الحذف.');
    }
  }
}

/**
 * معالج أوامر تليجرام النصية (/start, /pending, /stats, إلخ)
 */
async function handleTextMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (text.startsWith('/start')) {
    const welcome = `
👋 <b>أهلاً بك في بوت إدارة دليل المنزلة والمطرية الرقمي</b>

هذا البوت مخصص لإدارة واعتماد الأخبار الحية والفرص الوظيفية في قسم (يحدث الآن):

📌 <b>الأوامر المتاحة:</b>
• <code>/pending</code> - استعراض الأخبار التي تنتظر المراجعة والاعتماد
• <code>/stats</code> - إحصائيات سريعة عن الدليل
• <code>/help</code> - شرح كيفية العمل

<i>سيصلك إشعار فوري هنا بأي خبر أو وظيفة جديدة يتم إضافتها من قبل المواطنين مع أزرار الموافقة والرفض.</i>
    `.trim();
    await sendTelegramMessage(chatId, welcome);
  } else if (text.startsWith('/pending')) {
    const pendingList = await fetchPendingReportsFromFirebase();
    if (!pendingList.length) {
      await sendTelegramMessage(chatId, '🎉 <b>لا توجد أخبار تنتظر المراجعة حالياً!</b>\nكل التحديثات معتمدة ومنشورة.');
      return;
    }

    await sendTelegramMessage(chatId, `📋 <b>يوجد (${pendingList.length}) خبر/تقرير ينتظر مراجعتك:</b>`);

    for (const report of pendingList) {
      await notifyAdminNewLiveReport(report);
    }
  } else if (text.startsWith('/stats')) {
    try {
      const [placesRes, newsRes] = await Promise.all([
        fetch(`${CONFIG.FIREBASE_DB_URL}/places.json`).then(r => r.json()),
        fetch(`${CONFIG.FIREBASE_DB_URL}/liveNews.json`).then(r => r.json())
      ]);

      const placesCount = placesRes ? Object.keys(placesRes).length : 0;
      const newsList = newsRes ? Object.values(newsRes) : [];
      const publishedNews = newsList.filter(n => n.status === 'published').length;
      const pendingNews = newsList.filter(n => n.status === 'pending').length;

      const statsMsg = `
📊 <b>إحصائيات دليل المنزلة والمطرية الحالية:</b>
━━━━━━━━━━━━━━━━━━━━
🏪 إجمالي الأماكن والأنشطة: <b>${placesCount} مكان</b>
🔥 الأخبار المنشورة في يحدث الآن: <b>${publishedNews} خبر</b>
⏳ الأخبار المعلقة قيد المراجعة: <b>${pendingNews} خبر</b>
🌐 الموقع الرسمي: <a href="${CONFIG.SITE_DOMAIN}">${CONFIG.SITE_DOMAIN}</a>
      `.trim();
      await sendTelegramMessage(chatId, statsMsg);
    } catch (_) {
      await sendTelegramMessage(chatId, '⚠️ تعذر جلب الإحصائيات حالياً.');
    }
  }
}

/**
 * تشغيل Long Polling لاستقبال رسائل ونقرات البوت
 */
export async function startTelegramBotPolling() {
  if (!CONFIG.BOT_TOKEN || CONFIG.BOT_TOKEN.includes('YOUR_')) {
    console.log('⚠️ [TelegramBot] يرجي تعيين BOT_TOKEN و ADMIN_CHAT_ID في الملف telegram-moderator.mjs لبدء استقبال التنبيهات.');
    return;
  }

  console.log('🤖 [TelegramBot] البوت يعمل الآن بنجاح ومستعد لاستقبال التنبيهات والأوامر...');
  let offset = 0;

  while (true) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=25`);
      const data = await res.json();

      if (data.ok && data.result) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          if (update.message && update.message.text) {
            await handleTextMessage(update.message);
          } else if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
          }
        }
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// تشغيل البوت عند تنفيذ الملف مباشرة
if (process.argv[1]?.includes('telegram-moderator.mjs')) {
  startTelegramBotPolling();
}

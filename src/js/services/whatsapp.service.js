/**
 * whatsapp.service.js
 * Universal Smart WhatsApp Link Generator with Deep Context & Source Tracking
 * Ensures all numbers conform to 201xxxxxxxxx format and includes platform branding:
 * دليل المنزلة والمطرية الرقمي
 * https://dalilmanzala.com/
 */

export function cleanEgyptianPhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('201') && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith('00201') && cleaned.length === 14) return cleaned.slice(2);
  if (cleaned.startsWith('01') && cleaned.length === 11) return '2' + cleaned;
  if (cleaned.startsWith('1') && cleaned.length === 10) return '20' + cleaned;
  if (cleaned.startsWith('21') && cleaned.length === 11) return '20' + cleaned.slice(1);
  return cleaned.startsWith('0') ? '2' + cleaned : cleaned;
}

/**
 * Builds an intelligent, source-aware WhatsApp contact link
 * @param {string} phone
 * @param {object} options
 */
export function buildContextualWhatsAppLink(phone, options = {}) {
  const cleanPhone = cleanEgyptianPhone(phone);
  if (!cleanPhone) return '';

  const {
    source = 'general',
    placeName = '',
    offerTitle = '',
    productName = '',
    jobTitle = '',
    price = '',
    placeSlug = ''
  } = options;

  let msg = '';
  // Clean short friendly URL without random hash suffix
  const cleanShort = placeSlug ? String(placeSlug).replace(/-[a-z0-9_]{5,7}$/i, '') : '';
  const placeLink = cleanShort ? `https://dalilmanzala.com/${encodeURIComponent(cleanShort)}` : (placeSlug ? `https://dalilmanzala.com/${encodeURIComponent(placeSlug)}` : 'https://dalilmanzala.com/');

  switch (source) {
    case 'voice_assistant':
      msg = `السلام عليكم ورحمة الله\nلقد عثرت عليك من خلال المساعد الصوتي الذكي في:\n🛡️ دليل المنزلة والمطرية الرقمي\n🌐 https://dalilmanzala.com/\n\nأود الاستفسار عن خدماتكم المتاحة وأوقات العمل.`;
      break;

    case 'offer':
      msg = `السلام عليكم ورحمة الله\nلقد وجدت هذا العرض (${offerTitle || 'عرض خاص'})${price ? ` بسعر ${price} ج.م` : ''}${placeName ? ` لدى ${placeName}` : ''} على:\n🛡️ دليل المنزلة والمطرية الرقمي\n🌐 ${placeLink}\n\nأود الاستفسار عن تفاصيل العرض وكيفية الاستفادة منه.`;
      break;

    case 'product':
      msg = `السلام عليكم ورحمة الله\nلقد وجدت هذا المنتج (${productName || 'منتج'})${price ? ` بسعر ${price} ج.م` : ''}${placeName ? ` لدى ${placeName}` : ''} على:\n🛡️ دليل المنزلة والمطرية الرقمي\n🌐 ${placeLink}\n\nأود حجز المنتج أو الاستفسار عن توفره.`;
      break;

    case 'job_pulse':
      msg = `السلام عليكم ورحمة الله\nبخصوص إعلان الوظيفة (${jobTitle || 'فرصة عمل'})${placeName ? ` لدى ${placeName}` : ''}\nالمعروض عبر قسم النبض المباشر في:\n🛡️ دليل المنزلة والمطرية الرقمي\n🌐 https://dalilmanzala.com/\n\nأود التقدم لهذه الفرصة ومناقشة التفاصيل.`;
      break;

    case 'place_page':
      msg = `السلام عليكم ورحمة الله\nلقد عثرت على نشاطكم (${placeName || 'مكانكم الموقر'})\nمن خلال صفحتكم في:\n🛡️ دليل المنزلة والمطرية الرقمي\n🌐 ${placeLink}\n\nأود الاستفسار عن خدماتكم ومواعيد العمل.`;
      break;

    case 'place_card':
      msg = `السلام عليكم ورحمة الله\nلقد عثرت على (${placeName || 'نشاطكم'})\nمن خلال دليل المنزلة والمطرية الرقمي\n🌐 ${placeLink}\n\nأود التواصل والاستفسار من حضراتكم.`;
      break;

    default:
      msg = `السلام عليكم ورحمة الله\nلقد عثرت عليك من خلال:\n🛡️ دليل المنزلة والمطرية الرقمي\n🌐 https://dalilmanzala.com/\n\nأود الاستفسار عن خدماتكم.`;
      break;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

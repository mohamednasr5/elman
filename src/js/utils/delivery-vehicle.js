/**
 * Delivery & Transport Vehicles Metadata & Heuristics
 * دقة تمييز وتحديد وسيلة النقل والتوصيل (توكتوك، موتوسيكل، عربية، تاكسي، باص، ربع نقل، وغيرها)
 */

export const DELIVERY_VEHICLES = {
  tuktuk: {
    key: 'tuktuk',
    name: 'توكتوك',
    label: 'توكتوك مشاوير',
    icon: '🛺',
    color: '#D97706',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    glowColor: 'rgba(245, 158, 11, 0.25)'
  },
  motorcycle: {
    key: 'motorcycle',
    name: 'موتوسيكل',
    label: 'موتوسيكل دليفري',
    icon: '🏍️',
    color: '#DC2626',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    glowColor: 'rgba(239, 68, 68, 0.25)'
  },
  taxi: {
    key: 'taxi',
    name: 'تاكسي',
    label: 'تاكسي توصيل',
    icon: '🚕',
    color: '#CA8A04',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
    glowColor: 'rgba(234, 179, 8, 0.25)'
  },
  car: {
    key: 'car',
    name: 'سيارة ملاكي',
    label: 'سيارة مشاوير ورحلات',
    icon: '🚗',
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: 'rgba(37, 99, 235, 0.35)',
    glowColor: 'rgba(37, 99, 235, 0.25)'
  },
  van: {
    key: 'van',
    name: 'عربية فان / 7 راكب',
    label: 'عربية رحلات ومطار',
    icon: '🚐',
    color: '#0284C7',
    bgColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: 'rgba(2, 132, 199, 0.35)',
    glowColor: 'rgba(2, 132, 199, 0.25)'
  },
  bus: {
    key: 'bus',
    name: 'أتوبيس / باص',
    label: 'أتوبيس رحلات وجامعات',
    icon: '🚌',
    color: '#0D9488',
    bgColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: 'rgba(13, 148, 136, 0.35)',
    glowColor: 'rgba(13, 148, 136, 0.25)'
  },
  courier: {
    key: 'courier',
    name: 'دليفري وتوصيل طلبات',
    label: 'توصيل طلبات ودليفري',
    icon: '🛵',
    color: '#059669',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    glowColor: 'rgba(16, 185, 129, 0.25)'
  },
  pickup_quarter: {
    key: 'pickup_quarter',
    name: 'عربية ربع نقل',
    label: 'عربية ربع نقل',
    icon: '🛻',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: 'rgba(124, 58, 237, 0.35)',
    glowColor: 'rgba(124, 58, 237, 0.25)'
  },
  pickup_half: {
    key: 'pickup_half',
    name: 'عربية نص نقل',
    label: 'عربية نص نقل',
    icon: '🚚',
    color: '#9333EA',
    bgColor: 'rgba(147, 51, 234, 0.15)',
    borderColor: 'rgba(147, 51, 234, 0.35)',
    glowColor: 'rgba(147, 51, 234, 0.25)'
  },
  truck_heavy: {
    key: 'truck_heavy',
    name: 'عربية نقل كبير',
    label: 'نقل ثقيل وشحن',
    icon: '🚛',
    color: '#475569',
    bgColor: 'rgba(71, 85, 105, 0.15)',
    borderColor: 'rgba(71, 85, 105, 0.35)',
    glowColor: 'rgba(71, 85, 105, 0.25)'
  },
  loader: {
    key: 'loader',
    name: 'لودر وجرار',
    label: 'لودر ومعدات نقل',
    icon: '🚜',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.15)',
    borderColor: 'rgba(234, 88, 12, 0.35)',
    glowColor: 'rgba(234, 88, 12, 0.25)'
  },
  cart_donkey: {
    key: 'cart_donkey',
    name: 'عربية بحمار',
    label: 'كارو محلي',
    icon: '🫏',
    color: '#78350F',
    bgColor: 'rgba(120, 53, 15, 0.15)',
    borderColor: 'rgba(120, 53, 15, 0.35)',
    glowColor: 'rgba(120, 53, 15, 0.25)'
  },
  cart_horse: {
    key: 'cart_horse',
    name: 'عربية بحصان',
    label: 'عربية بحصان',
    icon: '🐎',
    color: '#92400E',
    bgColor: 'rgba(146, 64, 14, 0.15)',
    borderColor: 'rgba(146, 64, 14, 0.35)',
    glowColor: 'rgba(146, 64, 14, 0.25)'
  }
};

/**
 * دالة استنتاج وسيلة النقل والتوصيل بدقة عالية من بيانات المكان
 * @param {Object|string} placeOrType
 * @returns {Object} بيانات وسيلة النقل مع الأيقونة واللون والنص
 */
export function resolveDeliveryVehicle(placeOrType) {
  if (!placeOrType) return DELIVERY_VEHICLES.courier;

  // إذا تم تمرير مفتاح الوسيلة مباشرة كسلسلة نصية
  if (typeof placeOrType === 'string') {
    const key = placeOrType.trim().toLowerCase();
    if (DELIVERY_VEHICLES[key]) return DELIVERY_VEHICLES[key];
  }

  const place = typeof placeOrType === 'object' ? placeOrType : {};

  // 1. فحص إذا كان محدد نوع التوصيل صراحة في الحقل deliveryType
  const explicitType = String(place.deliveryType || '').trim().toLowerCase();
  if (explicitType && DELIVERY_VEHICLES[explicitType]) {
    return DELIVERY_VEHICLES[explicitType];
  }

  // 2. تحليل الكلمات المفتاحية بالاسم والوصف والخدمات
  const text = [
    place.name || '',
    place.description || '',
    place.customCategory || '',
    place.subcategory_id || place.subcategoryId || '',
    place.slug || '',
    Array.isArray(place.services) ? place.services.join(' ') : (place.services_json || '')
  ].join(' ').toLowerCase();

  // توكتوك
  if (/توكتوك|توك\s*توك|تكتك|تكاكتك|tuktuk|toktok/i.test(text)) {
    return DELIVERY_VEHICLES.tuktuk;
  }

  // تاكسي
  if (/تاكسي|تاكس|كاب|taxi|cab/i.test(text)) {
    return DELIVERY_VEHICLES.taxi;
  }

  // أتوبيس / باص / ميكروباص / سرفيس / جامعات
  if (/اتوبيس|أتوبيس|باص|ميكروباص|ميكروباصات|سرفيس|جامعات|بورفؤاد|bus|microbus|minibus/i.test(text)) {
    return DELIVERY_VEHICLES.bus;
  }

  // عربية فان / شانجي / سوزوكي فان / 7 راكب
  if (/شانجي|سوزوكي\s*فان|فان\b|m50|shangy|suzuki/i.test(text)) {
    return DELIVERY_VEHICLES.van;
  }

  // ربع نقل / دبابة / بيك اب
  if (/ربع\s*نقل|عربية\s*ربع|دبابة|بيك\s*اب/i.test(text)) {
    return DELIVERY_VEHICLES.pickup_quarter;
  }

  // نص نقل / نقل عفش
  if (/نص\s*نقل|عربية\s*نص|عفش|نقل\s*عفش/i.test(text)) {
    return DELIVERY_VEHICLES.pickup_half;
  }

  // نقل ثقيل / تريلا / قلاب / شاحنة
  if (/نقل\s*ثقيل|تريلا|قلاب|شاحنة/i.test(text)) {
    return DELIVERY_VEHICLES.truck_heavy;
  }

  // لودر / جرار
  if (/لودر|جرار|حفار|loader|tractor/i.test(text)) {
    return DELIVERY_VEHICLES.loader;
  }

  // عربة بحمار / عربة بحصان / كارو
  if (/عربة\s*بحمار|كارو\s*حمار/i.test(text)) {
    return DELIVERY_VEHICLES.cart_donkey;
  }
  if (/عربة\s*بحصان|كارو/i.test(text)) {
    return DELIVERY_VEHICLES.cart_horse;
  }

  // سيارة ملاكي / عربية مشاوير خاصة
  if (/عربية|سيارة|ملاكي|مشاوير\s*خاصة|سيارات|car/i.test(text)) {
    return DELIVERY_VEHICLES.car;
  }

  // موتوسيكل / سكوتر / بايك / طيار
  if (/موتوسيكل|موتوسيكلات|سكوتر|بايك|طيار|دراجة\s*نارية|motorcycle|scooter|bike/i.test(text)) {
    return DELIVERY_VEHICLES.motorcycle;
  }

  // تطبيق وصلي / دليفري طلبات / شحن
  if (/وصلي|طلبات|توصيل\s*طلبات|دليفري|هايبر\s*وصلي|شحن|طرود/i.test(text)) {
    return DELIVERY_VEHICLES.courier;
  }

  // الافتراضي للأنشطة غير المحددة
  return DELIVERY_VEHICLES.courier;
}

function cleanRootWords(text) {
  if (!text) return '';
  return normalizeArabic(text)
    .split(/\s+/)
    .map(w => {
      let word = w;
      if (word.startsWith('و') && word.length > 3) word = word.slice(1);
      if (word.startsWith('ال') && word.length > 3) word = word.slice(2);
      return word;
    })
    .join(' ');
}

/**
 * specialty.js
 * Comprehensive Medical Specialty & Professional Classifier for Doctors, Clinics, and Services
 */

import { normalizeArabic } from './arabic.js';

export const MEDICAL_SPECIALTY_MAP = [
  {
    key: 'general_surgery',
    keywords: ['جراحة عامة', 'جراحه عامه', 'جراح عام', 'مناظير جراحية', 'جراحة البطن', 'فتق', 'مرارة', 'بواسير', 'استئصال اورام', 'اورام'],
    title: 'دكتور جراحة عامة',
    label: 'استشاري الجراحة العامة والمناظير والأورام',
    shortLabel: 'الجراحة العامة والمناظير',
    icon: '⚕️'
  },
  {
    key: 'vascular_surgery',
    keywords: ['اوعية دموية', 'أوعية دموية', 'اوعيه دمويه', 'أوعيه دمويه', 'قدم سكري', 'قدم سكرى', 'دوالي', 'دوالى', 'شرايين', 'قسطرة طرفية', 'جراحة اوعية دموية'],
    title: 'دكتور جراحة أوعية دموية',
    label: 'استشاري جراحة الأوعية الدموية والقدم السكري والدوالي',
    shortLabel: 'جراحة الأوعية الدموية والقدم السكري',
    icon: '🩸'
  },
  {
    key: 'dental',
    keywords: ['اسنان', 'أسنان', 'سنان', 'فم', 'جراحة الفم', 'جراحة الفم والاسنان', 'طب وجراحة الفم', 'تجميل الاسنان', 'تجميل الأسنان', 'زراعة الاسنان', 'تقويم الاسنان', 'ضروس', 'حشو', 'خلع ضرس', 'الكوش', 'كوش'],
    title: 'دكتور أسنان',
    label: 'أخصائي طب وجراحة الفم وتجميل وزراعة الأسنان',
    shortLabel: 'طب وتجميل الأسنان',
    icon: '🦷'
  },
  {
    key: 'ophthalmology',
    keywords: ['عيون', 'رمد', 'بصريات', 'ليزك', 'شبكية', 'قرنية', 'مياه بيضاء', 'مياه زرقاء', 'نظارات'],
    title: 'دكتور عيون',
    label: 'استشاري طب وجراحة العيون والرمد والليزك',
    shortLabel: 'طب وجراحة العيون',
    icon: '👁️'
  },
  {
    key: 'pediatrics',
    keywords: ['اطفال', 'أطفال', 'مبتسرين', 'حديثي الولادة', 'تغذية علاجية اطفال', 'تطعيمات', 'رضع'],
    title: 'دكتور أطفال',
    label: 'أخصائي طب الأطفال وحديثي الولادة والمبتسرين',
    shortLabel: 'طب الأطفال وحديثي الولادة',
    icon: '👶'
  },
  {
    key: 'internal_medicine',
    keywords: ['باطنه', 'باطنة', 'كبد', 'سكر', 'جهاز هضمي', 'حميات', 'مناظير جهاز هضمي', 'كلى وباطنة', 'غدد صماء'],
    title: 'دكتور باطنة',
    label: 'استشاري أمراض الباطنة والجهاز الهضمي والسكر والكبد',
    shortLabel: 'أمراض الباطنة والسكر والجهاز الهضمي',
    icon: '🩺'
  },
  {
    key: 'orthopedics',
    keywords: ['عظام', 'مفاصل', 'كسور', 'عمود فقري', 'غضروف', 'مفصل الركبة', 'تشوهات عظام', 'مناظير مفاصل', 'جبيرة'],
    title: 'دكتور عظام',
    label: 'استشاري جراحة العظام والمفاصل والعمود الفقري والكسور',
    shortLabel: 'جراحة العظام والمفاصل والكسور',
    icon: '🦴'
  },
  {
    key: 'gynecology',
    keywords: ['نساء', 'توليد', 'عقم', 'حقن مجهري', 'سونار جنين', 'حمل ولادة', 'اورام نساء', 'تاخر انجاب', 'تأخر إنجاب'],
    title: 'دكتور نساء وتوليد',
    label: 'استشاري أمراض النساء والتوليد وتأخر الإنجاب والحقن المجهري',
    shortLabel: 'النساء والتوليد وتأخر الإنجاب',
    icon: '🤰'
  },
  {
    key: 'dermatology',
    keywords: ['جلديه', 'جلدية', 'دكتور جلدية', 'طبيب جلدية', 'عيادة جلدية', 'امراض جلدية', 'امراض ذكورة وتناسلية', 'تناسلية وعقم', 'بوتوكس', 'فيلر'],
    title: 'دكتور جلدية',
    label: 'استشاري الأمراض الجلدية والتجميل والليزر',
    shortLabel: 'الجلدية والتجميل والليزر',
    icon: '✨'
  },
  {
    key: 'ent',
    keywords: ['انف', 'أنف', 'اذن', 'أذن', 'حنجرة', 'حنجره', 'جيوب انفية', 'لحمية', 'سمعيات', 'اتزان'],
    title: 'دكتور أنف وأذن وحنجرة',
    label: 'استشاري جراحة الأنف والأذن والحنجرة ومناظير الجيوب الأنفية',
    shortLabel: 'الأنف والأذن والحنجرة',
    icon: '👂'
  },
  {
    key: 'cardiology',
    keywords: ['قلب', 'قسطرة', 'ضغط الدم', 'شرايين القلب', 'ايكو', 'رسم قلب'],
    title: 'دكتور قلب',
    label: 'استشاري أمراض القلب والأوعية الدموية والقسطرة التداخلية',
    shortLabel: 'أمراض القلب والأوعية الدموية',
    icon: '❤️'
  },
  {
    key: 'neurology',
    keywords: ['مخ', 'اعصاب', 'أعصاب', 'نفسية', 'طب نفسي', 'صرع', 'جلطات مخية', 'عمود فقري مخ واعصاب'],
    title: 'دكتور مخ وأعصاب',
    label: 'استشاري المخ والأعصاب والطب النفسي',
    shortLabel: 'المخ والأعصاب والعمود الفقري',
    icon: '🧠'
  },
  {
    key: 'urology',
    keywords: ['مسالك', 'مسالك بولية', 'كلى', 'حصوات', 'بروستاتا', 'ذكورة وعقم', 'مناظير مسالك'],
    title: 'دكتور مسالك بولية',
    label: 'استشاري جراحة المسالك البولية والكلى والذكورة والعقم',
    shortLabel: 'المسالك البولية والكلى والذكورة',
    icon: '🔬'
  },
  {
    key: 'physiotherapy',
    keywords: ['علاج طبيعي', 'تاهيل', 'تأهيل', 'كايروبراكتيك', 'سمنة ونحافة', 'اصابات ملاعب', 'تغذية علاجية'],
    title: 'دكتور علاج طبيعي',
    label: 'أخصائي العلاج الطبيعي والتأهيل الحركي وإصابات الملاعب',
    shortLabel: 'العلاج الطبيعي والتأهيل الحركي',
    icon: '🏃'
  },
  {
    key: 'pulmonology',
    keywords: ['صدر', 'صدرية', 'حساسية', 'ربو', 'تنفسي', 'مناعة'],
    title: 'دكتور صدرية',
    label: 'استشاري الأمراض الصدرية والحساسية والجهاز التنفسي',
    shortLabel: 'الأمراض الصدرية والحساسية',
    icon: '🫁'
  },
  {
    key: 'phoniatrics',
    keywords: ['تخاطب', 'نطق', 'صوت', 'تعديل سلوك', 'توحد', 'تنمية مهارات', 'صعوبات تعلم'],
    title: 'أخصائي تخاطب',
    label: 'أخصائي التخاطب وتنمية المهارات وتعديل السلوك',
    shortLabel: 'التخاطب وتنمية المهارات',
    icon: '🗣️'
  },
  {
    key: 'lab',
    keywords: ['معمل', 'تحاليل', 'مختبر', 'دم', 'فحوصات طبية', 'وظائف كبد', 'جينات'],
    title: 'معمل تحاليل',
    label: 'التحاليل الطبية والفحوصات المعملية الشاملة',
    shortLabel: 'معمل تحاليل طبية',
    icon: '🧪'
  },
  {
    key: 'radiology',
    keywords: ['اشعة', 'أشعة', 'سونار', 'اشعة مقطعية', 'رنين مغناطيسي', 'دوبلر', 'بانوراما'],
    title: 'مركز أشعة',
    label: 'مركز الأشعة التشخيصية والموجات الصوتية والرنين',
    shortLabel: 'مركز أشعة وتشخيص',
    icon: '🩻'
  }
];

export function resolveDoctorSpecialty(place = {}, category = {}) {
  const catSlug = (category.slug || place.categoryId || '').toLowerCase();
  const catName = (category.name || place.categoryName || '').toLowerCase();
  const placeNameNorm = normalizeArabic(place.name || '');

  // Strict check: Is this place truly a Doctor / Clinic / Medical Center / Hospital?
  const isDoctorCategory = catSlug.includes('doctor') || catSlug.includes('clinic') || catName.includes('دكتور') || catName.includes('طبيب') || catName.includes('عياد') || catName.includes('مستشف');
  const hasDoctorTitleInName = placeNameNorm.includes('دكتور') || placeNameNorm.includes('طبيب') || placeNameNorm.includes('عيادة') || placeNameNorm.includes('استشاري') || placeNameNorm.includes('اخصائي') || placeNameNorm.includes('جراح');

  const customSpecialty = place.customSpecialty || place.doctorSpecialty || place.specialty || place.medicalSpecialty || '';

  // If it is NOT a doctor category and does not have a doctor title in its name, it's a store/company/service, NOT a medical doctor!
  if (!isDoctorCategory && !hasDoctorTitleInName && !place.doctorSpecialty && !place.medicalSpecialty) {
    return {
      isDoctor: false,
      specialtyKey: null,
      specialtyTitle: null,
      specialtyLabel: null,
      shortLabel: null,
      icon: null
    };
  }

  const searchSource = [
    place.name || '',
    customSpecialty,
    place.description || '',
    Array.isArray(place.services) ? place.services.join(' ') : (place.services || ''),
    place.customCategory || ''
  ].join(' ');

  const normalizedSource = normalizeArabic(searchSource);

  // 1. If explicit medicalSpecialty or doctorSpecialty is specified on the place:
  if (customSpecialty && customSpecialty.trim()) {
    const normSpec = normalizeArabic(customSpecialty);
    const rootSpec = cleanRootWords(customSpecialty);
    
    // Find best match prioritizing longest keyword match
    let bestMatch = null;
    let maxKwLength = 0;
    for (const item of MEDICAL_SPECIALTY_MAP) {
      for (const kw of item.keywords) {
        const normKw = normalizeArabic(kw);
        const rootKw = cleanRootWords(kw);
        if ((normSpec.includes(normKw) || rootSpec.includes(rootKw)) && normKw.length > maxKwLength) {
          maxKwLength = normKw.length;
          bestMatch = item;
        }
      }
    }
    
    if (bestMatch) {
      return {
        isDoctor: true,
        specialtyKey: bestMatch.key,
        specialtyTitle: bestMatch.title,
        specialtyLabel: customSpecialty.trim().startsWith('استشاري') || customSpecialty.trim().startsWith('أخصائي') 
          ? customSpecialty.trim() 
          : bestMatch.label,
        shortLabel: bestMatch.shortLabel,
        icon: bestMatch.icon
      };
    }

    // If explicit specialty is written but not in taxonomy, display it cleanly!
    return {
      isDoctor: true,
      specialtyKey: 'custom_doctor',
      specialtyTitle: customSpecialty.trim(),
      specialtyLabel: customSpecialty.trim(),
      shortLabel: customSpecialty.trim(),
      icon: '🩺'
    };
  }

  // 2. Scan text for medical specialty keywords with specificity scoring (longest phrase wins)
  let bestCandidate = null;
  let maxScore = 0;

  const rootSource = cleanRootWords(searchSource);
  for (const item of MEDICAL_SPECIALTY_MAP) {
    for (const kw of item.keywords) {
      const normKw = normalizeArabic(kw);
      const rootKw = cleanRootWords(kw);
      if (normalizedSource.includes(normKw) || (rootKw.length >= 3 && rootSource.includes(rootKw))) {
        const score = normKw.length * (normKw.includes(' ') ? 3 : 1);
        if (score > maxScore) {
          maxScore = score;
          bestCandidate = item;
        }
      }
    }
  }

  if (bestCandidate) {
    return {
      isDoctor: true,
      specialtyKey: bestCandidate.key,
      specialtyTitle: bestCandidate.title,
      specialtyLabel: bestCandidate.label,
      shortLabel: bestCandidate.shortLabel,
      icon: bestCandidate.icon
    };
  }

  if (isDoctorCategory || hasDoctorTitleInName) {
    return {
      isDoctor: true,
      specialtyKey: 'general_doctor',
      specialtyTitle: 'طبيب بشري وعيادة',
      specialtyLabel: 'عيادة طبية متخصصة',
      shortLabel: 'طبيب بشري',
      icon: '🩺'
    };
  }

  return {
    isDoctor: false,
    specialtyKey: null,
    specialtyTitle: null,
    specialtyLabel: null,
    shortLabel: null,
    icon: null
  };
}

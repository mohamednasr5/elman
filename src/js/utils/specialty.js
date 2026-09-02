/**
 * specialty.js
 * Comprehensive Medical Specialty & Professional Classifier for Doctors, Clinics, and Services
 */

import { normalizeArabic } from './arabic.js';

export const MEDICAL_SPECIALTY_MAP = [
  {
    key: 'dental',
    keywords: ['اسنان', 'أسنان', 'فم', 'تجميل الاسنان', 'تجميل الأسنان', 'زراعة الاسنان', 'تقويم الاسنان', 'ضروس', 'حشو', 'الكوش', 'كوش'],
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
    keywords: ['عظام', 'مفاصل', 'كسور', 'عمود فقري', 'غضروف', 'مفصل الركبة', 'تشوهات عظام', 'مناظير مفاصل'],
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
    keywords: ['جلديه', 'جلدية', 'تجميل', 'ليزر', 'بشرة', 'شعر', 'بوتوكس', 'فيلر', 'تناسلية', 'امراض ذكورة وتناسلية'],
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
    keywords: ['قلب', 'اوعية دموية', 'أوعية دموية', 'قسطرة', 'ضغط الدم', 'شرايين', 'ايكو', 'رسم قلب'],
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
    key: 'surgery',
    keywords: ['جراحة عامة', 'جراحه عامه', 'اورام', 'أورام', 'مناظير جراحية', 'فتق', 'مرارة', 'بواسير'],
    title: 'دكتور جراحة عامة',
    label: 'استشاري الجراحة العامة والمناظير والأورام',
    shortLabel: 'الجراحة العامة والمناظير',
    icon: '⚕️'
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
  const isDoctorCategory = catSlug.includes('doctor') || catSlug.includes('clinic') || catName.includes('دكتور') || catName.includes('طبيب') || catName.includes('عياد');

  const rawText = [
    place.name || '',
    place.specialty || '',
    place.medicalSpecialty || '',
    place.subCategory || '',
    place.tagline || '',
    place.description || '',
    (place.services || []).join(' ')
  ].join(' ');

  const normalized = normalizeArabic(rawText).toLowerCase();

  for (const spec of MEDICAL_SPECIALTY_MAP) {
    if (spec.keywords.some(k => normalized.includes(normalizeArabic(k).toLowerCase()))) {
      return {
        isDoctor: true,
        specialtyKey: spec.key,
        specialtyTitle: spec.title,
        specialtyLabel: spec.label,
        shortLabel: spec.shortLabel,
        icon: spec.icon,
        badgeText: `${spec.icon} ${spec.title}: ${spec.label}`
      };
    }
  }

  if (isDoctorCategory) {
    const explicitSpec = place.medicalSpecialty || place.specialty || place.subCategory;
    return {
      isDoctor: true,
      specialtyKey: 'general',
      specialtyTitle: 'دكتور واستشاري',
      specialtyLabel: explicitSpec || 'استشاري وأخصائي طبي',
      shortLabel: explicitSpec || 'استشاري طبي',
      icon: '🩺',
      badgeText: `🩺 ${explicitSpec ? `تخصص: ${explicitSpec}` : 'أخصائي واستشاري طبي'}`
    };
  }

  return { isDoctor: false, specialtyKey: null, specialtyTitle: null, specialtyLabel: null, shortLabel: null, icon: null, badgeText: null };
}

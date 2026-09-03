/**
 * locations-data.js
 * Comprehensive Master Geographic Locations Database for El Manzala & El Matariya
 */

import { normalizeArabic } from './arabic.js';

export const MASTER_LOCATIONS = [
  // Centers & Cities
  { id: 'manzala-city', name: 'المنزلة', type: 'city', center: 'المنزلة', governorate: 'الدقهلية', aliases: ['مدينة المنزلة', 'مركز المنزلة', 'المنزله'] },
  { id: 'matariya-city', name: 'المطرية', type: 'city', center: 'المطرية', governorate: 'الدقهلية', aliases: ['مدينة المطرية', 'مركز المطرية', 'المطريه'] },

  // Villages of El Manzala
  { id: 'al-basrat', name: 'البصراط', type: 'village', center: 'المنزلة', aliases: ['البسراط', 'قرية البصراط'] },
  { id: 'al-aziza', name: 'العزيزة', type: 'village', center: 'المنزلة', aliases: ['العزيزه', 'قرية العزيزة'] },
  { id: 'al-nasayma', name: 'النسايمة', type: 'village', center: 'المنزلة', aliases: ['النسايمه', 'قرية النسايمة'] },
  { id: 'al-farousat', name: 'الفروسات', type: 'village', center: 'المنزلة', aliases: ['قرية الفروسات', 'الفروسات المنزلة'] },
  { id: 'mit-shareef', name: 'ميت شريف', type: 'village', center: 'المنزلة', aliases: ['ميت شريف المنزلة', 'قرية ميت شريف'] },
  { id: 'al-ahmadiya', name: 'الأحمدية', type: 'village', center: 'المنزلة', aliases: ['الاحمدية', 'الاحمديه', 'الأحمديه'] },
  { id: 'al-shoboul', name: 'الشبول', type: 'village', center: 'المنزلة', aliases: ['قرية الشبول', 'عرب الشبول'] },
  { id: 'al-houta', name: 'الحوتة', type: 'village', center: 'المنزلة', aliases: ['الحوته', 'قرية الحوتة'] },
  { id: 'al-zahraa', name: 'الزهراء', type: 'village', center: 'المنزلة', aliases: ['قرية الزهراء', 'الزهراء المنزلة'] },
  { id: 'dar-al-salam', name: 'دار السلام', type: 'village', center: 'المنزلة', aliases: ['قرية دار السلام', 'دار السلام المنزلة'] },
  { id: 'mit-khodeir', name: 'ميت خضير', type: 'village', center: 'المنزلة', aliases: ['قرية ميت خضير'] },
  { id: 'mit-marja', name: 'ميت مرجا سلسيل', type: 'village', center: 'المنزلة', aliases: ['ميت مرجا', 'ميت مرجه'] },
  { id: 'al-mawajid', name: 'المواجد', type: 'village', center: 'المنزلة', aliases: ['قرية المواجد'] },
  { id: 'bani-hilal', name: 'بني هلال', type: 'village', center: 'المنزلة', aliases: ['بن هلال', 'بني هلال المنزلة'] },
  { id: 'al-satayta', name: 'الستايتة', type: 'village', center: 'المنزلة', aliases: ['الستايته'] },
  { id: 'al-amra', name: 'العامرة', type: 'village', center: 'المنزلة', aliases: ['العامره'] },
  { id: 'kafr-hajjaj', name: 'كفر حجاج', type: 'village', center: 'المنزلة', aliases: ['كفر حجاج المنزلة'] },
  { id: 'kafr-al-basrat', name: 'كفر البصراط', type: 'village', center: 'المنزلة', aliases: ['كفر البسراط'] },
  { id: 'qunaybara', name: 'قنيبرة', type: 'village', center: 'المنزلة', aliases: ['قنيبره'] },
  { id: 'al-rawdha', name: 'الروضة', type: 'village', center: 'المنزلة', aliases: ['الروضه', 'الروضه المنزله'] },
  { id: 'al-gamaliya', name: 'الجمالية', type: 'neighboring', center: 'المنزلة', aliases: ['الجماليه', 'مدينة الجمالية'] },
  { id: 'mit-salseel', name: 'ميت سلسيل', type: 'neighboring', center: 'المنزلة', aliases: ['مدينة ميت سلسيل'] },
  { id: 'al-kourdi', name: 'الكردي', type: 'neighboring', center: 'المنزلة', aliases: ['مدينة الكردي'] },

  // Villages & Areas of El Matariya
  { id: 'al-asafra', name: 'العصافرة', type: 'village', center: 'المطرية', aliases: ['العصافره', 'قرية العصافرة'] },
  { id: 'al-dhaheer', name: 'الضهير', type: 'village', center: 'المطرية', aliases: ['قرية الضهير', 'الضهير المطرية'] },
  { id: 'awlad-sabour', name: 'أولاد صبور', type: 'village', center: 'المطرية', aliases: ['اولاد صبور', 'قرية اولاد صبور'] },
  { id: 'kafr-ragab', name: 'كفر رجب', type: 'village', center: 'المطرية', aliases: ['كفر رجب المطرية'] },
  { id: 'al-akarsha', name: 'العكارشة', type: 'village', center: 'المطرية', aliases: ['العكارشه'] },
  { id: 'al-ghasna', name: 'الغصنة', type: 'village', center: 'المطرية', aliases: ['الغصنه'] },
  { id: 'al-zaytoon', name: 'الزيتون', type: 'neighborhood', center: 'المطرية', aliases: ['حي الزيتون'] },
  { id: 'souq-al-samak', name: 'سوق السمك', type: 'landmark', center: 'المطرية', aliases: ['حلقة السمك المطرية', 'سوق السمك بالمطرية'] },
  { id: 'sharea-al-mina', name: 'شارع الميناء', type: 'street', center: 'المطرية', aliases: ['شارع المينا', 'ميناء المطرية'] },

  // Major Streets & Landmarks
  { id: 'sharea-portsaid', name: 'شارع بورسعيد', type: 'street', center: 'المنزلة', aliases: ['بورسعيد', 'شارع بور سعيد'] },
  { id: 'maydan-al-mahata', name: 'ميدان المحطة', type: 'landmark', center: 'المنزلة', aliases: ['المحطة', 'المحطه', 'ميدان المحطه'] },
  { id: 'kobri-al-aziza', name: 'كوبري العزيزة', type: 'landmark', center: 'المنزلة', aliases: ['كوبري العزيزه', 'جسر العزيزة'] },
  { id: 'sharea-al-galaa', name: 'شارع الجلاء', type: 'street', center: 'المنزلة', aliases: ['الجلاء', 'حي الجلاء'] },
  { id: 'sharea-al-thawra', name: 'شارع الثورة', type: 'street', center: 'المنزلة', aliases: ['الثورة', 'الثوره'] },
  { id: 'sharea-al-bahr', name: 'شارع البحر', type: 'street', center: 'المنزلة', aliases: ['كورنيش البحر', 'البحر المنزلة'] },
  { id: 'al-sekka-al-hadeed', name: 'السكة الحديد', type: 'landmark', center: 'المنزلة', aliases: ['سكة حديد المنزلة'] }
];

export function extractLocationFromQuery(query = '') {
  if (!query) return null;
  const normQ = normalizeArabic(query).toLowerCase();

  for (const loc of MASTER_LOCATIONS) {
    const allNames = [loc.name, ...(loc.aliases || [])];
    for (const name of allNames) {
      const normName = normalizeArabic(name).toLowerCase();
      if (normQ.includes(normName)) {
        return loc;
      }
    }
  }

  return null;
}

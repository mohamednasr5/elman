-- Seed 15 Craft and Service Categories into categories table
INSERT OR REPLACE INTO categories (
  id, name, name_en, slug, icon, description, sort_order, is_active, created_at, updated_at
) VALUES 
('decor-finishing', 'التشطيبات والديكور', 'Finishing & Decoration', 'decor-finishing', '🏠', 'أعمال الدهانات والنقاشة، السيراميك، البورسلين، الجبس بورد، وعزل الأسطح والحمامات', 10, 1, 1788000000000, 1788000000000),
('plumbing-drainage', 'السباكة والصرف', 'Plumbing & Drainage', 'plumbing-drainage', '🔧', 'تأسيس وصيانة السباكة، تسليك المجاري، فلاتر المياه، السخانات، ومضخات وخزانات المياه', 11, 1, 1788000000000, 1788000000000),
('electrical', 'الكهرباء', 'Electrical', 'electrical', '⚡', 'تأسيس وصيانة كهرباء المنازل والمصانع، اللوحات، كاميرات المراقبة، الطاقة الشمسية، والدش', 12, 1, 1788000000000, 1788000000000),
('hvac-refrigeration', 'التكييف والتبريد', 'HVAC & Refrigeration', 'hvac-refrigeration', '❄️', 'صيانة وشحن وتركيب التكييفات، غرف التبريد، الثلاجات، الفريزر، والشفاطات المركزية', 13, 1, 1788000000000, 1788000000000),
('carpentry-furniture', 'النجارة والأثاث', 'Carpentry & Furniture', 'carpentry-furniture', '🪚', 'تفصيل وصيانة الموبيليا وغرف النوم، الأبواب، المطابخ، التنجيد، وتركيب الأثاث', 14, 1, 1788000000000, 1788000000000),
('building-construction', 'البناء والإنشاء', 'Building & Construction', 'building-construction', '🧱', 'مقاولات المباني والترميم، أعمال البناء والمحارة، الحدادة المسلحة، الخرسانات، والهدم', 15, 1, 1788000000000, 1788000000000),
('automotive-vehicles', 'السيارات والمركبات', 'Automotive & Vehicles', 'automotive-vehicles', '🚗', 'ميكانيكا وكهرباء السيارات، سمكرة ودوكو، ضبط زوايا وعفشة، إطارات وبطاريات، ومغاسل السيارات', 16, 1, 1788000000000, 1788000000000),
('blacksmith-alumital', 'الحدادة والألوميتال', 'Blacksmith & Alumital', 'blacksmith-alumital', '🔩', 'حدادة الأبواب والشبابيك والكريتال، قطاعات الألوميتال و UPVC، لحام أرجون، وستانلس ستيل', 17, 1, 1788000000000, 1788000000000),
('cleaning-home-services', 'النظافة والخدمات المنزلية', 'Cleaning & Home Services', 'cleaning-home-services', '🧹', 'تنظيف المنازل والمكاتب، غسيل السجاد والإنتريهات بالبخار، جلي الرخام، ومكافحة الحشرات', 18, 1, 1788000000000, 1788000000000),
('agriculture-gardening', 'الزراعة والحدائق', 'Agriculture & Gardening', 'agriculture-gardening', '🌳', 'تنسيق الحدائق المنزلية، شبكات الري الحديثة، تقليم وقص الأشجار، ومكافحة الآفات الزراعية', 19, 1, 1788000000000, 1788000000000),
('home-appliances-maintenance', 'الأجهزة المنزلية', 'Home Appliances Maintenance', 'home-appliances-maintenance', '📺', 'صيانة الغسالات الأوتوماتيك، الثلاجات، البوتاجازات، الأفران، الميكروويف، والشاشات', 20, 1, 1788000000000, 1788000000000),
('tailoring-clothing', 'الملابس والخياطة', 'Tailoring & Clothing', 'tailoring-clothing', '🧵', 'تفصيل وخياطة الملابس الرجالي والحريمي، تطريز، إصلاح ملابس، تفصيل ستائر، وتنجيد', 21, 1, 1788000000000, 1788000000000),
('barber-beauty', 'الحلاقة والتجميل', 'Barber & Beauty', 'barber-beauty', '💇‍♂️', 'صالونات الحلاقة الرجالي والأطفال، كوافير وميكب آرتست، والعناية بالبشرة والأظافر', 22, 1, 1788000000000, 1788000000000),
('transportation-logistics', 'النقل والخدمات', 'Transportation & Logistics', 'transportation-logistics', '🚚', 'نقل العفش والأثاث، سيارات النصف نقل، ونش رفع الأثاث، ونش الإنقاذ، وسيارات الأجرة', 23, 1, 1788000000000, 1788000000000),
('misc-services', 'خدمات متنوعة', 'Miscellaneous Services', 'misc-services', '🔑', 'نسخ المفاتيح والأقفال، الزجاج والمرايا، الدعاية والإعلان، المظلات، والأنظمة الأمنية', 24, 1, 1788000000000, 1788000000000);

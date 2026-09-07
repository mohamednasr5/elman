-- Migration 0007: add home food kitchen and remove duplicate Quran reader category
INSERT OR IGNORE INTO categories (id, name, name_en, slug, icon, description, sort_order, created_at, updated_at)
VALUES ('home-food-kitchen', 'مطبخ للأكل البيتي', 'Home Food Kitchen', 'home-food-kitchen', '🍲', 'مطابخ وأسر منتجة تقدم الأكل البيتي والوجبات المنزلية الطازجة.', 33, strftime('%s','now') * 1000, strftime('%s','now') * 1000);

DELETE FROM categories
WHERE name = 'قارئ قرآن كريم'
  AND id <> (SELECT MIN(id) FROM categories WHERE name = 'قارئ قرآن كريم');

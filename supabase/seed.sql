insert into public.shops (slug, name, whatsapp_number, category, mahalla, is_active, owner_id) values
('makcik-nasi-lemak', 'Makcik Nasi Lemak Faruq', '60123456789', 'food', 'Faruq', true, null),
('print-express-ali', 'Print Express Ali', '60198765432', 'printing', 'Ali', true, null),
('bike-rental-maryam', 'Bike Rental Maryam', '60155556666', 'rentals', 'Maryam', true, null),
('fixphone-bilal', 'FixPhone Custom Bilal', '60177778888', 'custom', 'Bilal', true, null),
('burger-aminah', 'Burger Aminah', '60111222333', 'food', 'Aminah', true, null),
('laptop-repair-faruq', 'Laptop Repair Faruq', '60133334444', 'repairs', 'Faruq', true, null),
('closed-cafe-test', 'Closed Cafe (Test Inactive)', '60100001111', 'food', 'Ali', false, null)
on conflict (slug) do nothing;

insert into public.products (shop_id, title, price, is_available, custom_fields)
select s.id, v.title, v.price, true, '[]'::jsonb
from public.shops s
join (values
  ('makcik-nasi-lemak', 'Nasi Lemak Biasa', 5.00),
  ('makcik-nasi-lemak', 'Nasi Lemak Ayam Goreng', 8.50),
  ('print-express-ali', 'Print A4 Black & White (per page)', 0.20),
  ('print-express-ali', 'Print A4 Color (per page)', 1.00),
  ('bike-rental-maryam', 'Basikal Sewa Harian', 10.00),
  ('burger-aminah', 'Chicken Crispy Burger', 7.00),
  ('burger-aminah', 'Beef Cheese Burger', 9.00),
  ('laptop-repair-faruq', 'Laptop Servis + Cuci Dalaman', 45.00),
  ('laptop-repair-faruq', 'Ganti SSD 256GB + Clone Data', 150.00)
) as v(slug, title, price) on v.slug = s.slug
where not exists (select 1 from public.products p where p.shop_id = s.id and p.title = v.title);

insert into public.products (shop_id, title, price, is_available, custom_fields)
select s.id, 'Repair Phone Custom', 20.00, true,
'[{"id":"device_model","label":"Model Telefon","type":"text","required":true,"enabled":true},{"id":"damage_type","label":"Jenis Kerosakan","type":"select","required":true,"enabled":true,"options":[{"name":"Screen Crack","price_modifier":30},{"name":"Battery","price_modifier":25},{"name":"Charging Port","price_modifier":15}]},{"id":"urgency","label":"Urgency (hari)","type":"number","required":false,"enabled":true},{"id":"notes","label":"Nota Tambahan","type":"textarea","required":false,"enabled":true}]'::jsonb
from public.shops s where s.slug = 'fixphone-bilal'
and not exists (select 1 from public.products p where p.shop_id = s.id and p.title = 'Repair Phone Custom');

insert into public.orders (shop_id, buyer_name, location, total_amount, payment_ref_id, custom_data, items, status)
select s.id, v.buyer_name, v.location, v.total_amount, v.payment_ref_id, v.custom_data::jsonb, v.items::jsonb, v.status
from public.shops s
join (values
  ('makcik-nasi-lemak', 'Ahmad Test', 'Mahalla Faruq, C2-3-12', 13.50, '9412', '{}',
    '[{"title":"Nasi Lemak Ayam Goreng","qty":1,"unitPrice":8.5,"lineTotal":8.5},{"title":"Nasi Lemak Biasa","qty":1,"unitPrice":5,"lineTotal":5}]', 'pending'),
  ('print-express-ali', 'Siti Test', 'Mahalla Ali, B1-2-05', 3.40, '2210', '{}',
    '[{"title":"Print A4 Color (per page)","qty":2,"unitPrice":1,"lineTotal":2},{"title":"Print A4 Black & White (per page)","qty":7,"unitPrice":0.2,"lineTotal":1.4}]', 'confirmed'),
  ('burger-aminah', 'Ali Test', 'Mahalla Aminah, A3-1-20', 16.00, '7788', '{}',
    '[{"title":"Beef Cheese Burger","qty":1,"unitPrice":9,"lineTotal":9},{"title":"Chicken Crispy Burger","qty":1,"unitPrice":7,"lineTotal":7}]', 'completed'),
  ('bike-rental-maryam', 'Maryam Test', 'Mahalla Maryam, D4-2-11', 10.00, '3344', '{}',
    '[{"title":"Basikal Sewa Harian","qty":1,"unitPrice":10,"lineTotal":10}]', 'rejected'),
  ('fixphone-bilal', 'Custom Test', 'Mahalla Bilal, E1-1-01', 50.00, '5566',
    '{"Model Telefon":"iPhone 11","Jenis Kerosakan":"Screen Crack","Nota Tambahan":"segera"}',
    '[{"title":"Repair Phone Custom","qty":1,"unitPrice":50,"lineTotal":50}]', 'pending')
) as v(slug, buyer_name, location, total_amount, payment_ref_id, custom_data, items, status) on v.slug = s.slug
where not exists (select 1 from public.orders o where o.payment_ref_id = v.payment_ref_id and o.shop_id = s.id);

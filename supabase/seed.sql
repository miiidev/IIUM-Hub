-- IIUM Hub demo seed. Safe to re-run (conflict guards + not-exists checks).
-- Wipe first for a fully fresh dataset: delete from public.orders; delete from public.products; delete from public.shops;

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
'[{"id":"device_model","label":"Model Telefon","type":"text","required":true},{"id":"damage_type","label":"Jenis Kerosakan","type":"select","required":true,"options":[{"name":"Screen Crack","price_modifier":30},{"name":"Battery","price_modifier":25},{"name":"Charging Port","price_modifier":15}]},{"id":"urgency","label":"Urgency (hari)","type":"number","required":false},{"id":"notes","label":"Nota Tambahan","type":"textarea","required":false}]'::jsonb
from public.shops s where s.slug = 'fixphone-bilal'
and not exists (select 1 from public.products p where p.shop_id = s.id and p.title = 'Repair Phone Custom');

insert into public.orders (shop_id, buyer_name, location, total_amount, payment_ref_id, custom_data, status)
select s.id, v.buyer_name, v.location, v.total_amount, v.payment_ref_id, v.custom_data::jsonb, v.status
from public.shops s
join (values
  ('makcik-nasi-lemak', 'Ahmad Test', 'Mahalla Faruq, C2-3-12', 13.50, 'TEST9412', '{}', 'pending'),
  ('print-express-ali', 'Siti Test', 'Mahalla Ali, B1-2-05', 3.40, 'TEST2210', '{}', 'confirmed'),
  ('burger-aminah', 'Ali Test', 'Mahalla Aminah, A3-1-20', 16.00, 'TEST7788', '{}', 'completed'),
  ('bike-rental-maryam', 'Maryam Test', 'Mahalla Maryam, D4-2-11', 10.00, 'TEST3344', '{}', 'rejected'),
  ('fixphone-bilal', 'Custom Test', 'Mahalla Bilal, E1-1-01', 50.00, 'TEST5566', '{"device_model":"iPhone 11","damage_type":"Screen Crack","notes":"segera"}', 'pending')
) as v(slug, buyer_name, location, total_amount, payment_ref_id, custom_data, status) on v.slug = s.slug
where not exists (select 1 from public.orders o where o.payment_ref_id = v.payment_ref_id);

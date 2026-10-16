-- IIUM Hub demo seed — FULL RESET of the shop catalog.
--
-- ⚠️  WARNING: this TRUNCATEs public.shops. products and orders cascade away.
--     Run only on the demo database. Apply via Supabase Dashboard → SQL Editor
--     (or the MCP `execute_sql` tool).
--
-- 16 demo shops spread across 16 Mahallas; 1–2 English products each with the
-- category preset questions applied. Banner / product images are repo-hosted
-- under `public/seed/` (see public/seed/README.md) and referenced by path.

truncate table public.shops cascade;

-- ── Shops (16, across 16 Mahallas, mixed categories) ──────────────────────
insert into public.shops (slug, name, whatsapp_number, category, mahalla, is_active, description, banner_url) values
  ('faruq-nasi-lemak',        'Faruq Nasi Lemak Corner',      '60123456001', 'food',     'Faruq',      true, 'Home-cooked nasi lemak and breakfast sets, ready by 7am.',                          '/seed/banners/faruq-nasi-lemak.jpg'),
  ('siddiq-printing-hub',     'Siddiq Printing Hub',          '60123456002', 'printing', 'Siddiq',     true, 'Assignment printing, binding and lamination at student prices.',                    '/seed/banners/siddiq-printing-hub.jpg'),
  ('ali-phone-repair',        'Ali''s Phone Repair',          '60123456003', 'repairs',  'Ali',        true, 'Screen, battery and charging port repairs while you wait.',                         '/seed/banners/ali-phone-repair.jpg'),
  ('bilal-bike-rental',       'Bilal Bike Rental',            '60123456004', 'rentals',  'Bilal',      true, 'Daily bicycles for getting around campus.',                                         '/seed/banners/bilal-bike-rental.jpg'),
  ('uthman-burger-shack',     'Uthman Burger Shack',          '60123456005', 'food',     'Uthman',     true, 'Fresh grilled burgers and fries, open till midnight.',                              '/seed/banners/uthman-burger-shack.jpg'),
  ('zubair-print-copy',       'Zubair Print & Copy',          '60123456006', 'printing', 'Zubair',     true, 'Photocopy, binding and last-minute dissertation printing.',                         '/seed/banners/zubair-print-copy.jpg'),
  ('aminah-kitchen',          'Aminah''s Kitchen',            '60123456007', 'food',     'Aminah',     true, 'Daily home-cooked rice sets, delivery to nearby mahallas.',                         '/seed/banners/aminah-kitchen.jpg'),
  ('asiah-laptop-clinic',     'Asiah Laptop Clinic',          '60123456008', 'repairs',  'Asiah',      true, 'Laptop servicing, upgrades and data recovery.',                                     '/seed/banners/asiah-laptop-clinic.jpg'),
  ('asma-sewing',             'Asma Sewing & Alterations',    '60123456009', 'custom',   'Asma',       true, 'Alterations, repairs and custom tailoring.',                                        '/seed/banners/asma-sewing.jpg'),
  ('hafsah-bubble-tea',       'Hafsah Bubble Tea',            '60123456010', 'food',     'Hafsah',     true, 'Freshly shaken milk tea and fruit teas.',                                           '/seed/banners/hafsah-bubble-tea.jpg'),
  ('halimah-room-rental',     'Halimah Room Rental',          '60123456011', 'rentals',  'Halimah',    true, 'Monthly room rentals near campus.',                                                 '/seed/banners/halimah-room-rental.jpg'),
  ('maryam-laundry',          'Maryam Laundry Service',       '60123456012', 'custom',   'Maryam',     true, 'Wash, dry and fold laundry by the kilogram.',                                       '/seed/banners/maryam-laundry.jpg'),
  ('nusaibah-nasi-ayam',      'Nusaibah Nasi Ayam',           '60123456013', 'food',     'Nusaibah',   true, 'Nasi ayam penyet and grilled chicken sets.',                                        '/seed/banners/nusaibah-nasi-ayam.jpg'),
  ('safiyyah-stationery',     'Safiyyah Stationery & Print',  '60123456014', 'printing', 'Safiyyah',   true, 'Stationery, photocopy and printing services.',                                      '/seed/banners/safiyyah-stationery.jpg'),
  ('ruqayyah-gadget-repair',  'Ruqayyah Gadget Repair',       '60123456015', 'repairs',  'Ruqayyah',   true, 'Screen repairs and diagnostics for phones and tablets.',                            '/seed/banners/ruqayyah-gadget-repair.jpg'),
  ('salahuddin-camera-rental','Salahuddin Camera Rental',     '60123456016', 'rentals',  'Salahuddin', true, 'DSLR and mirrorless camera rentals for events.',                                   '/seed/banners/salahuddin-camera-rental.jpg');

-- ── Products (1–2 per shop, English), empty forms to be backfilled ────────
insert into public.products (shop_id, title, price, is_available, custom_fields, image_url)
select s.id, v.title, v.price, true, '[]'::jsonb, v.img
from public.shops s
join (values
  ('faruq-nasi-lemak',        'Nasi Lemak (Classic)',                5.00, '/seed/products/faruq-nasi-lemak-1.jpg'),
  ('faruq-nasi-lemak',        'Nasi Lemak Ayam Goreng',              8.50, '/seed/products/faruq-nasi-lemak-2.jpg'),
  ('siddiq-printing-hub',     'A4 Black & White (per page)',         0.20, '/seed/products/siddiq-printing-hub-1.jpg'),
  ('siddiq-printing-hub',     'A4 Colour (per page)',                1.00, '/seed/products/siddiq-printing-hub-2.jpg'),
  ('ali-phone-repair',        'Phone Repair Service',               40.00, '/seed/products/ali-phone-repair-1.jpg'),
  ('bilal-bike-rental',       'Bicycle Rental (per day)',           10.00, '/seed/products/bilal-bike-rental-1.jpg'),
  ('uthman-burger-shack',     'Chicken Crispy Burger',               7.00, '/seed/products/uthman-burger-shack-1.jpg'),
  ('uthman-burger-shack',     'Beef Cheese Burger',                  9.00, '/seed/products/uthman-burger-shack-2.jpg'),
  ('zubair-print-copy',       'Binding & Laminating',                3.00, '/seed/products/zubair-print-copy-1.jpg'),
  ('aminah-kitchen',          'Nasi Ayam Set',                       8.00, '/seed/products/aminah-kitchen-1.jpg'),
  ('asiah-laptop-clinic',     'Laptop Service + Internal Cleaning', 45.00, '/seed/products/asiah-laptop-clinic-1.jpg'),
  ('asiah-laptop-clinic',     'SSD 256GB Upgrade + Data Clone',    150.00, '/seed/products/asiah-laptop-clinic-2.jpg'),
  ('asma-sewing',             'Clothing Alteration',                10.00, '/seed/products/asma-sewing-1.jpg'),
  ('hafsah-bubble-tea',       'Brown Sugar Milk Tea',                6.50, '/seed/products/hafsah-bubble-tea-1.jpg'),
  ('hafsah-bubble-tea',       'Matcha Latte',                        7.50, '/seed/products/hafsah-bubble-tea-2.jpg'),
  ('halimah-room-rental',     'Room Rental (per month)',            350.00, '/seed/products/halimah-room-rental-1.jpg'),
  ('maryam-laundry',          'Laundry (per kg)',                    4.00, '/seed/products/maryam-laundry-1.jpg'),
  ('nusaibah-nasi-ayam',      'Nasi Ayam Penyet',                    7.50, '/seed/products/nusaibah-nasi-ayam-1.jpg'),
  ('safiyyah-stationery',     'Photocopy A4 (per page)',             0.10, '/seed/products/safiyyah-stationery-1.jpg'),
  ('ruqayyah-gadget-repair',  'Screen Replacement',                120.00, '/seed/products/ruqayyah-gadget-repair-1.jpg'),
  ('salahuddin-camera-rental','DSLR Camera Rental (per day)',       30.00, '/seed/products/salahuddin-camera-rental-1.jpg')
) as v(slug, title, price, img) on v.slug = s.slug;

-- ── Point seed image paths at Supabase Storage ────────────────────────────
-- The photos were uploaded to the public buckets `shop-banners` / `product-images`
-- under `seed/`. Change the project ref below if you re-host.
update public.shops
set banner_url = replace(banner_url, '/seed/banners/', 'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/shop-banners/seed/');

update public.products
set image_url = replace(image_url, '/seed/products/', 'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/');

-- ── Backfill category presets onto the freshly inserted (empty) products ──
update public.products set custom_fields = '[{"id":"print_size","label":"Paper Size","type":"select","required":true,"enabled":true,"options":[{"name":"A4","price_modifier":0},{"name":"A3","price_modifier":0.5}]},{"id":"print_color","label":"Color Mode","type":"select","required":true,"enabled":true,"options":[{"name":"Black & White","price_modifier":0},{"name":"Color","price_modifier":0.4}]},{"id":"print_duplex","label":"Duplex","type":"select","required":true,"enabled":true,"options":[{"name":"Single-sided","price_modifier":0},{"name":"Double-sided","price_modifier":0}]},{"id":"print_pages","label":"Number of Pages","type":"number","required":true,"enabled":true,"price_per_unit":0.1,"min":1,"max":500,"integer":true,"quickPicks":[1,5,10,20,50]},{"id":"print_file","label":"Upload File","type":"file","required":true,"enabled":true},{"id":"print_notes","label":"Notes","type":"textarea","required":false,"enabled":true,"placeholder":"e.g. single page colour, instructions"}]'::jsonb
where (custom_fields is null or custom_fields = '[]'::jsonb)
and shop_id in (select id from public.shops where category = 'printing');

update public.products set custom_fields = '[{"id":"food_size","label":"Size","type":"select","required":true,"enabled":true,"options":[{"name":"Regular","price_modifier":0},{"name":"Large","price_modifier":2}]},{"id":"food_addons","label":"Add-ons","type":"multiselect","required":false,"enabled":true,"options":[{"name":"Egg","price_modifier":1},{"name":"Cheese","price_modifier":1.5},{"name":"Extra Rice","price_modifier":2}]},{"id":"food_spice","label":"Spice Level","type":"select","required":false,"enabled":true,"options":[{"name":"Not spicy","price_modifier":0},{"name":"Medium","price_modifier":0},{"name":"Spicy","price_modifier":0}]},{"id":"food_notes","label":"Notes","type":"textarea","required":false,"enabled":true,"placeholder":"e.g. less spicy"}]'::jsonb
where (custom_fields is null or custom_fields = '[]'::jsonb)
and shop_id in (select id from public.shops where category = 'food');

update public.products set custom_fields = '[{"id":"repair_item","label":"Item / Device","type":"text","required":true,"enabled":true,"placeholder":"e.g. iPhone 11, laptop"},{"id":"repair_issue","label":"Issue","type":"textarea","required":true,"enabled":true,"placeholder":"describe what is wrong"},{"id":"repair_urgency","label":"Urgency","type":"select","required":true,"enabled":true,"options":[{"name":"Normal","price_modifier":0},{"name":"Express (+24h)","price_modifier":5}]},{"id":"repair_photo","label":"Photo","type":"file","required":false,"enabled":true},{"id":"repair_phone","label":"Phone Number","type":"phone","required":true,"enabled":true}]'::jsonb
where (custom_fields is null or custom_fields = '[]'::jsonb)
and shop_id in (select id from public.shops where category = 'repairs');

update public.products set custom_fields = '[{"id":"rental_item","label":"Item","type":"select","required":true,"enabled":true,"options":[{"name":"Item A","price_modifier":0}]},{"id":"rental_start","label":"Start Date","type":"date","required":true,"enabled":true},{"id":"rental_end","label":"Return Date","type":"date","required":true,"enabled":true},{"id":"rental_qty","label":"Quantity","type":"number","required":true,"enabled":true,"min":1,"max":10,"integer":true},{"id":"rental_phone","label":"Phone Number","type":"phone","required":true,"enabled":true},{"id":"rental_notes","label":"Notes","type":"textarea","required":false,"enabled":true,"placeholder":"e.g. pickup time"}]'::jsonb
where (custom_fields is null or custom_fields = '[]'::jsonb)
and shop_id in (select id from public.shops where category = 'rentals');

-- ── Batch 2 (4 more shops → 20 total) ─────────────────────────────────────
insert into public.shops (slug, name, whatsapp_number, category, mahalla, is_active, description, banner_url) values
  ('sumayyah-nasi-kerabu','Sumayyah Nasi Kerabu','60123456017','food','Sumayyah',true,'Kelantan-style nasi kerabu with ulam and keropok.','https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/shop-banners/seed/sumayyah-nasi-kerabu.jpg'),
  ('zubair-binding','Zubair Binding & Laminating','60123456018','printing','Zubair',true,'Spiral binding, lamination and document finishing.','https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/shop-banners/seed/zubair-binding.jpg'),
  ('ali-macbook-clinic','Ali MacBook Clinic','60123456019','repairs','Ali',true,'MacBook and laptop servicing, batteries and upgrades.','https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/shop-banners/seed/ali-macbook-clinic.jpg'),
  ('bilal-scooter-rental','Bilal Scooter Rental','60123456020','rentals','Bilal',true,'Scooter and helmet rentals for the day.','https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/shop-banners/seed/bilal-scooter-rental.jpg');

insert into public.products (shop_id, title, price, is_available, custom_fields, image_url)
select s.id, v.title, v.price, true, '[]'::jsonb, v.img
from public.shops s
join (values
  ('sumayyah-nasi-kerabu','Nasi Kerabu',7.00,'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/sumayyah-nasi-kerabu-1.jpg'),
  ('sumayyah-nasi-kerabu','Nasi Kerabu Ayam Percik',9.00,'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/sumayyah-nasi-kerabu-2.jpg'),
  ('zubair-binding','Spiral Binding',3.00,'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/zubair-binding-1.jpg'),
  ('zubair-binding','Lamination',1.50,'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/zubair-binding-2.jpg'),
  ('ali-macbook-clinic','MacBook Service',80.00,'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/ali-macbook-clinic-1.jpg'),
  ('ali-macbook-clinic','Laptop Battery Replacement',180.00,'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/ali-macbook-clinic-2.jpg'),
  ('bilal-scooter-rental','Scooter Rental (per day)',25.00,'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/bilal-scooter-rental-1.jpg'),
  ('bilal-scooter-rental','Helmet Add-on',3.00,'https://wpbknrubjxbdtucigapu.supabase.co/storage/v1/object/public/product-images/seed/bilal-scooter-rental-2.jpg')
) as v(slug, title, price, img) on v.slug = s.slug;

-- re-apply category presets to any still-empty products (batch 2)
update public.products set custom_fields = (select custom_fields from public.products
  where custom_fields <> '[]'::jsonb
    and shop_id in (select id from public.shops where category = 'printing') limit 1)
where (custom_fields is null or custom_fields = '[]'::jsonb)
  and shop_id in (select id from public.shops where category = 'printing');

update public.products set custom_fields = (select custom_fields from public.products
  where custom_fields <> '[]'::jsonb
    and shop_id in (select id from public.shops where category = 'food') limit 1)
where (custom_fields is null or custom_fields = '[]'::jsonb)
  and shop_id in (select id from public.shops where category = 'food');

update public.products set custom_fields = (select custom_fields from public.products
  where custom_fields <> '[]'::jsonb
    and shop_id in (select id from public.shops where category = 'repairs') limit 1)
where (custom_fields is null or custom_fields = '[]'::jsonb)
  and shop_id in (select id from public.shops where category = 'repairs');

update public.products set custom_fields = (select custom_fields from public.products
  where custom_fields <> '[]'::jsonb
    and shop_id in (select id from public.shops where category = 'rentals') limit 1)
where (custom_fields is null or custom_fields = '[]'::jsonb)
  and shop_id in (select id from public.shops where category = 'rentals');

-- ── Demo seller accounts (one per shop, seller1..seller20) ────────────────
-- Password for all: IIUMhub123!
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'seller' || g.n || '@live.iium.edu.my', crypt('IIUMhub123!', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', ''
from generate_series(1, 20) g(n)
where not exists (select 1 from auth.users u where u.email = 'seller' || g.n || '@live.iium.edu.my');

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', u.id::text, now(), now(), now()
from auth.users u
where u.email like 'seller%@live.iium.edu.my'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);

insert into public.profiles (id, whatsapp_number)
select u.id, '60123456789' from auth.users u
where u.email like 'seller%@live.iium.edu.my'
on conflict (id) do nothing;

-- One account per shop, matched in slug order (seller1 = 1st slug, …).
with s as (select id, row_number() over (order by slug) as rn from public.shops),
     a as (select id, row_number() over (order by substring(email from '([0-9]+)@')::int) as rn
           from auth.users where email like 'seller%@live.iium.edu.my')
update public.shops shop
set owner_id = a.id
from s join a on a.rn = s.rn
where shop.id = s.id;

-- Demo: point every shop's WhatsApp at the owner's number.
update public.shops set whatsapp_number = '60132446202';

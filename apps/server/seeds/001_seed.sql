-- 001_seed.sql
-- Idempotent seed data: two users, Munich places, the predefined reason tags,
-- plus sample per-visit posts (the new core content item), their reason tags
-- and photos. Safe to run repeatedly (every INSERT uses ON CONFLICT DO NOTHING).
-- Fixed UUIDs are used so cross-references are stable across runs.
--
-- Post ids 33..3301..3311 match the recommendations that 002_posts_geo.sql
-- migrates, so seeding an already-migrated dev DB is a no-op for those rows.
-- 33..3312/3313 are new repeat visits that only this seed introduces.

-- Users ---------------------------------------------------------------------
INSERT INTO users (id, display_name, username, avatar_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test User', 'testuser',
   'https://i.pravatar.cc/150?img=12'),
  ('00000000-0000-0000-0000-000000000002', 'Lena M.', 'lena',
   'https://i.pravatar.cc/150?img=32')
ON CONFLICT (id) DO NOTHING;

-- Places (Munich) -----------------------------------------------------------
-- geog is set automatically from latitude/longitude by trg_places_geog.
INSERT INTO places
  (id, name, category, address, city, country, latitude, longitude) VALUES
  ('11111111-1111-1111-1111-111111110001', 'Hofbräuhaus München', 'Bavarian / Beer Hall',
   'Platzl 9', 'Munich', 'Germany', 48.1374, 11.5797),
  ('11111111-1111-1111-1111-111111110002', 'Augustiner-Keller', 'Beer Garden',
   'Arnulfstraße 52', 'Munich', 'Germany', 48.1442, 11.5503),
  ('11111111-1111-1111-1111-111111110003', 'Café Frischhut (Schmalznudel)', 'Café / Bakery',
   'Prälat-Zistl-Straße 8', 'Munich', 'Germany', 48.1352, 11.5763),
  ('11111111-1111-1111-1111-111111110004', 'Prinz Myshkin', 'Vegetarian',
   'Hackenstraße 2', 'Munich', 'Germany', 48.1369, 11.5731),
  ('11111111-1111-1111-1111-111111110005', 'Tantris', 'Fine Dining',
   'Johann-Fichte-Straße 7', 'Munich', 'Germany', 48.1761, 11.5905),
  ('11111111-1111-1111-1111-111111110006', 'Zum Dürnbräu', 'Bavarian',
   'Dürnbräugasse 2', 'Munich', 'Germany', 48.1361, 11.5790)
ON CONFLICT (id) DO NOTHING;

-- Reason tags ---------------------------------------------------------------
INSERT INTO reason_tags (id, label, sentiment) VALUES
  ('22222222-2222-2222-2222-222222220001', 'Great food',         'positive'),
  ('22222222-2222-2222-2222-222222220002', 'Good value',         'positive'),
  ('22222222-2222-2222-2222-222222220003', 'Nice atmosphere',    'positive'),
  ('22222222-2222-2222-2222-222222220004', 'Friendly service',   'positive'),
  ('22222222-2222-2222-2222-222222220005', 'Would go back',      'positive'),
  ('22222222-2222-2222-2222-222222220006', 'Hidden gem',         'positive'),
  ('22222222-2222-2222-2222-222222220007', 'Not my taste',       'neutral'),
  ('22222222-2222-2222-2222-222222220008', 'Too expensive for me','neutral'),
  ('22222222-2222-2222-2222-222222220009', 'Too loud',           'neutral'),
  ('22222222-2222-2222-2222-222222220010', 'Too crowded',        'neutral'),
  ('22222222-2222-2222-2222-222222220011', 'Better for tourists','neutral'),
  ('22222222-2222-2222-2222-222222220012', 'Overhyped',          'negative'),
  ('22222222-2222-2222-2222-222222220013', 'Would not return',   'negative'),
  ('22222222-2222-2222-2222-222222220014', 'Not worth the wait', 'negative')
ON CONFLICT (id) DO NOTHING;

-- Posts (per-visit) ---------------------------------------------------------
-- Explicit timestamps keep the timeline (and latest-post-wins scoring)
-- deterministic. Note the two later posts by Test User: post 3312 revisits
-- Tantris and flips their latest stance from 'maybe' (3309) to 'yes'.
INSERT INTO posts
  (id, user_id, place_id, recommendation_value, visibility, note, visited_at, created_at) VALUES
  ('33333333-3333-3333-3333-333333330001', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110001', 'yes',   'public',  'Touristy but a fun first stop.', '2026-06-10', '2026-06-10 18:30:00+00'),
  ('33333333-3333-3333-3333-333333330002', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111110001', 'maybe', 'friends', NULL,                              '2026-06-10', '2026-06-10 19:15:00+00'),
  ('33333333-3333-3333-3333-333333330003', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110002', 'yes',   'public',  'Best beer garden under the chestnuts.', '2026-06-11', '2026-06-11 12:00:00+00'),
  ('33333333-3333-3333-3333-333333330004', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111110002', 'yes',   'friends', NULL,                              '2026-06-11', '2026-06-11 13:20:00+00'),
  ('33333333-3333-3333-3333-333333330005', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110003', 'yes',   'public',  'Get the Schmalznudel fresh.',     '2026-06-11', '2026-06-11 09:45:00+00'),
  ('33333333-3333-3333-3333-333333330006', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111110004', 'yes',   'friends', NULL,                              '2026-06-12', '2026-06-12 19:00:00+00'),
  ('33333333-3333-3333-3333-333333330007', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110004', 'maybe', 'public',  'Solid, not my usual thing.',      '2026-06-12', '2026-06-12 20:10:00+00'),
  ('33333333-3333-3333-3333-333333330008', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111110005', 'no',    'friends', NULL,                              '2026-06-12', '2026-06-12 21:00:00+00'),
  ('33333333-3333-3333-3333-333333330009', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110005', 'maybe', 'public',  'First visit underwhelmed me.',    '2026-06-12', '2026-06-12 21:30:00+00'),
  ('33333333-3333-3333-3333-333333330010', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111110006', 'yes',   'friends', NULL,                              '2026-06-13', '2026-06-13 18:00:00+00'),
  ('33333333-3333-3333-3333-333333330011', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110006', 'yes',   'public',  NULL,                              '2026-06-13', '2026-06-13 18:45:00+00'),
  -- Repeat visits (new in the per-visit model):
  ('33333333-3333-3333-3333-333333330012', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110005', 'yes',   'public',  'Came back for the tasting menu — won me over.', '2026-06-14', '2026-06-14 21:00:00+00'),
  ('33333333-3333-3333-3333-333333330013', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110002', 'yes',   'public',  'Second round, even better in the evening sun.', '2026-06-13', '2026-06-13 17:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- Post reason tags ----------------------------------------------------------
INSERT INTO post_reason_tags (post_id, reason_tag_id) VALUES
  ('33333333-3333-3333-3333-333333330001', '22222222-2222-2222-2222-222222220003'), -- Hofbräuhaus: Nice atmosphere
  ('33333333-3333-3333-3333-333333330001', '22222222-2222-2222-2222-222222220011'), -- Better for tourists
  ('33333333-3333-3333-3333-333333330002', '22222222-2222-2222-2222-222222220010'), -- Too crowded
  ('33333333-3333-3333-3333-333333330003', '22222222-2222-2222-2222-222222220003'), -- Augustiner: Nice atmosphere
  ('33333333-3333-3333-3333-333333330003', '22222222-2222-2222-2222-222222220002'), -- Good value
  ('33333333-3333-3333-3333-333333330004', '22222222-2222-2222-2222-222222220005'), -- Would go back
  ('33333333-3333-3333-3333-333333330005', '22222222-2222-2222-2222-222222220006'), -- Frischhut: Hidden gem
  ('33333333-3333-3333-3333-333333330005', '22222222-2222-2222-2222-222222220001'), -- Great food
  ('33333333-3333-3333-3333-333333330006', '22222222-2222-2222-2222-222222220001'), -- Prinz Myshkin: Great food
  ('33333333-3333-3333-3333-333333330007', '22222222-2222-2222-2222-222222220007'), -- Not my taste
  ('33333333-3333-3333-3333-333333330008', '22222222-2222-2222-2222-222222220008'), -- Tantris: Too expensive for me
  ('33333333-3333-3333-3333-333333330008', '22222222-2222-2222-2222-222222220012'), -- Overhyped
  ('33333333-3333-3333-3333-333333330010', '22222222-2222-2222-2222-222222220004'), -- Zum Dürnbräu: Friendly service
  ('33333333-3333-3333-3333-333333330011', '22222222-2222-2222-2222-222222220005'), -- Would go back
  ('33333333-3333-3333-3333-333333330012', '22222222-2222-2222-2222-222222220001'), -- Tantris revisit: Great food
  ('33333333-3333-3333-3333-333333330012', '22222222-2222-2222-2222-222222220005'), -- Would go back
  ('33333333-3333-3333-3333-333333330013', '22222222-2222-2222-2222-222222220003')  -- Augustiner revisit: Nice atmosphere
ON CONFLICT DO NOTHING;

-- Photos (placeholder images; real uploads land in Supabase Storage later) --
-- position orders photos within a post; post 3313 shows a two-photo gallery.
INSERT INTO photos (id, user_id, place_id, post_id, image_url, caption, position) VALUES
  ('44444444-4444-4444-4444-444444440001', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110001', '33333333-3333-3333-3333-333333330001', 'https://picsum.photos/seed/hofbrauhaus/800/600',  'Maß and pretzels',                 0),
  ('44444444-4444-4444-4444-444444440002', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110002', '33333333-3333-3333-3333-333333330003', 'https://picsum.photos/seed/augustiner/800/600',   'Beer garden under the chestnuts',  0),
  ('44444444-4444-4444-4444-444444440003', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110003', '33333333-3333-3333-3333-333333330005', 'https://picsum.photos/seed/schmalznudel/800/600', 'Fresh Schmalznudel',               0),
  ('44444444-4444-4444-4444-444444440004', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111110004', '33333333-3333-3333-3333-333333330006', 'https://picsum.photos/seed/myshkin/800/600',      'Veggie plate',                     0),
  ('44444444-4444-4444-4444-444444440005', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110006', '33333333-3333-3333-3333-333333330011', 'https://picsum.photos/seed/durnbrau/800/600',     'Schnitzel done right',             0),
  ('44444444-4444-4444-4444-444444440006', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110002', '33333333-3333-3333-3333-333333330013', 'https://picsum.photos/seed/augustiner2/800/600',  'Evening light over the tables',    0),
  ('44444444-4444-4444-4444-444444440007', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110002', '33333333-3333-3333-3333-333333330013', 'https://picsum.photos/seed/augustiner3/800/600',  'Second round',                     1),
  ('44444444-4444-4444-4444-444444440008', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110005', '33333333-3333-3333-3333-333333330012', 'https://picsum.photos/seed/tantris/800/600',      'The tasting menu that changed my mind', 0)
ON CONFLICT (id) DO NOTHING;

-- A follow edge and a saved place for the test user -------------------------
INSERT INTO follows (follower_user_id, followed_user_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO saves (user_id, place_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110003')
ON CONFLICT (user_id, place_id) DO NOTHING;

-- Training spots & reviews for participants and coaches

-- ─── training_spots ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_spots (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT          NOT NULL,
  description  TEXT,
  city         TEXT          NOT NULL,
  address      TEXT,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  website      TEXT,
  entry_fee    TEXT,
  tags         TEXT[]        NOT NULL DEFAULT '{}',
  is_verified  BOOLEAN       NOT NULL DEFAULT FALSE,
  added_by     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS training_spots_name_city_idx ON training_spots (name, city);

ALTER TABLE training_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spots_select" ON training_spots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "spots_insert" ON training_spots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by OR is_verified = TRUE);

-- ─── spot_reviews ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spot_reviews (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id        UUID        NOT NULL REFERENCES training_spots(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating         INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment        TEXT,
  reviewer_name  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spot_id, user_id)
);

ALTER TABLE spot_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON spot_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reviews_insert" ON spot_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update" ON spot_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "reviews_delete" ON spot_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Seed verified spots ─────────────────────────────────────────────────────
INSERT INTO training_spots (name, description, city, address, lat, lng, website, entry_fee, tags, is_verified)
VALUES
  ('SK Hradčany',
   'Gymnastická tělocvična vybavená nářadím pro mužskou i ženskou sportovní gymnastiku, molitanovou jámou i trampolínou, vhodná pro parkour i freerun, s možností samostatného tréninku.',
   'Praha', 'Praha 6 – Dejvice', 50.0877, 14.4000,
   'skhradcany.cz', 'Vstup 200 Kč + 50 Kč za každou další půlhodinu',
   ARRAY['gymnastics','parkour','trampoline','foam-pit'], TRUE),

  ('In Motion Academy Praha',
   'Volné tréninky bez instruktora, otevřené dětem i dospělým. Parkourové překážky, molitanová jáma, hrazdy.',
   'Praha', 'Na Jarově, Praha 3', 50.0840, 14.4625,
   'imacademy.cz', NULL,
   ARRAY['parkour','foam-pit'], TRUE),

  ('Jungle Sport Park Letňany',
   'Parkourová zóna, airtrack, trampolína, jáma, hrazda, gymnastický koberec, s „pohybovým plavčíkem" pro veřejnost.',
   'Praha', 'Letňany, Praha 18', 50.1215, 14.5250,
   'jungleletnany.cz', NULL,
   ARRAY['parkour','trampoline','foam-pit'], TRUE),

  ('Jojo Gym',
   '3 plně vybavené sportovní haly, gymnastika, parkour, tricking, trampolíny.',
   'Praha', 'Praha-západ, u Berounky', 49.9350, 14.2100,
   'kudyznudy.cz', NULL,
   ARRAY['gymnastics','parkour','tricking','trampoline'], TRUE),

  ('In Motion Academy Brno',
   'Volné tréninky bez instruktora, parkourové zdi, tyče, gymnastický koberec, molitanová jáma.',
   'Brno', 'Vídeňská 297/99', 49.1814, 16.6111,
   'imacademy.cz', NULL,
   ARRAY['parkour','foam-pit','gymnastics'], TRUE),

  ('TJ Sokol Brno I',
   'Otevřený trénink ve čtvrtek v gymnastické tělocvičně, probíhá individuálně bez trenéra. Taky se tu koná parkour (inBalance kroužky).',
   'Brno', 'Kounicova 20/22', 49.2004, 16.6056,
   'cviceni.tjsokolbrno1.cz', 'Vstup 150 Kč',
   ARRAY['gymnastics','parkour'], TRUE),

  ('Jump Academy Brno',
   'Multisportovní komplex s parkourovými kroužky a trampolínami.',
   'Brno', 'Brno', 49.2100, 16.6200,
   'jumpacademy.cz', NULL,
   ARRAY['parkour','trampoline'], TRUE),

  ('UM Park / UM Parkour Park',
   'Nově otevřený v květnu 2025, přes 2000 m², trampolíny, parkourové překážky, foam pit. Volné vstupy i kroužky.',
   'Ostrava', 'Lihovarská, Ostrava-Radvanice', 49.7821, 18.3101,
   'umparkourpark.cz', NULL,
   ARRAY['parkour','trampoline','foam-pit'], TRUE),

  ('SAREZA – Parkour aréna',
   '600 m² s překážkami stavebnicového systému, stěnové a trubkové prvky.',
   'Ostrava', 'Areál U Cementárny', 49.7999, 18.2544,
   'sareza.cz', NULL,
   ARRAY['parkour'], TRUE),

  ('In Motion Academy Plzeň',
   'Volné tréninky bez instruktora, stejný formát jako Praha/Brno.',
   'Plzeň', 'Plzeň', 49.7478, 13.3773,
   'imacademy.cz', NULL,
   ARRAY['parkour','foam-pit'], TRUE),

  ('In Motion Academy Kladno',
   'Volné tréninky a kroužky.',
   'Kladno', 'Kladno', 50.1440, 14.1033,
   'imacademy.cz', NULL,
   ARRAY['parkour','foam-pit'], TRUE),

  ('Improve Yourself – Parkourová hala FM',
   'Parkourová hala s kroužky, volnými tréninky pro veřejnost, workshopy.',
   'Frýdek-Místek', 'Křižíkova 1774', 49.6830, 18.3643,
   'parkourhala.cz', NULL,
   ARRAY['parkour','freerun'], TRUE),

  ('SpaceTown',
   'První parkourové/trampolínové centrum na Vysočině. Trampolínová zóna, molitanová jáma, gymnastická podlaha, simulace parkourového města, workout zóna. Každou sobotu otevřeno pro veřejnost 10:00–16:00.',
   'Jihlava', 'Jihlava', 49.3961, 15.5858,
   'spacetown.cz', NULL,
   ARRAY['parkour','trampoline','foam-pit','workout'], TRUE),

  ('Gymnastika Zlín',
   'Gymnastická tělocvična s parkourovými kurzy a workshopy.',
   'Zlín', 'Zlín', 49.2204, 17.6645,
   'gymnastikazlin.cz', NULL,
   ARRAY['gymnastics','parkour'], TRUE),

  ('ZOHIR parkour kroužky',
   'Tréninky v tělocvičnách, spíše kroužky než volný vstup.',
   'České Budějovice', 'České Budějovice', 48.9745, 14.4741,
   'zohir.cz', NULL,
   ARRAY['parkour'], TRUE),

  ('Jump Academy / ZOHIR Olomouc',
   'Parkourové kroužky v místních tělocvičnách. Samostatná parkourová hala s volným vstupem zatím chybí.',
   'Olomouc', 'Olomouc', 49.5938, 17.2509,
   'zohir.cz', NULL,
   ARRAY['parkour'], TRUE)

ON CONFLICT (name, city) DO NOTHING;

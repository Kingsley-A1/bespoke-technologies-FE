-- Public portfolio records deliberately remain separate from operational
-- delivery projects. Their columns mirror the existing website metadata shape.
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id STRING PRIMARY KEY,
  name STRING NOT NULL,
  project_type STRING NOT NULL CHECK (project_type IN ('web', 'mobile', 'ios', 'desktop', 'web+mobile')),
  category STRING NOT NULL,
  description STRING NOT NULL,
  image_url STRING NOT NULL,
  image_key STRING NULL,
  image_mime STRING NULL,
  live_url STRING NULL,
  tags JSONB NOT NULL DEFAULT '[]'::JSONB,
  year STRING NOT NULL,
  coming_soon BOOL NOT NULL DEFAULT false,
  featured BOOL NOT NULL DEFAULT false,
  published BOOL NOT NULL DEFAULT true,
  sort_order INT4 NOT NULL DEFAULT 0,
  created_by UUID NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_projects_public_idx
  ON portfolio_projects (published, sort_order, created_at);

INSERT INTO portfolio_projects
  (id, name, project_type, category, description, image_url, live_url, tags, year, coming_soon, featured, published, sort_order)
VALUES
  ('down-below', 'DownBelow Family Health Initiatives', 'web', 'Health Education Platform', 'A public web platform for DownBelow Family Health Initiatives with Dr. Didi, a faith-grounded family health ministry sharing reliable guidance on relationships, sexuality, reproductive health, and community outreach.', '/projects/downbelow.png', 'https://www.down-below.com', '["Health Education","Family Wellness","Community Outreach"]'::JSONB, '2026', false, true, true, 1),
  ('savemi', 'SAVEMI', 'web', 'Religion and Doctrinal Mentorship', 'SAVEMI — Sabbath Vesper Ministry website built to demonstrate the beauty and goodness in the seventh-day Sabbath.', '/projects/savemi.jpg', 'https://www.savemi-five.vercel.app', '["Religion","Sabbath Rest","Repose","Reflection","Restoration"]'::JSONB, '2026', false, true, true, 2),
  ('graviloch-finishing', 'Graviloch Finishing Ltd', 'web', 'Interior Services', 'A premium web presence for an interior finishing and construction company, showcasing completed projects, service offerings, and enabling quote requests.', '/projects/graviloch-finishing.png', 'https://graviloch-finishing.vercel.app', '["Next.js","Tailwind CSS","Vercel"]'::JSONB, '2025', false, true, true, 3),
  ('maxit-autos', 'Maxit Autos', 'web+mobile', 'Auto and Renting', 'A premium car rental platform built to be fast, efficient, and user-friendly, with a seamless booking experience across web and mobile.', '/projects/maxit_autos_logo.png', 'https://maxit-autos.vercel.app/', '["Next.js","React Native","Stripe"]'::JSONB, '2026', false, true, true, 4),
  ('swift-type', 'Swift Type', 'desktop', 'Productivity Tool', 'An AI-powered, high-performance speed typing platform with competitive leaderboards, customisable drill modes, and detailed WPM analytics for computer professionals and learners.', '/projects/swift-type.png', 'https://swift-type.com.ng', '["React","TypeScript","Real-time"]'::JSONB, '2026', false, true, true, 5),
  ('chris-ekong', 'Barr. Chris Ekong & Co', 'web', 'Legal Services', 'A distinguished professional web presence for a leading law practice, featuring case portfolio, service listings, and online consultation booking.', '/projects/barr-chris-ekong-and-co.png', 'https://kingsley-a1.github.io/Chris-Ekong/', '["HTML/CSS","JavaScript","Responsive"]'::JSONB, '2023', false, false, true, 6),
  ('sonic-piano', 'Sonic Piano', 'web', 'Music Education', 'An interactive browser-based piano learning application with structured lessons, live key detection, and audio playback feedback.', '/projects/sonic-piano.jpg', 'https://kingsley-a1.github.io/Sonic-Pro/index.html', '["JavaScript","Web Audio API","Canvas"]'::JSONB, '2025', false, true, true, 7),
  ('debranded', 'Debranded', 'web', 'Brand & Design Studio', 'A brand identity and advertising platform, using modern technology, AI, and creative design to elevate brands and engage audiences.', '/projects/debranded.png', 'https://debranded.vercel.app', '["Next.js","Sanity CMS","Motion"]'::JSONB, '2024', false, true, true, 8),
  ('crs-pdvs', 'CRS Pension DVS', 'web', 'Government Digital Service', 'Cross River State Pension Digital Verification System — a secure government portal for live pensioner verification, streamlining pension administration and verification workflows.', '/projects/crs-pdvs.png', 'https://kingsley-a1.github.io/crs-pdvs', '["Next.js","PostgreSQL","Authentication"]'::JSONB, '2023', false, false, true, 9),
  ('king-bloggers', 'King Bloggers', 'web', 'Content Platform', 'A multi-author blogging platform with rich text editing, topic tagging, SEO optimisation, and reader engagement analytics.', '/projects/king-bloggers.png', 'https://king-bloggers.vercel.app', '["Next.js","MDX","Supabase"]'::JSONB, '2023', false, false, true, 10),
  ('luminary-college', 'Luminary College', 'web', 'Education Platform', 'A modern education website for Luminary College, showcasing programs, admissions guidance, campus life, and student success stories with a polished, inspiring experience.', '/projects/luminary-college.png', 'https://luminary-colledge.vercel.app/', '["Next.js","Education","Admissions"]'::JSONB, '2026', false, true, true, 11),
  ('scents-by-cherry', 'Scents by Cherry', 'web', 'E-commerce & Lifestyle', 'A refined online storefront for Scents by Cherry, highlighting luxury candles, fragrance collections, and a seamless shopping experience for discerning customers.', '/projects/scents-by-cherry.png', 'https://scents-by-cherry.vercel.app/', '["Next.js","E-commerce","Lifestyle"]'::JSONB, '2026', false, true, true, 12),
  ('coolest', 'Coolest', 'web', 'All-in-One Media Player', 'A feature-rich browser-based media player supporting video, audio, images, files, and documents with an elegant minimal interface and seamless playback experience.', '/projects/coolest.png', 'https://coolest-six.vercel.app', '["React","HTML5 Media API","Web APIs"]'::JSONB, '2024', false, false, true, 13),
  ('val-link', 'Val Link', 'web', 'Link Management', 'A creative Valentine experience — a seamless platform for sharing love and appreciation with personalised messaging collections and heartfelt messages.', '/projects/val-link.svg', 'https://val-link.vercel.app', '["Next.js","Analytics","Redis"]'::JSONB, '2023', false, false, true, 14),
  ('kings-queens-lounge', 'Kings & Queens Lounge', 'web', 'Restaurant & Lounge', 'A world-class fine dining and lounge platform for a premier Calabar restaurant, featuring menu browsing, reservations, private events, and online ordering.', '/projects/king-and-queens.png', 'https://kingsley-a1.github.io/kings-queens-lounge/', '["HTML/CSS","JavaScript","PWA"]'::JSONB, '2025', false, true, true, 15),
  ('sunflour-bakery', 'Sunflour Bakery', 'web', 'Food & E-commerce', 'A fresh storefront for an artisan bakery with a full catalogue, online ordering, event catering requests, and local delivery.', '/projects/sunflour-bakery.png', 'https://kingsley-a1.github.io/sunflour-bakery/', '["HTML/CSS","JavaScript","PWA"]'::JSONB, '2025', false, true, true, 16),
  ('decode', 'Decode', 'web', 'Developer Utility', 'A multi-tool web utility for generating and scanning QR codes, encoding and decoding ciphers, checking link safety, and shortening URLs in one clean interface.', '/projects/decode.png', 'https://kingsley-a1.github.io/decode', '["JavaScript","QR Code","Web APIs"]'::JSONB, '2025', false, false, true, 17),
  ('reign', 'Reign', 'web+mobile', 'Fashion & Lifestyle', 'A premium fashion brand platform with lookbook galleries, exclusive product drops, influencer collaboration features, and a native mobile companion app.', '/projects/reign.jpg', NULL, '["Next.js","React Native","Stripe"]'::JSONB, '2025', true, true, true, 18),
  ('velo', 'Velo', 'mobile', 'Logistics & Delivery', 'A real-time logistics and delivery management mobile app connecting drivers, dispatchers, and customers with live tracking and notifications.', '/projects/velo.png', NULL, '["React Native","Expo","WebSocket"]'::JSONB, '2025', true, true, true, 19)
ON CONFLICT (id) DO NOTHING;

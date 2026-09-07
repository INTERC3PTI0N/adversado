-- Adversado platform — 0006: seed.
--
-- The copy currently hardcoded in the site, moved into the database so the
-- admin has something real to edit on day one and the public pages have
-- something to read.
--
-- Page *sections* are not seeded here — they come from the schema registry in
-- `lib/cms/schemas.ts` via the "Sync pages" button, so the defaults live in one
-- place rather than being duplicated in SQL that would drift.
--
-- Every insert is idempotent on its natural key, so re-running is safe.

-- ─── FAQs ─────────────────────────────────────────────────────────────────
-- Verbatim from the supplied Frequently Asked Questions document.

insert into faqs (question, answer, position, status) values
('Do I really need a digital marketing team, or can I handle this myself?',
 'A business can manage digital marketing internally when its needs are relatively simple and the team has the required skills and resources. An agency can become valuable when SEO, paid advertising, and social media need to work together as part of one strategy. A good approach should focus on measurable outcomes such as leads and cost per lead, rather than impressions alone. An integrated agency can also coordinate these channels under one strategy.',
 1, 'published'),
('What can a marketing or creative agency actually do for my business?',
 'A marketing agency can support areas such as branding, digital marketing, public relations, and event marketing. Depending on the business''s goals, an agency may manage several of these functions together, helping maintain consistency across campaigns and reducing the need to coordinate multiple specialist providers.',
 2, 'published'),
('Why does my brand need a strategy before anything else?',
 'A brand strategy establishes the foundation for how a business is positioned and communicated. It typically defines elements such as positioning, brand voice, visual identity, and the way the brand should be presented to its audience. Establishing these elements first helps ensure that future campaigns and marketing activities work toward a consistent idea rather than developing independently.',
 3, 'published'),
('What do I actually get when I hire a branding company?',
 'A branding project typically includes core identity elements such as a logo, colour palette, typography, and brand guidelines. The exact deliverables depend on the scope of the project and the business''s requirements. A typical branding project may take several weeks, with the timeline and cost determined after understanding the brand''s needs and objectives.',
 4, 'published'),
('How can a creative agency make my campaigns more effective?',
 'A creative agency can improve campaign effectiveness by bringing strategy, creative development, messaging, and paid media together. This approach helps ensure that the brand story remains consistent while campaigns are optimized for performance across platforms such as Meta and Google. Combining creative and performance considerations can also make it easier to test messaging and improve campaign results.',
 5, 'published'),
('Should I hire an advertising agency to manage my ad spend?',
 'An advertising agency can be useful when a business needs specialist support with campaign strategy, creative, media buying, optimization, and performance measurement. Integrating advertising with the wider brand strategy can also help ensure that ad creative and messaging remain consistent with the brand''s positioning. The right approach depends on the complexity of the campaigns, internal expertise, and advertising budget.',
 6, 'published'),
('Can a social media marketing agency really save me time?',
 'Yes. Social media marketing involves more than publishing posts. It can include content planning, platform selection, publishing, audience considerations, and performance reporting. Outsourcing these activities can reduce the amount of time an internal team spends managing social media while allowing the strategy and content to remain focused on the platforms and audiences that matter most to the business.',
 7, 'published'),
('Which digital marketing services should I start with?',
 'The right digital marketing services depend on the business objective, target audience, available budget, and stage of growth. Businesses do not necessarily need to use every channel at once. A focused approach can start with the channel most closely aligned with the primary goal and expand as performance data provides more insight into what works.',
 8, 'published'),
('Why would my business need a PR agency?',
 'A PR agency can help businesses build relationships with journalists and media organizations and generate coverage around launches, announcements, and other significant developments. PR is particularly useful when credibility, awareness, and earned media coverage are important objectives. It can complement other marketing activities by creating attention beyond paid advertising.',
 9, 'published'),
('Does my film actually need Film PR?',
 'Film PR focuses on generating public and media attention around a film''s release. Activities can include pitching the film to critics, journalists, publications, and festival programmers to increase opportunities for coverage and visibility. The value of Film PR depends on the release strategy, target audience, distribution plans, and the level of media attention the film aims to generate.',
 10, 'published'),
('Do you handle event marketing too?',
 'Event marketing can cover the promotion and audience-building activities surrounding an event, from generating leads and registrations to supporting corporate activations and other events. The strategy depends on the type of event, its audience, and its objectives. Event marketing can be integrated with broader digital, creative, and PR activities when multiple channels are required.',
 11, 'published')
on conflict do nothing;

-- ─── Services — the four verticals ────────────────────────────────────────

insert into services (name, slug, tagline, quip, vertical_index, bullets, position, status, seo_title, seo_description) values
('Brand Foundation', 'brand-foundation',
 'Build what you stand on.',
 'Because "vibes" is not a positioning.',
 '01',
 '["Brand strategy & positioning","Brand naming","Brand identity design","Visual identity systems","Brand packaging","Brand audit & entry assessment","Brand guidelines"]'::jsonb,
 1, 'published',
 'Brand Strategy & Identity — Adversado',
 'Positioning, naming, identity systems and brand guidelines, defined in writing before a single deliverable is designed.'),
('Brand Marketing', 'brand-marketing',
 'Say it so people listen.',
 'Talking is not the same as being heard.',
 '02',
 '["Advertising campaigns (ATL & BTL)","Copywriting & content strategy","Social media strategy & management","Campaign planning & execution","Media planning"]'::jsonb,
 2, 'published',
 'Advertising & Brand Marketing — Adversado',
 'Campaigns, content and conversations that sound unmistakably like you, everywhere they show up.'),
('Brand Reach', 'brand-reach',
 'Make sure the right people find you.',
 'Van Gogh sold one painting in his lifetime. Don''t be Van Gogh.',
 '03',
 '["Performance marketing","SEO & digital presence","PR & media relations","Lead generation & digital marketing","Website design & development","Analytics & performance tracking"]'::jsonb,
 3, 'published',
 'Digital Marketing & PR — Adversado',
 'Performance, search, PR and digital presence working together so the brand compounds instead of just spends.'),
('Brand Experience', 'brand-experience',
 'Make people feel it.',
 'Nobody ever fell in love with a PDF.',
 '04',
 '["Event concept & production","Brand activations & pop-ups","Product & brand launches","Corporate events & conferences","Exhibition design & build","Market entry experiences"]'::jsonb,
 4, 'published',
 'Events & Brand Experience — Adversado',
 'Launches, events and activations designed with the same strategy that built the identity.')
on conflict (slug) do nothing;

-- ─── Team ─────────────────────────────────────────────────────────────────
-- Roles only. The site has never carried names, because the source material
-- doesn't: the portrait filenames in public/team are the only record.

insert into team_members (name, role_title, position, status) values
('Creative Head',        'Creative Head',        1, 'published'),
('Growth Head',          'Growth Head',          2, 'published'),
('Performance Manager',  'Performance Manager',  3, 'published'),
('Account Lead',         'Account Lead',         4, 'published'),
('Social Media Manager', 'Social Media Manager', 5, 'published'),
('Post Production Head', 'Post Production Head', 6, 'published')
on conflict do nothing;

-- ─── Booking engine ───────────────────────────────────────────────────────
-- The add-on ships with something bookable so the availability function has
-- real input the moment it is switched on.

insert into booking_services (name, slug, description, duration_minutes, buffer_minutes, position, is_active) values
('Brand audit call', 'brand-audit',
 'A 45-minute call where we look at where the brand is now and what is actually in the way.',
 45, 15, 1, true),
('Events consultation', 'events-consult',
 'A 30-minute call about an event you have in mind — scope, room, budget shape.',
 30, 10, 2, true),
('Introductory call', 'intro-call',
 'A short call to work out whether we are the right people for the job.',
 20, 10, 3, true)
on conflict (slug) do nothing;

-- Monday to Friday, 10:00–18:00 IST, all services.
insert into availability_rules (service_id, weekday, start_time, end_time, timezone)
select null, d, '10:00', '18:00', 'Asia/Kolkata'
from generate_series(1, 5) as d
on conflict do nothing;

-- ─── SEO defaults ─────────────────────────────────────────────────────────

update seo_settings set
  site_name = 'Adversado',
  title_template = '%s — Adversado',
  default_title = 'Adversado — The Brand Behind The Brands',
  default_description = 'Adversado is an integrated creative agency in Kochi building brands across India. Strategy to execution, one team, end to end.',
  organisation_jsonld = jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'Organization',
    'name', 'Adversado',
    'url', 'https://adversado.com',
    'email', 'Hello@adversado.com',
    'address', jsonb_build_object(
      '@type', 'PostalAddress',
      'streetAddress', 'Door No. 3312/B, Kailas Nagar, Puthiya Road, Palarivattom',
      'addressLocality', 'Ernakulam, Kochi',
      'postalCode', '682025',
      'addressCountry', 'IN'
    )
  )
where id = true;

-- ─── Lead tags ────────────────────────────────────────────────────────────

insert into lead_tags (name, colour) values
  ('Hot',        '#e6b325'),
  ('Retainer',   '#1f355e'),
  ('Events',     '#e6b325'),
  ('Referral',   '#1f355e'),
  ('Nurture',    '#212121')
on conflict (name) do nothing;

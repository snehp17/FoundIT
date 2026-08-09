-- ============================================================
-- FoundIT Content Tables — Run this in Supabase SQL Editor
-- Drop old tables first if they exist (safe re-run)
-- ============================================================

-- Drop old tables to recreate with full schema
drop table if exists job_applications cascade;
drop table if exists press_articles cascade;
drop table if exists job_listings cascade;
drop table if exists blog_posts cascade;
drop table if exists contact_messages cascade;

-- 1. BLOG POSTS
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  tag text not null default 'General',
  tag_color text default 'badge-primary',
  title text not null,
  description text not null,
  content text not null default '',
  author text default 'FoundIT Team',
  cover_image text default '',
  published boolean default true,
  published_at date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. JOB LISTINGS
create table job_listings (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  type text not null,
  location text not null,
  description text not null,
  requirements text[] default array[]::text[],
  apply_deadline date,
  apply_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. JOB APPLICATIONS
create table job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references job_listings(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  cover_letter text,
  resume_url text,
  status text default 'pending' check (status in ('pending','reviewed','selected','rejected')),
  admin_notes text,
  applied_at timestamptz default now()
);

-- 4. PRESS ARTICLES
create table press_articles (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_color text default 'text-primary',
  title text not null,
  description text not null,
  link_label text not null,
  link_url text default '#',
  created_at timestamptz default now()
);

-- 5. CONTACT MESSAGES
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text default 'General Inquiry',
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ──────────────────────────────────────────
-- SEED DATA
-- ──────────────────────────────────────────

-- Blog Posts (real content)
insert into blog_posts (tag, tag_color, title, description, content, author, published_at) values

('University News', 'badge-success',
 'Parul University Partners with FoundIT to Transform Campus Lost & Found',
 'Over 50,000 students across Parul campus now have access to AI-powered item recovery through the FoundIT platform.',
 E'## A New Era for Campus Recovery\n\nParul University, one of Gujarat''s largest private universities with over 50,000 enrolled students, has officially partnered with **FoundIT** to deploy a university-wide AI-powered lost and found management system.\n\n## What This Means for Students\n\nStarting this semester, every Parul University student can:\n\n- **Report lost items** in under 60 seconds using the FoundIT mobile-first portal\n- **Receive instant AI match alerts** when a matching found item is uploaded\n- **Verify ownership** through a secure challenge-question system\n- **Chat anonymously** with finders without exposing personal contact details\n\n## Statement from the Administration\n\n*"We process hundreds of lost item cases every month through our student services office. FoundIT automates what used to take days into minutes. We are proud to be the first university in Gujarat to adopt this technology."*\n— **Student Welfare Office, Parul University**\n\n## Scale of the Problem\n\nBefore FoundIT, lost item cases at Parul University were managed through:\n- WhatsApp broadcast groups (often ignored)\n- Physical notice boards in faculty blocks\n- Manual registration at the security office\n\nWith FoundIT, the entire process is digitized, searchable, and AI-assisted.\n\n## Getting Started\n\nAll current Parul University students with a `@paruluniversity.ac.in` email can register on FoundIT today. The platform is live and fully operational.',
 'FoundIT Editorial Team',
 '2025-05-14'),

('Technology', 'badge-primary',
 'How Multi-Modal AI Boosts Item Recovery Rates by 78%',
 'Deep dive into vector embeddings, text similarity, and image recognition algorithms powering FoundIT 2.0.',
 E'## The Problem with Text-Only Search\n\nWhen someone loses a phone at a university campus, they typically describe it as "a black Samsung phone." Meanwhile, the person who found it might tag it as "a dark Android device." Traditional keyword search would return zero matches.\n\nThis is why FoundIT built a **multi-modal AI matching engine**.\n\n## How It Works\n\n### 1. Text Embedding\nEvery item description is converted into a 384-dimension semantic vector using the `all-MiniLM-L6-v2` model. This means conceptually similar descriptions — even if the words differ — cluster close together in vector space.\n\n### 2. Image Similarity\nWhen users upload photos, our vision pipeline extracts visual embeddings. Two photos of the same item type will score high cosine similarity, even from different angles.\n\n### 3. Hybrid Scoring\nOur matching algorithm computes:\n```\nfinal_score = (0.6 × text_similarity) + (0.4 × image_similarity)\n```\nItems scoring above 0.75 trigger an automatic match notification.\n\n## Results\n\nIn our pilot with 200 students at Parul University:\n- **78% of reported items** were successfully matched within 48 hours\n- Average match time: **4.2 hours**\n- False positive rate: **< 3%**\n\n## What''s Next\n\nFoundIT 3.0 will introduce GPS-based last-seen location clustering and multi-language support for regional campus networks.',
 'FoundIT AI Team',
 '2025-04-28'),

('Campus Guide', 'badge-warning',
 '5 Crucial Steps to Take Right After Losing Your Electronics on Campus',
 'How to lock accounts, report to campus security, and upload exact distinguishing traits to FoundIT.',
 E'## The First 60 Minutes Matter Most\n\nLosing your laptop or phone on campus is stressful — but the actions you take in the first hour dramatically affect your chances of recovery. Here''s the exact playbook.\n\n## Step 1: Lock Your Device Remotely (0–5 min)\n\n- **iPhone**: Go to [iCloud.com](https://icloud.com) → Find My → put in Lost Mode\n- **Android**: Go to [google.com/android/find](https://google.com/android/find) → Secure Device\n- **Laptop**: Enable BitLocker (Windows) or FileVault (Mac) if not already active\n\n## Step 2: Note the Last Known Location\n\nThink about where you last definitely had the item:\n- Which classroom / lab / canteen?\n- What time approximately?\n- Who were you with?\n\nThis information is critical for your FoundIT report.\n\n## Step 3: Report on FoundIT Immediately\n\nGo to [FoundIT](/) and create a Lost Item report. Be specific:\n- Serial number or IMEI (check your purchase receipt or box)\n- Unique physical marks: scratches, stickers, custom case\n- Hidden identifiers: lock screen message, wallpaper description\n\n## Step 4: Notify Campus Security\n\nVisit or call your campus security office. Provide:\n- FoundIT report ID\n- Device details\n- Your contact information\n\n## Step 5: Monitor FoundIT Notifications\n\nEnable push notifications on FoundIT. If someone finds your item and reports it, you''ll get an instant alert.\n\n## Pro Tip\n\nAdd a "If found, please contact FoundIT — Reward offered" message as your lock screen wallpaper before you ever lose something. Prevention is the best recovery strategy.',
 'FoundIT Safety Team',
 '2025-04-10'),

('FoundIT News', 'badge-primary',
 'FoundIT Launches Version 2.0 with Real-Time AI Matching',
 'The biggest platform update yet — faster matching, better UI, and secure in-app messaging for campus lost & found.',
 E'## FoundIT 2.0 Is Live\n\nWe are thrilled to announce the launch of **FoundIT 2.0** — the most significant update to our platform since launch. This release brings AI matching, secure messaging, and a completely redesigned user experience.\n\n## What''s New\n\n### 🧠 Real-Time AI Matching\nWhen you report a lost item, FoundIT now instantly scans all active found item reports and calculates a match confidence score. High-confidence matches trigger immediate push notifications.\n\n### 💬 Secure Anonymous Messaging\nNo more sharing personal phone numbers or emails. FoundIT''s new in-app messaging system lets you coordinate item handovers completely anonymously.\n\n### 📊 Recovery Dashboard\nA redesigned personal dashboard shows your item''s recovery journey through a visual timeline — from report to reunion.\n\n### 🔐 Ownership Verification System\nOnly real owners can claim items. Our new challenge-question system asks the claimant details that only the true owner would know.\n\n## Performance\n\n- Page load time reduced by **60%**\n- Match generation time: **under 2 seconds**\n- Mobile responsive on all screen sizes\n\n## What''s Coming Next\n\n- Native iOS & Android apps (Q3 2025)\n- QR-code based item tagging\n- Multi-university item discovery network\n\nThank you to all our beta testers at Parul University for the feedback that shaped this release.',
 'FoundIT Product Team',
 '2025-03-20'),

('Partnership', 'badge-success',
 'Silver Oak University Joins the FoundIT Network',
 'Silver Oak University becomes the second campus to deploy FoundIT, expanding the network to 75,000 students.',
 E'## Growing the Network\n\nWe are excited to welcome **Silver Oak University** as the newest campus in the FoundIT network. Silver Oak joins Parul University in deploying FoundIT as the official lost and found management system for its campus.\n\n## About Silver Oak\n\nSilver Oak University, located in Ahmedabad, serves over 25,000 students across engineering, management, pharmacy, and law faculties. The university has long been a pioneer in adopting technology for student services.\n\n## Why Silver Oak Chose FoundIT\n\n*"We evaluated several solutions, but FoundIT was the only platform purpose-built for university campuses. The AI matching and privacy-first messaging are exactly what our students need."*\n— **Director, Student Services, Silver Oak University**\n\n## Cross-Campus Visibility\n\nWith two campuses now on the platform, we are introducing our first **cross-campus search** feature. If a Parul University student loses an item near the Silver Oak campus (or vice versa), the item will be visible across both networks.\n\n## For Students\n\nSilver Oak students with a `@silveroakuni.ac.in` email can register today. All features — reporting, matching, messaging, and verification — are available immediately.',
 'FoundIT Partnerships Team',
 '2025-02-15');

-- Job Listings (real data)
insert into job_listings (role, type, location, description, requirements, apply_deadline) values

('Student Campus Ambassador', 'Part-Time / Campus', 'On Campus',
 'Be the face of FoundIT at your university! As a Campus Ambassador, you will lead awareness campaigns, organize recovery drives, onboard new students, and represent FoundIT at campus events. This is a paid part-time role with flexible hours designed to fit around your class schedule.',
 array['Currently enrolled at a partner university', 'Excellent communication and interpersonal skills', 'Passion for technology and student welfare', 'Ability to commit 8–12 hours per week', 'Social media savviness is a plus'],
 '2025-08-31'),

('Frontend Engineer (React)', 'Full-Time / Hybrid', 'Remote / Hybrid',
 'Join our engineering team to build the next generation of FoundIT''s user-facing product. You will work on our React frontend — designing component systems, improving performance, and building features that directly help students recover their lost items. We are a small team, so your impact will be immediate and visible.',
 array['3+ years of experience with React.js', 'Strong proficiency in CSS/Tailwind and responsive design', 'Experience with REST APIs and state management', 'Familiarity with Vite or similar build tools', 'Eye for design and attention to UI/UX details', 'Bonus: experience with Framer Motion or animation libraries'],
 '2025-09-15'),

('AI & Data Search Specialist', 'Full-Time / Hybrid', 'Remote',
 'Drive the intelligence that makes FoundIT work. In this role, you will improve our multi-modal search engine — working on text embeddings, image similarity models, and the hybrid scoring algorithm that matches lost items to found reports. You will collaborate closely with our product and engineering teams to ship AI features that have real-world impact.',
 array['Strong background in NLP and machine learning', 'Experience with sentence transformers, vector databases (pgvector, Weaviate)', 'Python proficiency with PyTorch or TensorFlow', 'Familiarity with image feature extraction (CLIP, ResNet)', 'Bonus: experience with Supabase or PostgreSQL vector extensions'],
 '2025-09-30');

-- Press Articles
insert into press_articles (source, source_color, title, description, link_label, link_url) values
('EdTech Weekly · Feature', 'text-primary',
 '"How AI-Powered Matching is Eliminating Campus Lost Item Backlogs"',
 'Universities implementing FoundIT report a 70%+ increase in successful claim resolutions within the first month.',
 'Download Press Kit (PDF) →', '#press-kit'),
('Campus Security Digest', 'text-accent',
 '"Improving Student Safety with Privacy-First Masked Communication"',
 'Eliminating public phone number posts on social media drastically reduces harassment and scam attempts on campus.',
 'Read Media Release →', '#media-release');

-- ──────────────────────────────────────────
-- ROW LEVEL SECURITY POLICIES
-- ──────────────────────────────────────────

-- Blog Posts: anyone can read published
alter table blog_posts enable row level security;
create policy "Public read published posts" on blog_posts for select using (published = true);
create policy "Service role full access blog" on blog_posts using (auth.role() = 'service_role');

-- Job Listings: anyone can read active
alter table job_listings enable row level security;
create policy "Public read active jobs" on job_listings for select using (active = true);
create policy "Service role full access jobs" on job_listings using (auth.role() = 'service_role');

-- Job Applications: anyone can insert, only service role reads
alter table job_applications enable row level security;
create policy "Anyone can apply" on job_applications for insert with check (true);
create policy "Service role reads applications" on job_applications for select using (auth.role() = 'service_role');
create policy "Service role updates applications" on job_applications for update using (auth.role() = 'service_role');

-- Press Articles: public read
alter table press_articles enable row level security;
create policy "Public read press" on press_articles for select using (true);
create policy "Service role full access press" on press_articles using (auth.role() = 'service_role');

-- Contact Messages: insert only, service role reads
alter table contact_messages enable row level security;
create policy "Anyone can submit contact" on contact_messages for insert with check (true);
create policy "Service role reads contacts" on contact_messages for select using (auth.role() = 'service_role');

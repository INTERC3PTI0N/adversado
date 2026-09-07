/**
 * Database types.
 *
 * Hand-written rather than generated, so the app has types before the project
 * is linked. Once you have a project ref, regenerate to stay in lockstep:
 *
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
 *
 * Keep the exported names below stable if you do — the app imports them by
 * name, not by path into a generated shape.
 */

export type UserRole = "super_admin" | "admin" | "editor" | "client";
export type ContentStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived";
export type LeadSource =
  | "website"
  | "events"
  | "booking"
  | "referral"
  | "manual"
  | "import";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";
export type LeadPriority = "low" | "normal" | "high" | "urgent";
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partial"
  | "paid"
  | "overdue"
  | "void";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "review" | "done";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";
export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "on_hold"
  | "review"
  | "complete";
export type Importance = "low" | "normal" | "high";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Fields every SEO-bearing row carries. */
export type SeoFields = {
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  og_image_id: string | null;
  canonical_url: string | null;
  noindex: boolean;
  nofollow: boolean;
  structured_data: Json | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  client_id: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Media = {
  id: string;
  bucket: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  folder_id: string | null;
  uploaded_by: string | null;
  checksum: string | null;
  created_at: string;
  updated_at: string;
};

export type Page = SeoFields & {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_system: boolean;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type PageSection = {
  id: string;
  page_id: string;
  key: string;
  kind: string;
  label: string | null;
  position: number;
  status: ContentStatus;
  scheduled_at: string | null;
  published_at: string | null;
  data: Record<string, Json>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = SeoFields & {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: Json;
  cover_id: string | null;
  author_id: string | null;
  status: ContentStatus;
  published_at: string | null;
  scheduled_at: string | null;
  reading_minutes: number;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Project = SeoFields & {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  category: string | null;
  year: number | null;
  cover_id: string | null;
  gallery: Json;
  summary: string | null;
  body: Json;
  is_featured: boolean;
  position: number;
  status: ContentStatus;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CaseStudy = SeoFields & {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  challenge: string | null;
  approach: string | null;
  result: string | null;
  metrics: Json;
  cover_id: string | null;
  project_id: string | null;
  position: number;
  status: ContentStatus;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Service = SeoFields & {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  quip: string | null;
  body: Json;
  bullets: Json;
  vertical_index: string | null;
  cover_id: string | null;
  position: number;
  status: ContentStatus;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TeamMember = {
  id: string;
  name: string;
  role_title: string | null;
  bio: string | null;
  photo_id: string | null;
  socials: Json;
  position: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Testimonial = {
  id: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  company: string | null;
  avatar_id: string | null;
  rating: number | null;
  is_featured: boolean;
  position: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  position: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  budget: string | null;
  source: LeadSource;
  source_page: string | null;
  utm: Json;
  status: LeadStatus;
  priority: LeadPriority;
  owner_id: string | null;
  client_id: string | null;
  estimated_value: number | null;
  currency: string;
  score: number;
  is_read: boolean;
  first_contacted_at: string | null;
  won_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type FormSubmission = {
  id: string;
  form_id: string | null;
  form_key: string;
  lead_id: string | null;
  payload: Json;
  source_page: string | null;
  utm: Json;
  ip: string | null;
  user_agent: string | null;
  is_spam: boolean;
  created_at: string;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string | null;
  body: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadActivity = {
  id: number;
  lead_id: string;
  actor_id: string | null;
  type: string;
  meta: Json;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: Json;
  portal_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  client_id: string | null;
  lead_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  terms: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  position: number;
};

export type PmProject = {
  id: string;
  name: string;
  client_id: string | null;
  lead_id: string | null;
  status: ProjectStatus;
  progress: number;
  starts_on: string | null;
  due_on: string | null;
  owner_id: string | null;
  description: string | null;
  budget: number | null;
  is_visible_to_client: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PmTask = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  due_on: string | null;
  priority: LeadPriority;
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingService = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price: number | null;
  currency: string;
  max_per_day: number | null;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  service_id: string | null;
  lead_id: string | null;
  client_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  notes: string | null;
  cancel_token: string;
  reminded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  entity: string | null;
  entity_id: string | null;
  url: string | null;
  importance: Importance;
  read_at: string | null;
  created_at: string;
};

export type AuditEntry = {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: Json | null;
  after: Json | null;
  ip: string | null;
  created_at: string;
};

/**
 * Minimal shape the Supabase client needs.
 *
 * Insert/Update are plain `Partial<Row>` — intersecting them with an index
 * signature reads as "looser" but actually defeats supabase-js's inference and
 * collapses every query result to `never`.
 */
type TableOf<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type ViewOf<Row> = {
  Row: Row;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableOf<Profile>;
      clients: TableOf<Client>;
      media: TableOf<Media>;
      media_folders: TableOf<{ id: string; name: string; parent_id: string | null; path: string; created_at: string }>;
      pages: TableOf<Page>;
      page_sections: TableOf<PageSection>;
      section_revisions: TableOf<{ id: string; section_id: string; data: Json; note: string | null; created_by: string | null; created_at: string }>;
      posts: TableOf<Post>;
      tags: TableOf<{ id: string; name: string; slug: string; created_at: string }>;
      post_tags: TableOf<{ post_id: string; tag_id: string }>;
      projects: TableOf<Project>;
      case_studies: TableOf<CaseStudy>;
      services: TableOf<Service>;
      team_members: TableOf<TeamMember>;
      testimonials: TableOf<Testimonial>;
      faqs: TableOf<Faq>;
      seo_settings: TableOf<Record<string, Json>>;
      redirects: TableOf<{ id: string; from_path: string; to_path: string; status_code: number; is_active: boolean; hit_count: number; created_at: string }>;
      forms: TableOf<{ id: string; key: string; name: string; description: string | null; schema: Json; notify_emails: string[]; source: LeadSource; is_active: boolean; created_at: string; updated_at: string }>;
      form_submissions: TableOf<FormSubmission>;
      leads: TableOf<Lead>;
      lead_notes: TableOf<LeadNote>;
      lead_activities: TableOf<LeadActivity>;
      lead_tags: TableOf<{ id: string; name: string; colour: string }>;
      lead_tag_links: TableOf<{ lead_id: string; tag_id: string }>;
      invoices: TableOf<Invoice>;
      invoice_items: TableOf<InvoiceItem>;
      payments: TableOf<{ id: string; invoice_id: string; amount: number; method: string | null; reference: string | null; paid_at: string; created_by: string | null }>;
      pm_projects: TableOf<PmProject>;
      pm_tasks: TableOf<PmTask>;
      pm_milestones: TableOf<{ id: string; project_id: string; title: string; due_on: string | null; completed_at: string | null; position: number }>;
      pm_comments: TableOf<{ id: string; task_id: string; author_id: string | null; body: string; created_at: string }>;
      booking_services: TableOf<BookingService>;
      availability_rules: TableOf<{ id: string; service_id: string | null; weekday: number; start_time: string; end_time: string; timezone: string }>;
      availability_exceptions: TableOf<{ id: string; date: string; is_closed: boolean; start_time: string | null; end_time: string | null; reason: string | null }>;
      bookings: TableOf<Booking>;
      client_documents: TableOf<{ id: string; client_id: string; media_id: string | null; title: string; is_visible: boolean; uploaded_by: string | null; created_at: string }>;
      client_messages: TableOf<{ id: string; client_id: string; author_id: string | null; body: string; read_at: string | null; created_at: string }>;
      notifications: TableOf<Notification>;
      notification_prefs: TableOf<{ user_id: string; event_key: string; in_app: boolean; email: boolean }>;
      audit_log: TableOf<AuditEntry>;
    };
    Views: {
      lead_pipeline_summary: ViewOf<{
        status: LeadStatus;
        source: LeadSource;
        lead_count: number;
        pipeline_value: number;
        unread_count: number;
      }>;
      lead_daily_counts: ViewOf<{ day: string; source: LeadSource; lead_count: number }>;
      content_scheduled: ViewOf<{ entity: string; id: string; label: string; scheduled_at: string }>;
      invoice_summary: ViewOf<{
        status: InvoiceStatus;
        invoice_count: number;
        total_value: number;
        paid_value: number;
      }>;
    };
    Functions: {
      available_slots: {
        Args: { p_service_id: string; p_from: string; p_to: string };
        Returns: { slot_start: string; slot_end: string }[];
      };
      publish_scheduled_content: { Args: Record<string, never>; Returns: number };
    };
    Enums: {
      user_role: UserRole;
      content_status: ContentStatus;
      lead_source: LeadSource;
      lead_status: LeadStatus;
      lead_priority: LeadPriority;
      invoice_status: InvoiceStatus;
      task_status: TaskStatus;
      booking_status: BookingStatus;
      project_status: ProjectStatus;
      importance: Importance;
    };
    CompositeTypes: Record<string, never>;
  };
};

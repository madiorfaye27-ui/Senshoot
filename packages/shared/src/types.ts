// Hand-written domain types mirroring supabase/migrations/*.sql.
// The web app has no real generated Database type yet (lib/supabase/database.types.ts
// is a stub: `export type Database = any`), so these are kept in sync with the SQL
// by hand instead of via `supabase gen types`. Field names match DB columns (snake_case)
// since both apps read rows straight from supabase-js.

export type UserRole = 'client' | 'photographer' | 'admin';
export type PhotographerStatus = 'pending' | 'validated' | 'rejected' | 'suspended';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'suspended' | 'grace_period';
export type EventCategory =
  | 'mariage'
  | 'bapteme'
  | 'anniversaire'
  | 'conference'
  | 'concert'
  | 'festival'
  | 'sport'
  | 'professionnel'
  | 'remise_diplomes'
  | 'scolaire'
  | 'institutionnel'
  | 'shooting'
  | 'autre';
export type EventStatus = 'brouillon' | 'publie' | 'archive';
export type EventVisibility = 'public' | 'prive' | 'sur_invitation';
export type OrderStatus = 'en_attente' | 'payee' | 'echouee' | 'annulee' | 'remboursee';
export type PaymentStatus = 'en_attente' | 'initie' | 'reussi' | 'echoue' | 'annule' | 'rembourse';
export type PayoutStatus = 'pending' | 'completed' | 'rejected';
export type BookingStatus = 'en_attente' | 'contactee' | 'confirmee' | 'refusee';

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photographer {
  id: string;
  profile_id: string;
  slug: string;
  studio_name: string | null;
  description: string | null;
  logo_url: string | null;
  specialties: string[] | null;
  social_links: Record<string, string> | null;
  status: PhotographerStatus;
  commission_rate: number;
  city: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price_fcfa: number;
  max_events: number | null;
  max_storage_gb: number | null;
  max_photos: number | null;
  max_galleries: number | null;
  max_downloads: number | null;
  max_collaborators: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  photographer_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  starts_at: string;
  expires_at: string | null;
  renewed_at: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  photographer_id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  city: string | null;
  organizer: string | null;
  category: EventCategory;
  cover_image_url: string | null;
  status: EventStatus;
  visibility: EventVisibility;
  qr_code_url: string | null;
  qr_short_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  gallery_id: string;
  photo_number: string | null;
  original_url: string;
  web_url: string | null;
  thumbnail_url: string | null;
  watermark_url: string | null;
  price_fcfa: number;
  width: number | null;
  height: number | null;
  views_count: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string | null;
  guest_email: string | null;
  photographer_id: string;
  event_id: string | null;
  total_fcfa: number;
  payment_method: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  photo_id: string;
  unit_price_fcfa: number;
  downloaded: boolean;
  downloaded_at: string | null;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  provider_transaction_id: string | null;
  amount_fcfa: number;
  status: PaymentStatus;
  raw_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface OrderAccessToken {
  id: string;
  order_id: string;
  token: string;
  used_at: string | null;
  created_at: string;
}

export interface EventClientLink {
  id: string;
  event_id: string;
  token: string;
  used_at: string | null;
  created_at: string;
}

export interface BookingRequest {
  id: string;
  photographer_id: string;
  event_date: string;
  event_category: EventCategory | null;
  client_name: string;
  client_email: string;
  client_whatsapp: string | null;
  message: string | null;
  status: BookingStatus;
  created_at: string;
}

export interface Payout {
  id: string;
  photographer_id: string;
  amount_fcfa: number;
  payout_method: string;
  payout_details: string;
  status: PayoutStatus;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
}

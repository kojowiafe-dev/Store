export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ListingAvailabilityStatus =
  | 'DRAFT'
  | 'AVAILABLE'
  | 'NEEDS_CONFIRMATION'
  | 'SOLD_OUT'
  | 'EXPIRED'
  | 'PAUSED'
  | 'REMOVED';

export type ReportReason =
  | 'spam'
  | 'misleading'
  | 'inappropriate'
  | 'already_sold'
  | 'wrong_price'
  | 'prohibited_item'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          city: string;
          country: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          city: string;
          country?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          city?: string;
          country?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      halls: {
        Row: {
          id: string;
          university_id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          whatsapp_number: string;
          avatar_url: string | null;
          bio: string | null;
          is_admin: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          whatsapp_number: string;
          avatar_url?: string | null;
          bio?: string | null;
          is_admin?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          whatsapp_number?: string;
          avatar_url?: string | null;
          bio?: string | null;
          is_admin?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      seller_profiles: {
        Row: {
          id: string;
          user_id: string;
          hall_id: string;
          store_name: string;
          storefront_slug: string;
          storefront_image_url: string | null;
          store_description: string | null;
          is_approved: boolean;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hall_id: string;
          store_name: string;
          storefront_slug: string;
          storefront_image_url?: string | null;
          store_description?: string | null;
          is_approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hall_id?: string;
          store_name?: string;
          storefront_slug?: string;
          storefront_image_url?: string | null;
          store_description?: string | null;
          is_approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          sort_order: number;
          default_expiry_hours: number | null;
          default_confirm_lead_hours: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          sort_order?: number;
          default_expiry_hours?: number | null;
          default_confirm_lead_hours?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          sort_order?: number;
          default_expiry_hours?: number | null;
          default_confirm_lead_hours?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          category_id: string;
          slug: string;
          title: string;
          description: string | null;
          price: number | null;
          price_negotiable: boolean;
          currency: string;
          availability_status: ListingAvailabilityStatus;
          confirm_before: string | null;
          expires_at: string | null;
          expired_notified_at: string | null;
          deleted_at: string | null;
          search_vector: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          category_id: string;
          slug: string;
          title: string;
          description?: string | null;
          price?: number | null;
          price_negotiable?: boolean;
          currency?: string;
          availability_status?: ListingAvailabilityStatus;
          confirm_before?: string | null;
          expires_at?: string | null;
          expired_notified_at?: string | null;
          deleted_at?: string | null;
          search_vector?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          category_id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          price?: number | null;
          price_negotiable?: boolean;
          currency?: string;
          availability_status?: ListingAvailabilityStatus;
          confirm_before?: string | null;
          expires_at?: string | null;
          expired_notified_at?: string | null;
          deleted_at?: string | null;
          search_vector?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          storage_path: string;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          storage_path?: string;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      listing_events: {
        Row: {
          id: string;
          listing_id: string;
          actor_id: string | null;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          actor_id?: string | null;
          event_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          actor_id?: string | null;
          event_type?: string;
          payload?: Json;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          listing_id: string;
          reporter_id: string | null;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          reporter_id?: string | null;
          reason: ReportReason;
          details?: string | null;
          status?: ReportStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          reporter_id?: string | null;
          reason?: ReportReason;
          details?: string | null;
          status?: ReportStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}


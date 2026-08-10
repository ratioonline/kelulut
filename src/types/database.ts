export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      reservations: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          institution: string | null
          visit_date: string
          num_visitors: number
          program_id: string | null
          notes: string | null
          status: 'pending' | 'confirmed' | 'done' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          institution?: string | null
          visit_date: string
          num_visitors: number
          program_id?: string | null
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'done' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          institution?: string | null
          visit_date?: string
          num_visitors?: number
          program_id?: string | null
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'done' | 'cancelled'
          created_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          price: number | null
          duration: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          price?: number | null
          duration?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          price?: number | null
          duration?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number | null
          discount_price: number | null
          stock: number
          sold_count: number
          rating: number
          rating_count: number
          weight_gram: number | null
          images: string[]
          details: string | null
          image_url: string | null
          category: string | null
          is_available: boolean
          created_at: string
          // New UMKM fields
          umkm_id: string | null
          sku: string | null
          short_description: string | null
          minimum_stock: number
          unit: string
          minimum_order: number
          status: 'draft' | 'active' | 'inactive'
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price?: number | null
          discount_price?: number | null
          stock?: number
          sold_count?: number
          rating?: number
          rating_count?: number
          weight_gram?: number | null
          images?: string[]
          details?: string | null
          image_url?: string | null
          category?: string | null
          is_available?: boolean
          created_at?: string
          umkm_id?: string | null
          sku?: string | null
          short_description?: string | null
          minimum_stock?: number
          unit?: string
          minimum_order?: number
          status?: 'draft' | 'active' | 'inactive'
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price?: number | null
          discount_price?: number | null
          stock?: number
          sold_count?: number
          rating?: number
          rating_count?: number
          weight_gram?: number | null
          images?: string[]
          details?: string | null
          image_url?: string | null
          category?: string | null
          is_available?: boolean
          created_at?: string
          umkm_id?: string | null
          sku?: string | null
          short_description?: string | null
          minimum_stock?: number
          unit?: string
          minimum_order?: number
          status?: 'draft' | 'active' | 'inactive'
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          thumbnail_url: string | null
          author_id: string | null
          published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content: string
          thumbnail_url?: string | null
          author_id?: string | null
          published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string
          thumbnail_url?: string | null
          author_id?: string | null
          published?: boolean
          created_at?: string
        }
      }
      gallery: {
        Row: {
          id: string
          title: string | null
          description: string | null
          image_url: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          image_url: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          image_url?: string
          category?: string | null
          created_at?: string
        }
      }
      hero_slides: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          image_url: string
          badge_text: string | null
          cta_primary_label: string | null
          cta_primary_url: string | null
          cta_secondary_label: string | null
          cta_secondary_url: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          image_url: string
          badge_text?: string | null
          cta_primary_label?: string | null
          cta_primary_url?: string | null
          cta_secondary_label?: string | null
          cta_secondary_url?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          image_url?: string
          badge_text?: string | null
          cta_primary_label?: string | null
          cta_primary_url?: string | null
          cta_secondary_label?: string | null
          cta_secondary_url?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          buyer_name: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          buyer_name: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          buyer_name?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      },
      // ── NEW TABLES ──
      user_profiles: {
        Row: {
          id: string
          role: 'super_admin' | 'umkm_user'
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'super_admin' | 'umkm_user'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'super_admin' | 'umkm_user'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      umkms: {
        Row: {
          id: string
          user_id: string | null
          name: string
          slug: string
          owner_name: string | null
          short_description: string | null
          description: string | null
          whatsapp: string | null
          phone: string | null
          email: string | null
          address: string | null
          province: string | null
          city: string | null
          district: string | null
          village: string | null
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          logo: string | null
          cover_image: string | null
          website: string | null
          instagram: string | null
          facebook: string | null
          tiktok: string | null
          youtube: string | null
          year_established: number | null
          umkm_category: string | null
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          slug: string
          owner_name?: string | null
          short_description?: string | null
          description?: string | null
          whatsapp?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          province?: string | null
          city?: string | null
          district?: string | null
          village?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          logo?: string | null
          cover_image?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
          tiktok?: string | null
          youtube?: string | null
          year_established?: number | null
          umkm_category?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          slug?: string
          owner_name?: string | null
          short_description?: string | null
          description?: string | null
          whatsapp?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          province?: string | null
          city?: string | null
          district?: string | null
          village?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          logo?: string | null
          cover_image?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
          tiktok?: string | null
          youtube?: string | null
          year_established?: number | null
          umkm_category?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
      },
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      },
      stock_movements: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          previous_stock: number
          quantity: number
          movement_type: 'add' | 'subtract' | 'set' | 'adjustment'
          new_stock: number
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          previous_stock: number
          quantity: number
          movement_type: 'add' | 'subtract' | 'set' | 'adjustment'
          new_stock: number
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          previous_stock?: number
          quantity?: number
          movement_type?: 'add' | 'subtract' | 'set' | 'adjustment'
          new_stock?: number
          reason?: string | null
          created_at?: string
        }
      },
      review_replies: {
        Row: {
          id: string
          review_id: string
          umkm_id: string
          user_id: string | null
          reply: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          review_id: string
          umkm_id: string
          user_id?: string | null
          reply: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          umkm_id?: string
          user_id?: string | null
          reply?: string
          created_at?: string
          updated_at?: string
        }
      },
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          umkm_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          umkm_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          umkm_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
  }
}

// Convenience types
export type Reservation    = Database['public']['Tables']['reservations']['Row']
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
export type Program        = Database['public']['Tables']['programs']['Row']
export type ProgramInsert  = Database['public']['Tables']['programs']['Insert']
export type Product        = Database['public']['Tables']['products']['Row']
export type ProductInsert  = Database['public']['Tables']['products']['Insert']
export type Article        = Database['public']['Tables']['articles']['Row']
export type ArticleInsert  = Database['public']['Tables']['articles']['Insert']
export type GalleryItem    = Database['public']['Tables']['gallery']['Row']
export type GalleryItemInsert = Database['public']['Tables']['gallery']['Insert']
export type ProductReview  = Database['public']['Tables']['product_reviews']['Row']
export type HeroSlide      = Database['public']['Tables']['hero_slides']['Row']
export type HeroSlideInsert = Database['public']['Tables']['hero_slides']['Insert']

// New UMKM types
export type UserProfile       = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type Umkm              = Database['public']['Tables']['umkms']['Row']
export type UmkmInsert        = Database['public']['Tables']['umkms']['Insert']
export type Category          = Database['public']['Tables']['categories']['Row']
export type CategoryInsert    = Database['public']['Tables']['categories']['Insert']
export type StockMovement     = Database['public']['Tables']['stock_movements']['Row']
export type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert']
export type ReviewReply       = Database['public']['Tables']['review_replies']['Row']
export type ReviewReplyInsert = Database['public']['Tables']['review_replies']['Insert']
export type AuditLog          = Database['public']['Tables']['audit_logs']['Row']
export type AuditLogInsert    = Database['public']['Tables']['audit_logs']['Insert']

// Cart types (client-side only, no DB)
export interface CartItem {
  product: Product
  quantity: number
}

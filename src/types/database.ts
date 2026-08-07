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

// Cart types (client-side only, no DB)
export interface CartItem {
  product: Product
  quantity: number
}

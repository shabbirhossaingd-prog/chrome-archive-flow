export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
          label: string
        }
        Insert: {
          action: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
          label?: string
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string
          created_at: string
          excerpt: string
          featured: boolean
          featured_image: string
          id: string
          og_image: string
          published_at: string | null
          seo_description: string
          seo_title: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          excerpt?: string
          featured?: boolean
          featured_image?: string
          id?: string
          og_image?: string
          published_at?: string | null
          seo_description?: string
          seo_title?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          excerpt?: string
          featured?: boolean
          featured_image?: string
          id?: string
          og_image?: string
          published_at?: string | null
          seo_description?: string
          seo_title?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          code_prefix: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code_prefix?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code_prefix?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      category_counters: {
        Row: {
          category_slug: string
          last_number: number
          updated_at: string
        }
        Insert: {
          category_slug: string
          last_number?: number
          updated_at?: string
        }
        Update: {
          category_slug?: string
          last_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_counters_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      collections: {
        Row: {
          archived: boolean
          button_href: string
          button_label: string
          campaign_images: string[]
          collection_code: string
          created_at: string
          description: string
          drop_number: number
          editorial_images: string[]
          heading: string
          hero_image: string
          id: string
          is_current: boolean
          label: string
          marquee_text: string
          name: string
          published: boolean
          slug: string
          sort_order: number
          tagline: string
          updated_at: string
          year: string
        }
        Insert: {
          archived?: boolean
          button_href?: string
          button_label?: string
          campaign_images?: string[]
          collection_code?: string
          created_at?: string
          description?: string
          drop_number?: number
          editorial_images?: string[]
          heading?: string
          hero_image?: string
          id?: string
          is_current?: boolean
          label?: string
          marquee_text?: string
          name: string
          published?: boolean
          slug: string
          sort_order?: number
          tagline?: string
          updated_at?: string
          year?: string
        }
        Update: {
          archived?: boolean
          button_href?: string
          button_label?: string
          campaign_images?: string[]
          collection_code?: string
          created_at?: string
          description?: string
          drop_number?: number
          editorial_images?: string[]
          heading?: string
          hero_image?: string
          id?: string
          is_current?: boolean
          label?: string
          marquee_text?: string
          name?: string
          published?: boolean
          slug?: string
          sort_order?: number
          tagline?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          body: string
          content_json: Json
          created_at: string
          hero_image: string
          id: string
          label: string
          page_key: string
          seo_description: string
          seo_title: string
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          content_json?: Json
          created_at?: string
          hero_image?: string
          id?: string
          label?: string
          page_key: string
          seo_description?: string
          seo_title?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          content_json?: Json
          created_at?: string
          hero_image?: string
          id?: string
          label?: string
          page_key?: string
          seo_description?: string
          seo_title?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          archived: boolean
          care: string
          category: string
          collection_id: string | null
          collection_name: string
          created_at: string
          delivery: string
          details_content: string
          featured: boolean
          finish: string[]
          fit_gender: string
          full_description: string
          gallery_images: string[]
          id: string
          material: string
          material_content: string
          name: string
          new_collection: boolean
          old_price: number | null
          price: number
          primary_image: string
          product_code: string
          published: boolean
          quantity_available: number
          related_product_ids: string[]
          short_description: string
          size_description: string
          size_guide: string
          size_type: string
          sizes: string[]
          slug: string
          sort_order: number
          stock_status: string
          tags: string[]
          updated_at: string
          whatsapp_available: boolean
        }
        Insert: {
          archived?: boolean
          care?: string
          category: string
          collection_id?: string | null
          collection_name?: string
          created_at?: string
          delivery?: string
          details_content?: string
          featured?: boolean
          finish?: string[]
          fit_gender?: string
          full_description?: string
          gallery_images?: string[]
          id?: string
          material?: string
          material_content?: string
          name: string
          new_collection?: boolean
          old_price?: number | null
          price?: number
          primary_image?: string
          product_code: string
          published?: boolean
          quantity_available?: number
          related_product_ids?: string[]
          short_description?: string
          size_description?: string
          size_guide?: string
          size_type?: string
          sizes?: string[]
          slug: string
          sort_order?: number
          stock_status?: string
          tags?: string[]
          updated_at?: string
          whatsapp_available?: boolean
        }
        Update: {
          archived?: boolean
          care?: string
          category?: string
          collection_id?: string | null
          collection_name?: string
          created_at?: string
          delivery?: string
          details_content?: string
          featured?: boolean
          finish?: string[]
          fit_gender?: string
          full_description?: string
          gallery_images?: string[]
          id?: string
          material?: string
          material_content?: string
          name?: string
          new_collection?: boolean
          old_price?: number | null
          price?: number
          primary_image?: string
          product_code?: string
          published?: boolean
          quantity_available?: number
          related_product_ids?: string[]
          short_description?: string
          size_description?: string
          size_guide?: string
          size_type?: string
          sizes?: string[]
          slug?: string
          sort_order?: number
          stock_status?: string
          tags?: string[]
          updated_at?: string
          whatsapp_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          brand_name: string
          created_at: string
          currency_code: string
          currency_symbol: string
          default_care: string
          default_delivery: string
          default_size_guide: string
          email: string
          id: string
          instagram_url: string
          location: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          brand_name?: string
          created_at?: string
          currency_code?: string
          currency_symbol?: string
          default_care?: string
          default_delivery?: string
          default_size_guide?: string
          email?: string
          id?: string
          instagram_url?: string
          location?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          currency_code?: string
          currency_symbol?: string
          default_care?: string
          default_delivery?: string
          default_size_guide?: string
          email?: string
          id?: string
          instagram_url?: string
          location?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_product_code: { Args: { _category: string }; Returns: string }
      peek_product_code: { Args: { _category: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

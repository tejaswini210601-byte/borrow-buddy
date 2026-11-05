/**
 * TypeScript description of the database (tables, columns, functions).
 * Passing it to the Supabase client means a typo like `.from("itmes")` or
 * a wrong column name is caught by the editor before the code runs.
 *
 * Written to match supabase/migrations. Once the Supabase CLI is linked you
 * can regenerate it with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ItemCategory =
  | "electronics" | "books" | "tools" | "sports_outdoors" | "kitchen"
  | "home_garden" | "clothing" | "toys_games" | "other";
type ItemCondition = "new" | "like_new" | "good" | "fair";
type ListingStatus = "active" | "paused" | "removed";
type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
type BorrowingStatus = "active" | "returned" | "completed" | "cancelled";
type NotificationType =
  | "request_received" | "request_approved" | "request_rejected" | "request_cancelled"
  | "borrowing_reminder" | "item_returned" | "borrowing_completed" | "review_received";
type ReportKind = "question" | "item" | "user" | "bug" | "safety";
type ReportStatus = "open" | "reviewing" | "resolved";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          bio: string | null;
          area: string | null;
          avatar_path: string | null;
          is_moderator: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never; // created automatically on sign-up
        Update: { display_name?: string; bio?: string | null; area?: string | null; avatar_path?: string | null };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          lender_id: string;
          title: string;
          description: string;
          category: ItemCategory;
          condition: ItemCondition;
          area: string;
          status: ListingStatus;
          max_days: number | null;
          instructions: string | null;
          is_sample: boolean;
          search: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          lender_id: string;
          title: string;
          description: string;
          category: ItemCategory;
          condition: ItemCondition;
          area: string;
          status?: ListingStatus;
          max_days?: number | null;
          instructions?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          category?: ItemCategory;
          condition?: ItemCondition;
          area?: string;
          status?: ListingStatus;
          max_days?: number | null;
          instructions?: string | null;
        };
        Relationships: [
          { foreignKeyName: "items_lender_id_fkey"; columns: ["lender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      item_images: {
        Row: { id: string; item_id: string; storage_path: string; position: number; created_at: string };
        Insert: { item_id: string; storage_path: string; position?: number };
        Update: { position?: number };
        Relationships: [
          { foreignKeyName: "item_images_item_id_fkey"; columns: ["item_id"]; isOneToOne: false; referencedRelation: "items"; referencedColumns: ["id"] },
        ];
      };
      borrowing_requests: {
        Row: {
          id: string;
          item_id: string;
          borrower_id: string;
          lender_id: string;
          start_date: string;
          end_date: string;
          message: string | null;
          status: RequestStatus;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never; // use rpc("create_borrow_request")
        Update: never;
        Relationships: [
          { foreignKeyName: "borrowing_requests_item_id_fkey"; columns: ["item_id"]; isOneToOne: false; referencedRelation: "items"; referencedColumns: ["id"] },
          { foreignKeyName: "borrowing_requests_borrower_id_fkey"; columns: ["borrower_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "borrowing_requests_lender_id_fkey"; columns: ["lender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      borrowings: {
        Row: {
          id: string;
          request_id: string;
          item_id: string;
          borrower_id: string;
          lender_id: string;
          start_date: string;
          end_date: string;
          status: BorrowingStatus;
          pickup_details: string | null;
          returned_at: string | null;
          lender_confirmed_at: string | null;
          borrower_confirmed_at: string | null;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never; // created by rpc("approve_request")
        Update: never;
        Relationships: [
          { foreignKeyName: "borrowings_request_id_fkey"; columns: ["request_id"]; isOneToOne: true; referencedRelation: "borrowing_requests"; referencedColumns: ["id"] },
          { foreignKeyName: "borrowings_item_id_fkey"; columns: ["item_id"]; isOneToOne: false; referencedRelation: "items"; referencedColumns: ["id"] },
          { foreignKeyName: "borrowings_borrower_id_fkey"; columns: ["borrower_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "borrowings_lender_id_fkey"; columns: ["lender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: never; // created by the workflow functions
        Update: { read_at?: string | null };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          borrowing_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: never; // use rpc("submit_review")
        Update: never;
        Relationships: [
          { foreignKeyName: "reviews_reviewer_id_fkey"; columns: ["reviewer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "reviews_reviewee_id_fkey"; columns: ["reviewee_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          reporter_name: string;
          reporter_email: string;
          kind: ReportKind;
          item_id: string | null;
          reported_user_id: string | null;
          reference: string | null;
          message: string;
          status: ReportStatus;
          moderator_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          reporter_id?: string | null;
          reporter_name: string;
          reporter_email: string;
          kind: ReportKind;
          item_id?: string | null;
          reported_user_id?: string | null;
          reference?: string | null;
          message: string;
        };
        Update: { status?: ReportStatus; moderator_note?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_borrow_request: {
        Args: { p_item_id: string; p_start_date: string; p_end_date: string; p_message?: string | null };
        Returns: string;
      };
      approve_request: { Args: { p_request_id: string; p_pickup_details?: string | null }; Returns: string };
      reject_request: { Args: { p_request_id: string }; Returns: undefined };
      cancel_request: { Args: { p_request_id: string }; Returns: undefined };
      cancel_borrowing: { Args: { p_borrowing_id: string }; Returns: undefined };
      confirm_return: { Args: { p_borrowing_id: string }; Returns: BorrowingStatus };
      submit_review: {
        Args: { p_borrowing_id: string; p_rating: number; p_comment?: string | null };
        Returns: string;
      };
      item_booked_ranges: { Args: { p_item_id: string }; Returns: { start_date: string; end_date: string }[] };
      items_on_loan: { Args: { p_item_ids: string[] }; Returns: { item_id: string; due_back: string }[] };
      profile_stats: {
        Args: { p_user_id: string };
        Returns: {
          items_listed: number;
          items_borrowed: number;
          lends_completed: number;
          review_count: number;
          average_rating: number | null;
        }[];
      };
      is_moderator: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      item_category: ItemCategory;
      item_condition: ItemCondition;
      listing_status: ListingStatus;
      request_status: RequestStatus;
      borrowing_status: BorrowingStatus;
      notification_type: NotificationType;
      report_kind: ReportKind;
      report_status: ReportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

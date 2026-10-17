// Типи бази даних PROMAM.
// Тримаємо їх вручну, щоб відповідали supabase/migrations/0001_init.sql.
// Перегенерувати автоматично можна так:
//   npx supabase gen types typescript --project-id <ID> > src/lib/types.ts

export type MeetFormat =
  | 'coffee' | 'walk' | 'playground' | 'neighbors' | 'activity' | 'help'

export type PinStatus = 'active' | 'full' | 'done' | 'cancelled' | 'expired'

export type ParticipantStatus =
  | 'requested' | 'accepted' | 'declined' | 'on_the_way' | 'arrived' | 'cancelled'

export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

export type NotificationType =
  | 'pin_join_request' | 'pin_accepted' | 'pin_declined' | 'pin_reminder'
  | 'pin_on_the_way' | 'new_message' | 'friend_request' | 'friend_accepted'
  | 'new_review' | 'sos' | 'system'

export type ChildInfo = {
  name: string | null
  gender: 'girl' | 'boy' | 'other' | null
  age_months: number
}

export type Profile = {
  id: string
  display_name: string
  photo_url: string | null
  bio: string | null
  city: string | null
  birth_year: number | null
  /** Значок довіри. Сам номер лежить у profiles_private. */
  phone_verified: boolean
  interests: string[]
  looking_for: MeetFormat[]
  home_label: string | null
  show_in_friends: boolean
  rating: number
  reviews_count: number
  verification: VerificationStatus
  is_banned: boolean
  ban_reason: string | null
  onboarded_at: string | null
  last_seen_at: string
  created_at: string
  updated_at: string
}

/** Приватні поля. Читає й пише лише сама власниця (RLS: id = auth.uid()). */
export type ProfilePrivate = {
  id: string
  phone: string | null
  telegram_id: number | null
  telegram_username: string | null
  verification_photo_url: string | null
  updated_at: string
}

export type Child = {
  id: string
  profile_id: string
  name: string | null
  birth_month: string
  gender: 'girl' | 'boy' | 'other' | null
  created_at: string
}

export type Pin = {
  id: string
  author_id: string
  format: MeetFormat
  title: string
  description: string | null
  place_name: string | null
  starts_at: string
  expires_at: string
  capacity: number
  want_mom_age_min: number | null
  want_mom_age_max: number | null
  want_child_age_min: number | null
  want_child_age_max: number | null
  status: PinStatus
  chat_id: string | null
  created_at: string
  updated_at: string
}

/** Рядок, який повертає функція nearby_pins */
export type NearbyPin = {
  id: string
  author_id: string
  author_name: string
  author_photo: string | null
  author_rating: number
  author_reviews: number
  author_verified: boolean
  author_children: ChildInfo[]
  format: MeetFormat
  title: string
  description: string | null
  place_name: string | null
  lat: number
  lng: number
  distance_m: number
  starts_at: string
  expires_at: string
  capacity: number
  accepted_count: number
  status: PinStatus
  chat_id: string | null
  is_mine: boolean
  my_status: ParticipantStatus | null
  can_join: boolean
  block_reason: string | null
}

/** Рядок, який повертає функція find_friends */
export type FriendCandidate = {
  id: string
  display_name: string
  photo_url: string | null
  bio: string | null
  city: string | null
  mom_age: number | null
  rating: number
  reviews_count: number
  verified: boolean
  interests: string[]
  children: ChildInfo[]
  distance_m: number | null
  friendship: FriendshipStatus | null
}

export type Message = {
  id: string
  chat_id: string
  sender_id: string
  body: string | null
  photo_url: string | null
  reply_to: string | null
  created_at: string
  deleted_at: string | null
}

export type Review = {
  id: string
  author_id: string
  subject_id: string
  pin_id: string
  rating: number
  text: string | null
  created_at: string
}

export type TrustedContact = {
  id: string
  owner_id: string
  name: string
  phone: string | null
  telegram: string | null
  created_at: string
}

export type AppNotification = {
  id: string
  user_id: string
  type: NotificationType
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export type CircleKind = 'age' | 'life' | 'interest'

export type Circle = {
  id: string
  slug: string
  kind: CircleKind
  emoji: string
  title: string
  subtitle: string | null
  description: string | null
  is_sensitive: boolean
  allow_anonymous: boolean
  /** null у чутливих колах — кількість учасниць там не розкривається */
  members_count: number | null
  chat_id: string | null
  is_member: boolean
  i_am_anonymous: boolean
  /** коло підходить за віком дитини */
  suggested: boolean
}

export type CircleMessage = {
  id: string
  author_key: string
  author_name: string
  author_photo: string | null
  is_mine: boolean
  anonymous: boolean
  body: string | null
  photo_url: string | null
  created_at: string
}

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T> }

export type Database = {
  public: {
    Tables: {
      profiles: Row<Profile>
      profiles_private: Row<ProfilePrivate>
      children: Row<Child>
      pins: Row<Pin>
      pin_participants: Row<{
        pin_id: string
        user_id: string
        status: ParticipantStatus
        created_at: string
        updated_at: string
      }>
      chats: Row<{ id: string; pin_id: string | null; is_group: boolean; created_at: string }>
      chat_members: Row<{
        chat_id: string
        user_id: string
        last_read_at: string
        created_at: string
      }>
      messages: Row<Message>
      direct_chats: Row<{ user_a: string; user_b: string; chat_id: string }>
      friendships: Row<{
        requester_id: string
        addressee_id: string
        status: FriendshipStatus
        created_at: string
        updated_at: string
      }>
      blocks: Row<{ blocker_id: string; blocked_id: string; created_at: string }>
      reviews: Row<Review>
      trusted_contacts: Row<TrustedContact>
      sos_events: Row<{
        id: string
        user_id: string
        pin_id: string | null
        note: string | null
        created_at: string
        resolved_at: string | null
      }>
      reports: Row<{
        id: string
        reporter_id: string
        target_user_id: string | null
        target_pin_id: string | null
        message_id: string | null
        reason: string
        details: string | null
        status: 'open' | 'reviewing' | 'resolved' | 'rejected'
        created_at: string
      }>
      notifications: Row<AppNotification>
      push_subscriptions: Row<{
        id: string
        user_id: string
        endpoint: string
        keys: Record<string, string>
        created_at: string
      }>
      cards: Row<{
        id: string
        user_id: string
        kind: string
        serial: number
        issued_at: string
      }>
      circles: Row<{
        id: string
        slug: string
        kind: CircleKind
        emoji: string
        title: string
        subtitle: string | null
        description: string | null
        is_sensitive: boolean
        allow_anonymous: boolean
        auto_child_age_min: number | null
        auto_child_age_max: number | null
        sort_order: number
        chat_id: string | null
        members_count: number
        created_at: string
      }>
      circle_members: Row<{
        circle_id: string
        user_id: string
        anonymous: boolean
        alias: string | null
        joined_at: string
      }>
    }
    Views: Record<string, never>
    Functions: {
      nearby_pins: {
        Args: {
          in_lat: number
          in_lng: number
          radius_m?: number
          in_formats?: MeetFormat[] | null
          mom_age_min?: number | null
          mom_age_max?: number | null
          child_age_min?: number | null
          child_age_max?: number | null
        }
        Returns: NearbyPin[]
      }
      find_friends: {
        Args: {
          in_lat?: number | null
          in_lng?: number | null
          radius_m?: number
          in_interests?: string[] | null
          child_age_min?: number | null
          child_age_max?: number | null
        }
        Returns: FriendCandidate[]
      }
      open_direct_chat: { Args: { other: string }; Returns: string }
      set_home_point: { Args: { in_lat: number; in_lng: number }; Returns: void }
      create_pin: {
        Args: {
          in_format: MeetFormat
          in_title: string
          in_description?: string | null
          in_lat: number
          in_lng: number
          in_place_name?: string | null
          in_starts_at?: string
          in_hours?: number
          in_capacity?: number
          in_mom_age_min?: number | null
          in_mom_age_max?: number | null
          in_child_age_min?: number | null
          in_child_age_max?: number | null
        }
        Returns: string
      }
      move_pin: { Args: { p_id: string; in_lat: number; in_lng: number }; Returns: void }
      expire_old_pins: { Args: Record<string, never>; Returns: number }
      list_circles: { Args: Record<string, never>; Returns: Circle[] }
      join_circle: { Args: { c_id: string; as_anonymous?: boolean | null }; Returns: void }
      leave_circle: { Args: { c_id: string }; Returns: void }
      circle_messages: {
        Args: { c_id: string; before?: string | null; lim?: number }
        Returns: CircleMessage[]
      }
      send_circle_message: { Args: { c_id: string; text_body: string }; Returns: string }
    }
    Enums: {
      meet_format: MeetFormat
      pin_status: PinStatus
      participant_status: ParticipantStatus
      friendship_status: FriendshipStatus
      verification_status: VerificationStatus
      notification_type: NotificationType
    }
    CompositeTypes: Record<string, never>
  }
}

export type ReactionType = 'bone' | 'paw' | 'heart' | 'haha' | 'wow';
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'hamster' | 'rabbit' | 'other';
export type PetGender = 'male' | 'female';
export type PostVisibility = 'public' | 'followers' | 'private';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  locale?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  species: PetSpecies;
  breed?: string | null;
  gender: PetGender;
  birthday?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  personality: string[];
  follower_count: number;
  following_count: number;
  created_at?: string;
  updated_at?: string;
  owner?: Profile;
  is_following?: boolean;
}

export interface PostMedia {
  id: string;
  post_id: string;
  url: string;
  media_type: 'image' | 'video';
  mime_type?: string | null;
  file_size?: number | null;
  sort_order: number;
  created_at?: string;
}

export interface Reaction {
  id: string;
  post_id: string;
  pet_id: string;
  user_id: string;
  type: ReactionType;
  created_at?: string;
  pet?: Pet;
}

export interface Comment {
  id: string;
  post_id: string;
  pet_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  created_at?: string;
  updated_at?: string;
  pet?: Pet;
  author?: Profile;
}

export interface Post {
  id: string;
  pet_id: string;
  author_id: string;
  content: string;
  visibility: PostVisibility;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at?: string;
  pet: Pet;
  author?: Profile;
  media: PostMedia[];
  user_reaction?: ReactionType | null;
  user_reaction_pet_id?: string | null;
  top_reactions?: { type: ReactionType; count: number }[];
  recent_comments?: Comment[];
}

export interface Follow {
  id: string;
  follower_pet_id: string;
  following_pet_id: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_pet_id?: string | null;
  type: 'reaction' | 'comment' | 'follow' | 'system';
  reference_id?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_pet?: Pet;
}

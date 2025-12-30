export interface Profile {
  id: string;
  username: string | null;
  college: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Thread {
  id: string;
  title: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  thread_id: string;
  content: string;
  created_at: string;
  profiles?: Profile; // Joined data
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: Profile; // Joined data
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

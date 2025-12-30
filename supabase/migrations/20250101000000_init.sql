/*
  # College Social Platform Schema

  ## Query Description: This migration creates the initial schema for the social platform, including profiles, threads, posts, and comments tables with appropriate RLS policies. It also sets up a trigger for automatic profile creation.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Tables: profiles, threads, posts, comments
  - RLS: Enabled on all tables
  
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes
*/

-- Create tables
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  college text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.threads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) not null,
  thread_id uuid references public.threads(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) not null,
  author_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.profiles enable row level security;
alter table public.threads enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Policies
-- Profiles
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile." on public.profiles for insert with check (auth.uid() = id);

-- Threads
create policy "Threads are viewable by everyone." on public.threads for select using (true);
create policy "Authenticated users can create threads." on public.threads for insert with check (auth.role() = 'authenticated');

-- Posts
create policy "Posts are viewable by everyone." on public.posts for select using (true);
create policy "Authenticated users can create posts." on public.posts for insert with check (auth.uid() = author_id);
create policy "Users can update own posts." on public.posts for update using (auth.uid() = author_id);
create policy "Users can delete own posts." on public.posts for delete using (auth.uid() = author_id);

-- Comments
create policy "Comments are viewable by everyone." on public.comments for select using (true);
create policy "Authenticated users can create comments." on public.comments for insert with check (auth.uid() = author_id);
create policy "Users can update own comments." on public.comments for update using (auth.uid() = author_id);
create policy "Users can delete own comments." on public.comments for delete using (auth.uid() = author_id);

-- Trigger for new user profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to prevent errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed initial threads
insert into public.threads (title) values 
  ('General Discussion'),
  ('Computer Science'),
  ('Events & Parties'),
  ('Marketplace'),
  ('Study Groups');

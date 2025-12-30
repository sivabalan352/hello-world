import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Thread, Post } from '../types';
import { Button } from '../components/ui/Button';
import { MessageSquare, Clock, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Feed: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchThreads();
    fetchPosts();

    // Realtime subscription for new posts
    const subscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        const newPost = payload.new as Post;
        // We need to fetch the profile for the new post to display it correctly
        // For simplicity in this demo, we'll just re-fetch posts or append if we had the profile data
        fetchPosts(); 
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedThread]);

  const fetchThreads = async () => {
    const { data } = await supabase.from('threads').select('*').order('title');
    if (data) setThreads(data);
  };

  const fetchPosts = async () => {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          college
        )
      `)
      .order('created_at', { ascending: false });

    if (selectedThread) {
      query = query.eq('thread_id', selectedThread);
    }

    const { data, error } = await query;
    if (!error && data) {
      setPosts(data as any);
    }
    setLoading(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostContent.trim() || !selectedThread) return;

    setPosting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        content: newPostContent,
        thread_id: selectedThread,
        author_id: user.id,
      });

      if (error) throw error;
      setNewPostContent('');
      // Optimistic update or wait for realtime
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Threads */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Threads</h2>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedThread(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedThread === null
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Posts
            </button>
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedThread === thread.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                # {thread.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="lg:col-span-3 space-y-6">
        {/* Create Post Input */}
        <div className="bg-white rounded-lg shadow p-4">
          <form onSubmit={handleCreatePost}>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              placeholder={selectedThread ? `What's on your mind in #${threads.find(t => t.id === selectedThread)?.title}?` : "Select a thread to post..."}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              disabled={!selectedThread}
            />
            <div className="mt-3 flex justify-end">
              <Button type="submit" disabled={!selectedThread || !newPostContent.trim()} isLoading={posting}>
                Post
              </Button>
            </div>
          </form>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No posts found. Be the first to start the conversation!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-6 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {post.profiles?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {post.profiles?.college || 'Unknown College'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
              
              <div className="mt-4 text-gray-800 whitespace-pre-wrap">
                {post.content}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center text-gray-500 hover:text-primary-600 text-sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Comment
                  </button>
                </div>
                {selectedThread === null && (
                   <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                     # {threads.find(t => t.id === post.thread_id)?.title}
                   </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

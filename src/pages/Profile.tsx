import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Profile as ProfileType } from '../types';
import { User } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [college, setCollege] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  const getProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setCollege(data.college || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          college,
        })
        .eq('id', user!.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-primary-50 border-b border-primary-100">
          <h3 className="text-lg leading-6 font-medium text-primary-900">
            Student Profile
          </h3>
          <p className="mt-1 text-sm text-primary-700">
            Manage your public information and college details.
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-4xl">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <User className="h-12 w-12" />
              )}
            </div>
            {/* Avatar upload could go here */}
          </div>

          <form onSubmit={updateProfile} className="space-y-6">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="CoolStudent123"
            />

            <Input
              label="College / University"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. Stanford University"
            />

            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-500 text-sm">
                {user?.email}
              </div>
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
            </div>

            {message && (
              <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

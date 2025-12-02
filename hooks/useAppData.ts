
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Song, Group } from '../types';

export const useAppData = (session: any, currentView: string, currentSongId: string | null) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [publicSongData, setPublicSongData] = useState<Song | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch Public Song (Guest Mode)
  useEffect(() => {
    if (currentView === 'main' && currentSongId && !session) {
      fetchPublicSong(currentSongId);
    }
  }, [currentSongId, currentView, session]);

  const fetchPublicSong = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single();
    
    if (data && !error) {
      const s: Song = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        artist: data.artist,
        bpm: data.bpm,
        key: data.original_key,
        content: data.content,
        youtubeUrl: data.youtube_url,
        audioUrl: data.audio_url,
        is_public: data.is_public,
        is_favorite: false,
        genres: data.genres || [],
        tags: data.tags || []
      };
      setPublicSongData(s);
    }
    setLoading(false);
  };

  // Fetch User Data (Connected Mode)
  const fetchGroups = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('group_members')
      .select('*, groups(*)')
      .eq('user_id', session.user.id);
    
    if (!error && data) {
      const accepted = data.filter((m: any) => m.status === 'accepted').map((m: any) => m.groups).filter(Boolean);
      const pending = data.filter((m: any) => m.status === 'pending');
      setGroups(accepted);
      setPendingInvitesCount(pending.length);
    }
  }, [session]);

  const fetchUserProfile = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (data) {
      setIsAdmin(!!data.is_admin);
    }
  }, [session]);

  const fetchSongs = useCallback(async () => {
    if (!session) return;
    try {
      // 1. Fetch Songs
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (songsError) throw songsError;

      // 2. Fetch Favorites
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('song_id')
        .eq('user_id', session.user.id);
        
      if (favError) throw favError;
      
      const favoriteIds = new Set(favData?.map((f: any) => f.song_id));

      if (songsData) {
        const mappedSongs: Song[] = songsData.map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          title: s.title,
          artist: s.artist,
          bpm: s.bpm,
          key: s.original_key,
          content: s.content,
          youtubeUrl: s.youtube_url,
          audioUrl: s.audio_url, 
          is_public: s.is_public,
          is_favorite: favoriteIds.has(s.id),
          shared_with_group_id: s.shared_with_group_id,
          genres: s.genres || [],
          tags: s.tags || []
        }));
        setSongs(mappedSongs);
      }
    } catch (error: any) {
      console.error('Error fetching songs:', error.message);
    }
  }, [session]);

  // Initial Fetch
  useEffect(() => {
    if (session) {
      fetchSongs();
      fetchGroups();
      fetchUserProfile();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [session, fetchSongs, fetchGroups, fetchUserProfile]);

  return {
    songs,
    setSongs,
    groups,
    setGroups,
    pendingInvitesCount,
    loading,
    publicSongData,
    isAdmin,
    fetchSongs,
    fetchGroups
  };
};

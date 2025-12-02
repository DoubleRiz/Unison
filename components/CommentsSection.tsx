import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Comment } from '../types';
import { User, Send, Trash2, MessageSquare } from 'lucide-react';

interface CommentsSectionProps {
  songId: string;
  session: any;
  onOpenAuth: () => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ songId, session, onOpenAuth }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [songId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:users(username, avatar_url)')
      .eq('song_id', songId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      onOpenAuth();
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({
        song_id: songId,
        user_id: session.user.id,
        content: newComment.trim()
      })
      .select('*, user:users(username, avatar_url)')
      .single();

    if (!error && data) {
      setComments([...comments, data]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-12 pt-8 border-t border-slate-800">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <MessageSquare className="text-cyan-500" size={20} />
        Comments & Suggestions <span className="text-slate-500 text-sm font-normal">({comments.length})</span>
      </h3>

      {/* List */}
      <div className="space-y-6 mb-8">
        {loading ? (
          <div className="text-slate-500 text-sm">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-slate-500 text-sm italic">No comments yet. Be the first to suggest something!</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {comment.user?.avatar_url ? (
                  <img src={comment.user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">{comment.user?.username || 'Unknown User'}</span>
                    <span className="text-xs text-slate-500">{formatDate(comment.created_at)}</span>
                  </div>
                  {session && session.user.id === comment.user_id && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center">
           {session?.user?.user_metadata?.avatar_url ? (
             <img src={session.user.user_metadata.avatar_url} className="w-full h-full rounded-full object-cover"/>
           ) : <User size={18} className="text-slate-500"/>}
        </div>
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={session ? "Add a suggestion or comment..." : "Log in to add a suggestion..."}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-12 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit"
            disabled={submitting || (!session && !newComment)}
            className="absolute bottom-3 right-3 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-800"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentsSection;
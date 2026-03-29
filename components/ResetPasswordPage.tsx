
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AudioWaveform, ArrowRight, Loader2 } from 'lucide-react';

interface Props {
  onDone: () => void;
}

const ResetPasswordPage: React.FC<Props> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Mot de passe mis à jour !' });
      setTimeout(onDone, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-cyan-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/30 mx-auto mb-6 transform -rotate-3">
            <AudioWaveform className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Nouveau mot de passe</h1>
          <p className="text-slate-400 text-sm">Choisis un nouveau mot de passe pour ton compte.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Confirmer</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-900/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (<>Mettre à jour<ArrowRight size={20} /></>)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

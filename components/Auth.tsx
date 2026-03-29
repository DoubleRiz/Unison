
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowRight, Loader2, User, X, AudioWaveform } from 'lucide-react';

interface AuthProps {
  onClose?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Un lien de réinitialisation a été envoyé à ton adresse email.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: username,
            }
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! Please check your email or sign in.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (onClose) onClose();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Design Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>

        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        )}

        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-cyan-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/30 mx-auto mb-6 transform -rotate-3">
            <AudioWaveform className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent italic">UNISON</h1>
          <p className="text-slate-400 text-sm font-medium">Elevate your performance.</p>
        </div>

        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 transition-all font-medium"
                placeholder="musician@unison.com"
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
              {loading ? <Loader2 size={20} className="animate-spin" /> : (<>Envoyer le lien<ArrowRight size={20} /></>)}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4 relative z-10">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 transition-all font-medium"
                    placeholder="e.g. guitar_hero_99"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 transition-all font-medium"
                placeholder="musician@unison.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setMessage(null); }}
                    className="text-xs text-cyan-500 hover:text-cyan-400 font-medium"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  {mode === 'signin' ? 'Unlock Account' : 'Create Stage Identity'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-slate-500 relative z-10 font-medium">
          {mode === 'forgot' ? (
            <>
              <button
                onClick={() => { setMode('signin'); setMessage(null); }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-400/30 underline-offset-4"
              >
                Retour à la connexion
              </button>
            </>
          ) : (
            <>
              {mode === 'signin' ? "New to the band? " : "Already one of us? "}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-400/30 underline-offset-4"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;

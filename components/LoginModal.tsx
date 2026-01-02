import React, { useState } from 'react';
import { X, Lock, User, AlertCircle, ArrowLeft, Mail, Send, UserPlus } from 'lucide-react';
import { loginUser, registerUser } from '../firebase';

interface Props {
  onClose: () => void;
  onLogin: (user: any) => void;
  initialView?: 'login' | 'signup';
}

export const LoginModal: React.FC<Props> = ({ onClose, onLogin, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'signup' | 'reset'>(initialView);
  
  // Login/Signup State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const user = await loginUser(username, password);
        if (user) {
            onLogin(user);
        } else {
            setError('Invalid credentials.');
        }
    } catch (err) {
        setError('Login failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
          const user = await registerUser(username, password, email);
          onLogin(user);
      } catch (err: any) {
          setError(err.message || 'Registration failed.');
      } finally {
          setLoading(false);
      }
  };

  const handleReset = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
          setResetSent(true);
          setLoading(false);
      }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
       <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-gold-500/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950">
            <div>
                <h2 className="font-display text-2xl text-white uppercase tracking-wider">
                    {view === 'login' && 'Access Portal'}
                    {view === 'signup' && 'Create Account'}
                    {view === 'reset' && 'Reset Password'}
                </h2>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">
                    {view === 'login' && 'Secure Login'}
                    {view === 'signup' && 'Join the Directory'}
                    {view === 'reset' && 'Account Recovery'}
                </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} className="text-zinc-500 hover:text-white"/></button>
          </div>
          
          {/* Tabs for Login/Signup */}
          {view !== 'reset' && (
              <div className="flex border-b border-zinc-800">
                  <button onClick={() => { setView('login'); setError(''); }} className={`flex-1 py-3 text-sm font-bold uppercase transition ${view === 'login' ? 'bg-zinc-800 text-gold-400' : 'text-zinc-500 hover:text-white'}`}>Login</button>
                  <button onClick={() => { setView('signup'); setError(''); }} className={`flex-1 py-3 text-sm font-bold uppercase transition ${view === 'signup' ? 'bg-zinc-800 text-gold-400' : 'text-zinc-500 hover:text-white'}`}>Sign Up</button>
              </div>
          )}

          {view === 'login' || view === 'signup' ? (
            <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="p-8 space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm flex items-center gap-3">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                
                <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Username</label>
                <div className="relative group">
                    <User className="absolute left-3 top-3.5 text-zinc-600 group-focus-within:text-gold-400 transition" size={18}/>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50 transition placeholder-zinc-700" 
                        placeholder="Choose a username"
                        required
                    />
                </div>
                </div>

                {view === 'signup' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 text-zinc-600 group-focus-within:text-gold-400 transition" size={18}/>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50 transition placeholder-zinc-700" 
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </div>
                )}
                
                <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                    {view === 'login' && <button type="button" onClick={() => setView('reset')} className="text-xs text-gold-400 hover:text-white transition">Forgot Password?</button>}
                </div>
                <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 text-zinc-600 group-focus-within:text-gold-400 transition" size={18}/>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50 transition placeholder-zinc-700" 
                        placeholder="••••••••"
                        required
                    />
                </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gold-400 text-black font-bold p-4 rounded-lg uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-400/20"
                >
                    {loading ? (view === 'login' ? 'Authenticating...' : 'Creating Account...') : (view === 'login' ? 'Login' : 'Create Account')}
                </button>

                {view === 'login' && (
                    <div className="text-center">
                        <p className="text-zinc-600 text-xs">
                            New here? <button type="button" onClick={() => setView('signup')} className="text-gold-400 hover:underline">Create an account</button>
                        </p>
                    </div>
                )}
            </form>
          ) : (
            <div className="p-8 space-y-6">
                {!resetSent ? (
                    <form onSubmit={handleReset} className="space-y-6">
                        <p className="text-zinc-400 text-sm">Enter the email address associated with your account and we'll send you a link to reset your password.</p>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-zinc-600 group-focus-within:text-gold-400 transition" size={18}/>
                                <input 
                                    type="email" 
                                    required
                                    value={resetEmail} 
                                    onChange={e => setResetEmail(e.target.value)} 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50 transition placeholder-zinc-700" 
                                    placeholder="your@email.com" 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-zinc-800 text-white font-bold p-4 rounded-lg uppercase tracking-widest hover:bg-zinc-700 hover:text-gold-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sending...' : <><Send size={18}/> Send Reset Link</>}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-4">
                        <div className="inline-flex p-4 rounded-full bg-green-500/10 text-green-500 mb-4">
                            <Send size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
                        <p className="text-zinc-400 text-sm mb-6">We have sent a password reset link to <span className="text-gold-400">{resetEmail}</span>.</p>
                    </div>
                )}

                <button onClick={() => { setView('login'); setResetSent(false); }} className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition text-sm font-bold uppercase">
                    <ArrowLeft size={16} /> Back to Login
                </button>
            </div>
          )}
       </div>
    </div>
  );
};
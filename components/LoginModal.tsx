import React, { useState } from 'react';
import { X, Lock, User, AlertCircle, ArrowLeft, Mail, Send, Sparkles, ArrowRight, Check } from 'lucide-react';
import { loginUser, registerUser } from '../firebase';

interface Props {
  onClose: () => void;
  onLogin: (user: any, rememberMe: boolean) => void;
  initialView?: 'login' | 'signup';
}

export const LoginModal: React.FC<Props> = ({ onClose, onLogin, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'signup' | 'reset'>(initialView);
  
  // Login/Signup State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
            onLogin(user, rememberMe);
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
          onLogin(user, rememberMe);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
        {/* Glow Effect */}
        <div className="absolute w-full max-w-lg h-full max-h-[500px] bg-gold-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative bg-zinc-950 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition z-10 bg-black/20 hover:bg-white/10 rounded-full">
                <X size={20} />
            </button>

            {/* Header / Brand Area */}
            <div className="pt-12 pb-6 px-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>
                
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-black rounded-2xl mx-auto mb-6 flex items-center justify-center border border-white/10 shadow-xl shadow-gold/5 group">
                    <Sparkles size={28} className="text-gold-400 group-hover:scale-110 transition duration-500" />
                </div>
                
                <h2 className="font-display text-3xl text-white uppercase tracking-tight font-black mb-2">
                    {view === 'login' && 'Welcome Back'}
                    {view === 'signup' && 'Join the Elite'}
                    {view === 'reset' && 'Recovery'}
                </h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
                    {view === 'login' && 'Access your dashboard'}
                    {view === 'signup' && 'Start your journey today'}
                    {view === 'reset' && 'Secure account retrieval'}
                </p>
            </div>

            {/* Main Content Area */}
            <div className="px-8 pb-10">
                {view !== 'reset' ? (
                    <>
                         {/* Toggle Switch */}
                        <div className="flex bg-zinc-900/50 p-1 rounded-xl mb-8 border border-white/5 relative">
                            <button 
                                onClick={() => { setView('login'); setError(''); }} 
                                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'login' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => { setView('signup'); setError(''); }} 
                                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'signup' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Register
                            </button>
                        </div>

                        <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 animate-fade-in">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold-400 transition">
                                        <User size={18}/>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={username} 
                                        onChange={e => setUsername(e.target.value)} 
                                        className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 text-sm focus:border-gold-500/50 focus:bg-zinc-900/80 outline-none transition-all shadow-inner" 
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>
                            </div>

                            {view === 'signup' && (
                                <div className="space-y-1.5 animate-fade-in">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold-400 transition">
                                            <Mail size={18}/>
                                        </div>
                                        <input 
                                            type="email" 
                                            value={email} 
                                            onChange={e => setEmail(e.target.value)} 
                                            className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 text-sm focus:border-gold-500/50 focus:bg-zinc-900/80 outline-none transition-all shadow-inner" 
                                            placeholder="name@school.edu"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                                    {view === 'login' && (
                                        <button type="button" onClick={() => setView('reset')} className="text-[10px] font-bold text-gold-500/80 hover:text-gold-400 transition uppercase tracking-wider">
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold-400 transition">
                                        <Lock size={18}/>
                                    </div>
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 text-sm focus:border-gold-500/50 focus:bg-zinc-900/80 outline-none transition-all shadow-inner" 
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {/* Remember Me Checkbox */}
                            <div className="flex items-center gap-2 px-1">
                                <div 
                                    className={`w-5 h-5 rounded border border-white/10 flex items-center justify-center cursor-pointer transition ${rememberMe ? 'bg-gold-500 border-gold-500 text-black' : 'bg-zinc-900 text-transparent'}`}
                                    onClick={() => setRememberMe(!rememberMe)}
                                >
                                    <Check size={14} strokeWidth={4} />
                                </div>
                                <label onClick={() => setRememberMe(!rememberMe)} className="text-zinc-500 text-xs font-bold uppercase tracking-wide cursor-pointer select-none">Remember Me</label>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-white text-black font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-gold-400 transition-all transform active:scale-95 shadow-lg shadow-white/5 hover:shadow-gold-400/20 flex items-center justify-center gap-2 group mt-4"
                            >
                                {view === 'login' ? 'Enter Portal' : 'Create Account'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="animate-fade-in">
                         {/* Reset Password View */}
                         {!resetSent ? (
                            <form onSubmit={handleReset} className="space-y-6">
                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 text-zinc-400 text-xs leading-relaxed">
                                    Enter your registered email address. We'll send you a secure link to reset your access credentials.
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold-400 transition">
                                            <Mail size={18}/>
                                        </div>
                                        <input 
                                            type="email" 
                                            required
                                            value={resetEmail} 
                                            onChange={e => setResetEmail(e.target.value)} 
                                            className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 text-sm focus:border-gold-500/50 focus:bg-zinc-900/80 outline-none transition-all shadow-inner" 
                                            placeholder="name@school.edu" 
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-zinc-100 text-black font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-gold-400 transition-all flex items-center justify-center gap-2"
                                >
                                    <Send size={16}/> Send Link
                                </button>
                            </form>
                         ) : (
                             <div className="text-center py-8 animate-fade-in">
                                 <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4 border border-green-500/20">
                                     <Check size={32} />
                                 </div>
                                 <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
                                 <p className="text-zinc-500 text-sm mb-6">Link sent to <span className="text-gold-400 font-bold">{resetEmail}</span></p>
                             </div>
                         )}

                         <button onClick={() => { setView('login'); setResetSent(false); }} className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition text-[10px] font-black uppercase tracking-widest">
                            <ArrowLeft size={14} /> Back to Login
                         </button>
                    </div>
                )}
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm animate-fade-in">
                    <Sparkles size={48} className="text-gold-400 animate-pulse mb-4" />
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Authenticating...</p>
                </div>
            )}
        </div>
    </div>
  );
};
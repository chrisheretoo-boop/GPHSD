
import React, { useState, useEffect } from 'react';
import { ViewState, Business, SupportTicket, User as UserType } from './types';
import { db, getBusinesses, getFeaturedBusiness, getSupportTickets, updateTicketStatus, getUsers, deleteUser, updateUserPassword, updateUserProfile, uploadImage, getGlobalSettings } from './firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { EditBusinessModal } from './components/EditBusinessModal';
import { CreateBusinessModal } from './components/CreateBusinessModal';
import { BusinessProfile } from './components/BusinessProfile';
import { LoginModal } from './components/LoginModal';
import { SupportModal } from './components/SupportModal';
import { ReplyModal } from './components/ReplyModal';
import { PolicyModal } from './components/PolicyModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatInterface } from './components/ChatInterface';
import { Search, ShieldCheck, LogOut, LayoutDashboard, User, X, Star, ArrowRight, ArrowLeft, Instagram, Twitter, Facebook, LifeBuoy, Store, CheckCircle, Clock, Users, Trash2, Reply, Settings, Key, Eye, UserPlus, MapPin, Mail, Phone, Linkedin, Send, Music2, Loader2, ChevronRight, Sparkles, EyeOff, AlertTriangle, ExternalLink, Plus, Camera, Upload, Rocket, BadgeCheck, RefreshCw, BarChart3, Fingerprint, History, MessageSquare } from 'lucide-react';

// --- SHARED COMPONENTS ---

const DeleteConfirmationModal = ({ title, message, onConfirm, onCancel, loading }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, loading: boolean }) => (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
        <div className="bg-zinc-900 w-full max-w-md rounded-[3rem] border border-red-500/20 shadow-2xl p-12 text-center relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-20"></div>
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500 ring-8 ring-red-500/5">
                <Trash2 size={44} />
            </div>
            <h3 className="text-3xl font-display text-white mb-3 uppercase tracking-tighter">{title}</h3>
            <p className="text-zinc-500 mb-12 text-sm leading-relaxed px-4 font-medium">{message}</p>
            <div className="flex flex-col gap-3">
                <button onClick={onConfirm} disabled={loading} className="w-full py-5 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95">
                    {loading ? <Loader2 size={16} className="animate-spin"/> : 'Decommission Venture'}
                </button>
                <button onClick={onCancel} disabled={loading} className="w-full py-4 rounded-2xl bg-zinc-800 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 hover:text-white transition duration-300">Abort Deletion</button>
            </div>
        </div>
    </div>
);

// --- CORE APP COMPONENTS ---

const Navbar = ({ onNav, user, onLogout, onLoginClick, onRegisterClick }: any) => (
  <nav className="fixed top-0 w-full z-40 h-20 glass flex items-center justify-between px-6 lg:px-16 transition-all">
    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNav('home')}>
      <div className="font-display text-2xl font-black tracking-tighter text-white">
        GPHS<span className="text-gold font-light tracking-widest ml-1 opacity-80">DIRECTORY</span>
      </div>
    </div>
    <div className="flex items-center gap-3 lg:gap-6">
      <button onClick={onRegisterClick} className="hidden sm:flex items-center gap-2 text-zinc-400 hover:text-white transition text-[10px] font-bold uppercase tracking-[0.2em]">
         <UserPlus size={14}/> List Business
      </button>
      <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
      {user ? (
        <div className="flex items-center gap-3">
          {(user.role === 'admin' || user.role === 'moderator') && (
            <button onClick={() => onNav('admin')} className="p-2 text-zinc-400 hover:text-gold transition" title="Admin Portal">
              <LayoutDashboard size={20} />
            </button>
          )}
          <button onClick={() => onNav('chat')} className="p-2 text-zinc-400 hover:text-gold transition relative group" title="Encrypted Chat">
              <MessageSquare size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-black animate-pulse"></span>
          </button>
          <button onClick={() => onNav('owner')} className="flex items-center gap-2 px-4 py-2 rounded-full glass border-gold/20 text-gold text-[10px] font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition">
             <User size={14} /> Account
          </button>
          <button onClick={onLogout} className="text-zinc-500 hover:text-red-500 transition"><LogOut size={18}/></button>
        </div>
      ) : (
        <button onClick={onLoginClick} className="px-6 py-2 bg-gold text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-lg shadow-gold/10">
          Login
        </button>
      )}
    </div>
  </nav>
);

const Advertisement = ({ onRegister }: { onRegister: () => void }) => (
    <div className="w-full max-w-7xl mx-auto mb-16 animate-fade-in">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 group">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition duration-700"></div>
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-10 md:p-16 relative z-10 items-center">
                <div className="space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gold text-[10px] font-black uppercase tracking-widest mb-4">
                            <Rocket size={12} /> Launch Your Brand
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl text-white uppercase leading-[0.9] tracking-tight">
                            Is Your Business <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200">On The Map?</span>
                        </h2>
                    </div>
                    <p className="text-zinc-500 text-lg leading-relaxed max-w-md font-medium">
                        Join the official GPHS Directory. Gain visibility, connect with fellow students, and grow your customer base instantly.
                    </p>

                     {/* Selling Points */}
                    <div className="grid gap-6 border-l-2 border-white/10 pl-6 my-8">
                        <div className="space-y-1">
                             <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide">
                                 <LifeBuoy size={16} className="text-gold"/> Integrated Help Desk
                             </div>
                             <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                                 Professionalize your operations with a built-in customer support ticketing system. Manage inquiries directly from your dashboard.
                             </p>
                        </div>
                        <div className="space-y-1">
                             <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide">
                                 <Users size={16} className="text-blue-500"/> Direct Community Access
                             </div>
                             <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                                 Reach the entire student body and faculty through a verified, centralized platform designed for growth.
                             </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button onClick={onRegister} className="px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold transition shadow-xl shadow-white/5 transform active:scale-95 flex items-center gap-2">
                            <Plus size={16}/> Start Listing
                        </button>
                    </div>
                </div>
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl group-hover:shadow-gold/5 transition duration-500">
                    <img 
                        src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2670&auto=format&fit=crop" 
                        className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0" 
                        alt="List your business" 
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition"></div>
                </div>
            </div>
        </div>
    </div>
);

const Hero = ({ featured, onSelect, onRegister }: any) => {
  const [motto, setMotto] = useState("Connecting the Gwynn Park High School community with the finest student-led businesses, crafts, and professional services.");

  useEffect(() => {
    fetch('https://v2.jokeapi.dev/joke/Any?safe-mode')
      .then(res => res.json())
      .then(data => {
        if (data.error) return;
        if (data.type === 'single') {
          setMotto(data.joke);
        } else if (data.type === 'twopart') {
          setMotto(`${data.setup} ${data.delivery}`);
        }
      })
      .catch(err => console.warn("Using default motto"));
  }, []);

  return (
  <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 bg-zinc-950">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-square bg-gold/5 rounded-full blur-[160px] pointer-events-none opacity-50"></div>
    <div className="max-w-4xl mx-auto text-center relative z-10 mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-white/5 text-gold-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 animate-fade-in shadow-xl">
          <Sparkles size={12}/> Discover Excellence
      </div>
      <h1 className="font-display text-6xl md:text-9xl font-black text-white mb-8 leading-[0.85] tracking-tighter uppercase animate-fade-in">
        The Future of <br/>
        <span className="text-gradient">Student Trade</span>
      </h1>
      <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed opacity-0 animate-fade-in [animation-delay:200ms] min-h-[4rem] flex items-center justify-center">
        {motto}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-fade-in [animation-delay:400ms]">
         <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold transition" size={18} />
            <input 
              type="text" 
              placeholder="Search services..." 
              className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:border-gold/50 focus:outline-none transition-all shadow-2xl"
            />
         </div>
         <button onClick={onRegister} className="px-10 py-4 bg-white text-black font-display text-lg font-black uppercase rounded-2xl hover:bg-gold transition-all transform hover:scale-105 active:scale-95">
            Join the Market
         </button>
      </div>
    </div>

    {/* Advertisement placed inside Hero, above featured business */}
    <div className="w-full max-w-7xl mx-auto relative z-10 opacity-0 animate-fade-in [animation-delay:500ms]">
        <Advertisement onRegister={onRegister} />
    </div>

    {featured && (
      <div className="w-full max-w-5xl mx-auto opacity-0 animate-fade-in [animation-delay:600ms]">
         <div onClick={() => onSelect(featured)} className="relative glass-card rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row items-center gap-10 group cursor-pointer">
            <div className="w-full md:w-1/2 aspect-[4/3] rounded-3xl overflow-hidden bg-black shadow-2xl">
               <img src={featured.images[0] || featured.imageURL || 'mascot.png'} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" />
            </div>
            <div className="flex-1 space-y-4">
               <div className="flex items-center gap-2 text-gold text-xs font-black uppercase tracking-widest">
                  <Star size={14} fill="currentColor"/> Editor's Choice
               </div>
               <h2 className="font-display text-4xl md:text-6xl text-white leading-tight">{featured.business}</h2>
               <p className="text-zinc-500 text-lg line-clamp-3 leading-relaxed">{featured.description}</p>
               <div className="flex items-center gap-4 pt-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                          {featured.ownerImg ? <img src={featured.ownerImg} className="w-full h-full object-cover"/> : <User size={18} className="text-zinc-500"/>}
                      </div>
                      <div>
                          <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Ownership</div>
                          <div className="text-white font-bold">{featured.ownerName || featured.owner}</div>
                      </div>
                  </div>
                  <ChevronRight className="ml-auto text-zinc-700 group-hover:text-gold transition group-hover:translate-x-2" size={32}/>
               </div>
            </div>
         </div>
      </div>
    )}
  </section>
  );
};

const CategoryFilter = ({ active, onSelect }: any) => {
  const categories = ['All', 'General', 'Food & Drink', 'Clothing', 'Services', 'Technology', 'Art & Design'];
  return (
    <div className="max-w-7xl mx-auto px-6 mb-12">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-4">
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => onSelect(c)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${active === c ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'}`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
};

const getAverageRating = (reviews: any[]) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
};

const Grid = ({ businesses, onSelect }: any) => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    {businesses.length === 0 ? (
       <div className="text-center py-32 glass-card rounded-3xl">
           <Store size={48} className="text-zinc-800 mx-auto mb-6"/>
           <p className="text-2xl font-display text-zinc-500 uppercase">No active listings in this category</p>
       </div>
    ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {businesses.map((b: any) => {
            const isExpired = b.subscriptionEnd && Number(b.subscriptionEnd) < Date.now();
            const rating = getAverageRating(b.reviews);
            const reviewCount = b.reviews ? b.reviews.length : 0;

            return (
            <div key={b.id} onClick={() => onSelect(b)} className="glass-card rounded-[2.5rem] overflow-hidden group cursor-pointer flex flex-col h-full relative">
                <div className="h-72 overflow-hidden relative">
                    <div className="absolute top-6 right-6 z-20 flex gap-2">
                         {b.verified && (
                             <div className="bg-blue-500 text-white p-2 rounded-xl shadow-xl flex items-center justify-center">
                                 <BadgeCheck size={14} fill="currentColor" className="text-white" />
                             </div>
                         )}
                         {b.featured && <div className="bg-gold text-black p-2 rounded-xl shadow-xl"><Star size={14} fill="black" /></div>}
                         {isExpired && <div className="bg-red-500 text-white px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest">Expired</div>}
                    </div>
                    
                    {/* Rating Overlay */}
                    {reviewCount > 0 && (
                        <div className="absolute top-6 left-6 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white">
                            <Star size={12} className="text-gold fill-gold" />
                            <span className="text-xs font-bold">{rating}</span>
                            <span className="text-[10px] text-zinc-400">({reviewCount})</span>
                        </div>
                    )}

                    <img src={b.images[0] || b.imageURL || ''} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 grayscale-[20%] group-hover:grayscale-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-6 left-6 z-20">
                        <div className="text-gold text-[10px] font-black uppercase tracking-[0.2em] mb-1">{b.category}</div>
                        <h3 className="font-display text-3xl text-white group-hover:text-gold transition leading-none">{b.business}</h3>
                    </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                    <p className="text-zinc-500 text-sm line-clamp-2 mb-8 flex-1 leading-relaxed font-medium">{b.description}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                             {isExpired ? <span className="text-red-500">Subscription Required</span> : 'Active Listing'}
                        </div>
                        <span className="text-white text-xs font-bold bg-zinc-800 px-4 py-1.5 rounded-full border border-white/5">
                            {b.price || '$-$$'}
                        </span>
                    </div>
                </div>
            </div>
        )})}
        </div>
    )}
  </div>
);

const Footer = ({ onNav, onLogin, onRegister, onSupport, onPolicy, settings }: any) => (
  <footer className="bg-zinc-950 pt-32 pb-16 px-6 border-t border-white/5">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
      <div className="col-span-1 md:col-span-1">
        <div className="font-display text-3xl font-black text-white uppercase tracking-tighter mb-8">
          GPHS<span className="text-gold font-light opacity-50 ml-1">DIR</span>
        </div>
        <p className="text-zinc-600 text-sm leading-relaxed max-w-xs font-medium">
          Empowering the next generation of entrepreneurs through a unified school marketplace.
        </p>
      </div>
      <div>
        <h4 className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8">Navigation</h4>
        <ul className="space-y-4 text-sm font-bold text-zinc-500">
          <li><button onClick={() => onNav('home')} className="hover:text-gold transition text-left">Marketplace</button></li>
          <li><button onClick={onRegister} className="hover:text-gold transition text-left">List Business</button></li>
          <li><button onClick={onLogin} className="hover:text-gold transition text-left">Portal Login</button></li>
          <li><button onClick={onSupport} className="hover:text-gold transition text-left">Get Help</button></li>
          <li><button onClick={() => onPolicy('terms')} className="hover:text-gold transition text-left">Terms of Service</button></li>
          <li><button onClick={() => onPolicy('privacy')} className="hover:text-gold transition text-left">Privacy Policy</button></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8">Connect</h4>
        <ul className="space-y-4 text-sm font-bold text-zinc-500">
          <li className="flex items-center gap-3 text-left"><MapPin size={16} className="text-gold opacity-50 shrink-0"/> {settings?.contactName || "Gwynn Park High"}</li>
          <li className="flex items-center gap-3 text-left"><Mail size={16} className="text-gold opacity-50 shrink-0"/> {settings?.contactEmail || "support@gphs.edu"}</li>
          <li className="flex items-center gap-3 text-left"><Phone size={16} className="text-gold opacity-50 shrink-0"/> {settings?.contactPhone || "(240) 623-8773"}</li>
        </ul>
      </div>
      <div>
        <h4 className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8">Updates</h4>
        <p className="text-zinc-600 text-xs mb-6 font-medium">Join our weekly digest for new student drops.</p>
        <div className="flex gap-2">
           <input type="email" placeholder="Email" className="bg-zinc-900 border border-white/5 text-white px-5 py-3 rounded-2xl w-full text-xs focus:outline-none focus:border-gold/30 placeholder-zinc-700" />
           <button className="bg-gold text-black p-3 rounded-2xl hover:bg-white transition flex items-center justify-center"><Send size={18} /></button>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 opacity-50 pt-12 border-t border-white/5">
       <div className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">© 2025 GPHS Student Directory</div>
       <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-zinc-500 hover:text-gold transition cursor-pointer"><Instagram size={18}/></div>
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-zinc-500 hover:text-gold transition cursor-pointer"><Twitter size={18}/></div>
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-zinc-500 hover:text-gold transition cursor-pointer"><Music2 size={18}/></div>
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-zinc-500 hover:text-gold transition cursor-pointer"><Linkedin size={18}/></div>
       </div>
    </div>
  </footer>
);

// --- GLOBAL IDENTITY COMPONENT ---

const GlobalProfileEditor = ({ user, onUpdate }: any) => {
    const [formData, setFormData] = useState(user);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUserProfile(user.id, formData);
            onUpdate(formData);
            alert("Global Identity updated!");
        } catch (e) {
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadImage(file);
            setFormData({ ...formData, profileImg: url });
        } catch (e) {
            alert("Photo upload failed.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-card rounded-[3rem] p-12 mb-20 border border-gold/10 relative overflow-hidden group/editor">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover/editor:bg-gold/10 transition duration-1000"></div>
            <div className="relative z-10 flex flex-col lg:flex-row gap-20">
                <div className="flex flex-col items-center shrink-0">
                    <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-white/5 bg-zinc-900 flex items-center justify-center group-hover/avatar:border-gold/30 transition duration-500 shadow-2xl">
                            {formData.profileImg ? <img src={formData.profileImg} className="w-full h-full object-cover"/> : <User size={80} className="text-zinc-800"/>}
                        </div>
                        <div className="absolute inset-0 bg-black/60 rounded-[3rem] flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition shadow-2xl backdrop-blur-md">
                             {uploading ? <Loader2 size={32} className="animate-spin text-gold"/> : <Camera size={32} className="text-white"/>}
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload}/>
                    <div className="mt-8 text-center">
                        <div className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2 justify-center">
                            <Fingerprint size={16} className="text-gold opacity-60"/>
                            {user.username}
                        </div>
                        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest opacity-80">
                             Unified Portal ID
                        </div>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Public Display Handle</label>
                        <input value={formData.displayName || ''} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white focus:border-gold/30 outline-none transition text-sm font-medium"/>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Contact Reference</label>
                        <input value={formData.contactInfo || ''} onChange={e => setFormData({...formData, contactInfo: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white focus:border-gold/30 outline-none transition text-sm font-medium"/>
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Entrepreneurial Biography</label>
                        <textarea value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} rows={3} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white focus:border-gold/30 outline-none transition text-sm font-medium resize-none leading-relaxed"/>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-4 pt-6">
                        <button onClick={handleSave} disabled={loading || uploading} className="bg-white text-black px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gold transition-all transform active:scale-95 shadow-2xl flex items-center gap-4">
                            {loading ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                            Update Command Identity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- APP CORE ---

const App = () => {
  const [view, setView] = useState<ViewState>('home');
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [category, setCategory] = useState('All');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showCreateBiz, setShowCreateBiz] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'terms' | null>(null);
  
  const [settings, setSettings] = useState<any>({});
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<{ active: boolean; text: string }>({ active: false, text: 'Processing...' });

  useEffect(() => { 
      loadBusinesses(); 
      loadSettings();
      // Check for remembered user
      const storedUser = localStorage.getItem('gphs_user');
      if (storedUser) {
          try {
              const u = JSON.parse(storedUser);
              if (u && u.username) {
                  setUser(u);
                  if (u.role === 'admin') setView('admin');
              }
          } catch (e) {
              console.error("Failed to parse stored user", e);
              localStorage.removeItem('gphs_user');
          }
      }
  }, []);

  const loadSettings = async () => {
      const s = await getGlobalSettings();
      setSettings(s);
  };

  const loadBusinesses = async () => {
    setLoading(true);
    setError('');
    try {
        const data = await getBusinesses();
        data.sort((a, b) => (a.order ?? 10000) - (b.order ?? 10000));
        setBusinesses(data);
    } catch (e: any) {
        console.error("Initialization Failed:", e);
        setError("Database Connection Failure: " + (e.message || "Unknown error"));
    } finally {
        setLoading(false);
    }
  };

  const executeDeleteBusiness = async (biz: Business) => {
      setProcessing({ active: true, text: 'Executing Decommission Protocol...' });
      try {
          if (!biz.id) throw new Error("Reference mismatch: Missing Business ID");
          console.log(`Decommissioning Venture: ${biz.id}`);
          await deleteUser(biz.id, 'applications');
          setBusinessToDelete(null);
          await loadBusinesses();
      } catch (e: any) {
          alert("Decommissioning failed: " + (e.message || "Unknown communication error"));
      } finally {
          setProcessing({ active: false, text: '' });
      }
  };

  const handleLogin = (u: any, rememberMe: boolean) => {
    setUser(u);
    setShowLogin(false);
    setShowRegister(false);
    
    if (rememberMe) {
        localStorage.setItem('gphs_user', JSON.stringify(u));
    } else {
        localStorage.removeItem('gphs_user');
    }

    if (u.role === 'admin') setView('admin');
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('gphs_user');
      setView('home');
  };

  const handleBusinessClick = (b: Business) => {
    setProcessing({ active: true, text: 'Accessing Terminal...' });
    setTimeout(() => {
        setSelectedBusiness(b);
        setView('profile');
        setProcessing({ active: false, text: '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1000);
  };

  const handleManageClick = (b: Business) => {
    setProcessing({ active: true, text: 'Decrypting Interface...' });
    setTimeout(() => {
        setEditingBusiness(b);
        setProcessing({ active: false, text: '' });
    }, 1000);
  };

  const handleBack = () => {
      setProcessing({ active: true, text: 'Recalibrating Navigation...' });
      setTimeout(() => {
          setView('home');
          setProcessing({ active: false, text: '' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
  }

  const featured = businesses.find(b => b.featured && (!b.subscriptionEnd || Number(b.subscriptionEnd) > Date.now())) || null;
  const myBusinesses = user ? businesses.filter(b => b.owner === user.username) : [];

  if (loading) {
     return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-gold-400 animate-fade-in">
             <Sparkles size={64} className="animate-pulse mb-6"/>
             <div className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Initializing Terminal...</div>
        </div>
     );
  }

  if (error) {
      return (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white animate-fade-in p-6 text-center">
             <AlertTriangle size={64} className="text-red-500 mb-8"/>
             <h2 className="text-3xl font-display uppercase text-red-500 mb-4 tracking-tighter">Connection Error</h2>
             <p className="text-zinc-500 text-sm max-w-md mb-12 leading-relaxed">
                 The encrypted database link is currently unstable. Please verify your network authentication.
             </p>
             <button onClick={loadBusinesses} className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-gold transition-all active:scale-95 shadow-2xl">
                 <RefreshCw size={18}/> Re-initialize Connection
             </button>
          </div>
      );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans selection:bg-gold selection:text-black scroll-smooth relative">
      {view !== 'admin' && view !== 'chat' && <Navbar onNav={setView} user={user} onLogout={handleLogout} onLoginClick={() => setShowLogin(true)} onRegisterClick={() => user ? setView('owner') : setShowRegister(true)}/>}

      {view === 'home' && (
        <div className="animate-fade-in">
           <Hero featured={featured} onSelect={handleBusinessClick} onRegister={() => user ? setView('owner') : setShowRegister(true)} />
           <CategoryFilter active={category} onSelect={setCategory} />
           <Grid businesses={businesses.filter(b => b.status === 'approved' && (category === 'All' || b.category === category))} onSelect={handleBusinessClick} />
           <Footer onNav={setView} onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} onSupport={() => setShowSupport(true)} onPolicy={setPolicyType} settings={settings} />
        </div>
      )}

      {view === 'profile' && selectedBusiness && (
        <BusinessProfile business={selectedBusiness} onBack={handleBack} user={user} onLogin={() => setShowLogin(true)} onRefresh={loadBusinesses} />
      )}

      {view === 'admin' && user?.role === 'admin' && (
        <AdminDashboard user={user} onLogout={handleLogout} onNav={setView} />
      )}

      {view === 'chat' && user && (
          <ChatInterface user={user} onClose={() => setView(user.role === 'admin' ? 'admin' : 'home')} />
      )}

      {view === 'owner' && user && (
          <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-fade-in">
              <h2 className="text-4xl font-display text-white uppercase mb-8">Command Center</h2>
              
              <GlobalProfileEditor user={user} onUpdate={(u: any) => { setUser(u); localStorage.setItem('gphs_user', JSON.stringify(u)); }} />
              
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-display text-white uppercase">My Ventures</h3>
                  <button onClick={() => setShowCreateBiz(true)} className="bg-gold text-black px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition flex items-center gap-2">
                      <Plus size={16}/> New Listing
                  </button>
              </div>

              {myBusinesses.length === 0 ? (
                  <div className="p-12 rounded-[2.5rem] border border-white/5 bg-zinc-900/50 text-center">
                      <p className="text-zinc-500 mb-6 font-medium">You haven't listed any businesses yet.</p>
                      <button onClick={() => setShowCreateBiz(true)} className="text-gold hover:text-white transition text-xs font-bold uppercase tracking-widest">Start your first venture</button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {myBusinesses.map(b => (
                          <div key={b.id} className="glass-card rounded-[2rem] p-6 relative group">
                              <div className="flex items-start justify-between mb-4">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black">
                                      <img src={b.images[0] || 'mascot.png'} className="w-full h-full object-cover"/>
                                  </div>
                                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${b.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                      {b.status}
                                  </div>
                              </div>
                              <h4 className="text-xl font-bold text-white mb-1">{b.business}</h4>
                              <p className="text-zinc-500 text-xs mb-6 line-clamp-2">{b.description}</p>
                              
                              <div className="flex gap-2">
                                  <button onClick={() => handleManageClick(b)} className="flex-1 py-3 bg-zinc-800 hover:bg-gold hover:text-black rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2">
                                      <Settings size={14}/> Manage
                                  </button>
                                  <button onClick={() => setBusinessToDelete(b)} className="p-3 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition">
                                      <Trash2 size={16}/>
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {(showLogin || showRegister) && (
          <LoginModal 
              initialView={showRegister ? 'signup' : 'login'} 
              onClose={() => { setShowLogin(false); setShowRegister(false); }} 
              onLogin={handleLogin} 
          />
      )}

      {showCreateBiz && user && (
          <CreateBusinessModal 
              user={user} 
              onClose={() => setShowCreateBiz(false)} 
              onRefresh={loadBusinesses} 
          />
      )}

      {editingBusiness && (
          <EditBusinessModal 
              business={editingBusiness} 
              onClose={() => setEditingBusiness(null)} 
              onRefresh={loadBusinesses} 
              isAdmin={user?.role === 'admin'}
          />
      )}

      {showSupport && (
          <SupportModal onClose={() => setShowSupport(false)} />
      )}

      {policyType && (
          <PolicyModal type={policyType} onClose={() => setPolicyType(null)} />
      )}
      
      {businessToDelete && (
          <DeleteConfirmationModal 
              title="Confirm Deletion" 
              message={`Are you sure you want to delete ${businessToDelete.business}? This cannot be undone.`} 
              onConfirm={() => executeDeleteBusiness(businessToDelete)} 
              onCancel={() => setBusinessToDelete(null)}
              loading={processing.active}
          />
      )}
    </div>
  );
};

export default App;

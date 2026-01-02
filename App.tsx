import React, { useState, useEffect } from 'react';
import { ViewState, Business, SupportTicket, User as UserType } from './types';
// Fixed: Removed 'seedDatabase' from imports as it is not exported from firebase.ts
import { db, getBusinesses, getFeaturedBusiness, getSupportTickets, updateTicketStatus, getUsers, deleteUser, updateUserPassword, updateUserProfile, uploadImage } from './firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { EditBusinessModal } from './components/EditBusinessModal';
import { CreateBusinessModal } from './components/CreateBusinessModal';
import { BusinessProfile } from './components/BusinessProfile';
import { LoginModal } from './components/LoginModal';
import { SupportModal } from './components/SupportModal';
import { ReplyModal } from './components/ReplyModal';
import { PolicyModal } from './components/PolicyModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Search, ShieldCheck, LogOut, LayoutDashboard, User, X, Star, ArrowRight, Instagram, Twitter, Facebook, LifeBuoy, Store, CheckCircle, Clock, Users, Trash2, Reply, Settings, Key, Eye, UserPlus, MapPin, Mail, Phone, Linkedin, Send, Music2, Loader2, ChevronRight, Sparkles, EyeOff, AlertTriangle, ExternalLink, Plus, Camera, Upload, Rocket, BadgeCheck } from 'lucide-react';

// --- SHARED ADMIN COMPONENTS ---

const DeleteConfirmationModal = ({ title, message, onConfirm, onCancel, loading }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, loading: boolean }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
        <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-red-500/30 shadow-2xl p-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-display text-white text-center mb-2 uppercase tracking-wide">{title}</h3>
            <p className="text-zinc-500 text-center mb-10 text-sm leading-relaxed">{message}</p>
            <div className="flex gap-4">
                <button onClick={onCancel} disabled={loading} className="flex-1 py-4 rounded-xl bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 transition">Cancel</button>
                <button onClick={onConfirm} disabled={loading} className="flex-1 py-4 rounded-xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition flex items-center justify-center gap-2 shadow-xl shadow-red-600/20">
                    {loading ? <Loader2 size={16} className="animate-spin"/> : 'Confirm Delete'}
                </button>
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
            return (
            <div key={b.id} onClick={() => onSelect(b)} className="glass-card rounded-[2.5rem] overflow-hidden group cursor-pointer flex flex-col h-full">
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

const Footer = ({ onNav, onLogin, onRegister, onSupport, onPolicy }: any) => (
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
          <li className="flex items-center gap-3 text-left"><MapPin size={16} className="text-gold opacity-50 shrink-0"/> Gwynn Park High</li>
          <li className="flex items-center gap-3 text-left"><Mail size={16} className="text-gold opacity-50 shrink-0"/> support@gphs.edu</li>
          <li className="flex items-center gap-3 text-left"><Phone size={16} className="text-gold opacity-50 shrink-0"/> (240) 623-8773</li>
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
            alert("Global Identity updated across all businesses and reviews!");
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
        <div className="glass-card rounded-[2.5rem] p-10 mb-20 border border-gold/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col lg:flex-row gap-16">
                <div className="flex flex-col items-center shrink-0">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gold/20 bg-zinc-900 flex items-center justify-center">
                            {formData.profileImg ? <img src={formData.profileImg} className="w-full h-full object-cover"/> : <User size={48} className="text-zinc-700"/>}
                        </div>
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-2xl">
                             {uploading ? <Loader2 size={24} className="animate-spin text-gold"/> : <Camera size={24} className="text-white"/>}
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload}/>
                    <div className="mt-4 text-center">
                        <div className="text-white font-black uppercase text-[10px] tracking-widest">{user.username}</div>
                        <div className="text-gold text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Verified Owner</div>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Public Display Name</label>
                        <input value={formData.displayName || ''} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:border-gold/30 outline-none transition text-sm font-medium"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Contact Point (Email/Phone)</label>
                        <input value={formData.contactInfo || ''} onChange={e => setFormData({...formData, contactInfo: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:border-gold/30 outline-none transition text-sm font-medium"/>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Owner Bio (Appears on all listings)</label>
                        <textarea value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:border-gold/30 outline-none transition text-sm font-medium resize-none"/>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button onClick={handleSave} disabled={loading || uploading} className="bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-all transform active:scale-95 shadow-xl">
                            {loading ? 'Updating Identity...' : 'Sync Global Profile'}
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

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<{ active: boolean; text: string }>({ active: false, text: 'Processing...' });

  useEffect(() => { loadBusinesses(); }, []);

  const loadBusinesses = async () => {
    const data = await getBusinesses();
    // Sort by order so that items with lower order index appear first.
    // If order is undefined, it defaults to a large number to appear at the end.
    data.sort((a, b) => (a.order ?? 10000) - (b.order ?? 10000));
    setBusinesses(data);
    setLoading(false);
  };

  const handleLogin = (u: any) => {
    setUser(u);
    setShowLogin(false);
    setShowRegister(false);
    if (u.role === 'admin') setView('admin');
  };

  const handleBusinessClick = (b: Business) => {
    setProcessing({ active: true, text: 'Accessing Portal...' });
    setTimeout(() => {
        setSelectedBusiness(b);
        setView('profile');
        setProcessing({ active: false, text: '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1000);
  };

  const handleManageClick = (b: Business) => {
    setProcessing({ active: true, text: 'Securing Connection...' });
    setTimeout(() => {
        setEditingBusiness(b);
        setProcessing({ active: false, text: '' });
    }, 1000);
  };

  const handleBack = () => {
      setProcessing({ active: true, text: 'Returning to Hub...' });
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
             <Sparkles size={48} className="animate-pulse mb-4"/>
             <div className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Initializing Directory...</div>
        </div>
     );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans selection:bg-gold selection:text-black scroll-smooth relative">
      {view !== 'admin' && <Navbar onNav={setView} user={user} onLogout={() => { setUser(null); setView('home'); }} onLoginClick={() => setShowLogin(true)} onRegisterClick={() => user ? setView('owner') : setShowRegister(true)}/>}

      {view === 'home' && (
        <div className="animate-fade-in">
           <Hero featured={featured} onSelect={handleBusinessClick} onRegister={() => user ? setView('owner') : setShowRegister(true)} />
           <CategoryFilter active={category} onSelect={setCategory} />
           <Grid businesses={businesses.filter(b => b.status === 'approved' && (category === 'All' || b.category === category))} onSelect={handleBusinessClick} />
           <Footer onNav={setView} onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} onSupport={() => setShowSupport(true)} onPolicy={setPolicyType} />
        </div>
      )}

      {view === 'profile' && selectedBusiness && (
        <BusinessProfile business={selectedBusiness} onBack={handleBack} user={user} onLogin={() => setShowLogin(true)} onRefresh={loadBusinesses} />
      )}

      {view === 'admin' && user?.role === 'admin' && (
        <AdminDashboard user={user} onLogout={() => { setUser(null); setView('home'); }} />
      )}

      {view === 'owner' && user && (
          <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto min-h-screen animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                <div>
                   <h1 className="font-display text-6xl text-white uppercase leading-none">Account <br/><span className="text-gold">Command</span></h1>
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Unified Identity v2.0</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={() => setShowCreateBiz(true)} className="flex-1 md:flex-none px-8 py-3.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold transition flex items-center justify-center gap-2 shadow-xl shadow-white/5">
                        <Plus size={16}/> New Venture
                    </button>
                    <button onClick={() => handleBack()} className="flex-1 md:flex-none px-8 py-3.5 glass rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition">Back Home</button>
                </div>
              </div>

              <GlobalProfileEditor user={user} onUpdate={(updated: any) => setUser({...user, ...updated})} />

              <h2 className="font-display text-4xl text-white uppercase mb-10">Your Portfolio</h2>
              {myBusinesses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {myBusinesses.map(biz => (
                        <div key={biz.id} className="glass-card rounded-[2.5rem] p-6 flex flex-col group h-full">
                            <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 bg-black">
                                <img src={biz.images[0] || biz.imageURL || 'mascot.png'} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[10px] font-black text-gold border border-gold/20 uppercase tracking-widest">{biz.category}</div>
                            </div>
                            <h3 className="text-3xl font-display text-white mb-2 leading-none">{biz.business}</h3>
                            <p className="text-zinc-500 text-xs line-clamp-2 mb-8 flex-1 leading-relaxed">{biz.description}</p>
                            <div className="flex gap-3 pt-6 border-t border-white/5">
                                <button onClick={() => handleManageClick(biz)} className="flex-1 py-3.5 bg-zinc-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gold hover:text-black transition">Manage</button>
                                <button onClick={() => handleBusinessClick(biz)} className="p-3.5 glass text-white rounded-2xl hover:bg-zinc-800 transition"><Eye size={18}/></button>
                            </div>
                        </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-24 glass-card rounded-[3rem]">
                      <Store size={48} className="text-zinc-900 mx-auto mb-6"/>
                      <p className="text-zinc-500 font-display uppercase">No Active Listings</p>
                  </div>
              )}
          </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
      {showRegister && <LoginModal onClose={() => setShowRegister(false)} onLogin={handleLogin} initialView="signup"/>}
      {showCreateBiz && user && <CreateBusinessModal user={user} onClose={() => setShowCreateBiz(false)} onRefresh={loadBusinesses}/>}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {policyType && <PolicyModal type={policyType} onClose={() => setPolicyType(null)} />}
      {editingBusiness && <EditBusinessModal business={editingBusiness} onClose={() => setEditingBusiness(null)} onRefresh={loadBusinesses} isAdmin={user?.role === 'admin'} />}

      {/* Global Processing Overlay */}
      {(processing.active) && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm animate-fade-in">
             <Sparkles size={48} className="text-gold animate-pulse mb-4"/>
             <div className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">{processing.text}</div>
        </div>
      )}
    </div>
  );
};

export default App;
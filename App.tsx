import React, { useState, useEffect } from 'react';
import { ViewState, Business, SupportTicket, User as UserType } from './types';
import { db, getBusinesses, getFeaturedBusiness, getSupportTickets, updateTicketStatus, getUsers, deleteUser, seedDatabase, updateUserPassword } from './firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { EditBusinessModal } from './components/EditBusinessModal';
import { CreateBusinessModal } from './components/CreateBusinessModal';
import { BusinessProfile } from './components/BusinessProfile';
import { LoginModal } from './components/LoginModal';
import { SupportModal } from './components/SupportModal';
import { ReplyModal } from './components/ReplyModal';
import { PolicyModal } from './components/PolicyModal';
import { Search, ShoppingBag, ShieldCheck, LogOut, LayoutDashboard, User, Menu, X, Star, ArrowRight, Instagram, Twitter, Facebook, LifeBuoy, Store, CheckCircle, Clock, Users, Trash2, Reply, Settings, Key, Eye, Lock, EyeOff, UserPlus, AlertTriangle, MapPin, Mail, Phone, Linkedin, Send, Music2, Loader2, Filter } from 'lucide-react';

// --- COMPONENTS ---

// 0. NEW: Dedicated Delete Confirmation Modal
const DeleteConfirmationModal = ({ title, message, onConfirm, onCancel, loading }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, loading: boolean }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
        <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)] p-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-display text-white text-center mb-2 uppercase tracking-wide">{title}</h3>
            <p className="text-zinc-400 text-center mb-8">{message}</p>
            
            <div className="flex gap-3">
                <button 
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 py-3 rounded-lg bg-zinc-800 text-zinc-300 font-bold uppercase text-sm hover:bg-zinc-700 transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={onConfirm}
                    disabled={loading}
                    className="flex-1 py-3 rounded-lg bg-red-600 text-white font-bold uppercase text-sm hover:bg-red-500 transition flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={16} className="animate-spin"/> : 'Yes, Delete'}
                </button>
            </div>
        </div>
    </div>
);

// Change Password Modal
const ChangePasswordModal = ({ user, onClose, onSuccess }: { user: {id: string, source: 'users'|'applications', name: string}, onClose: () => void, onSuccess: () => void }) => {
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!pass) return;
        setLoading(true);
        try {
            await updateUserPassword(user.id, pass, user.source);
            onSuccess();
        } catch (e) {
            console.error(e);
            alert("Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-zinc-900 w-full max-w-sm rounded-xl border border-zinc-700 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-xl text-white uppercase tracking-wider">Change Password</h3>
                    <button onClick={onClose}><X size={20} className="text-zinc-500 hover:text-white"/></button>
                </div>
                <p className="text-zinc-400 text-sm mb-6">Enter a new password for <span className="text-gold-400 font-bold">{user.name}</span></p>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase">New Password</label>
                        <input 
                            type="text" 
                            autoFocus
                            value={pass} 
                            onChange={e => setPass(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded p-3 text-white focus:border-gold-400 outline-none mt-1"
                            placeholder="Type new password..."
                        />
                    </div>
                    
                    <button 
                        onClick={handleSave} 
                        disabled={loading || !pass}
                        className="w-full py-3 rounded bg-gold-400 text-black font-bold uppercase text-sm hover:bg-white transition disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading ? 'Updating...' : <><Key size={16}/> Update Password</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// 1. NAVBAR
const Navbar = ({ onNav, user, onLogout, onLoginClick, onRegisterClick }: { onNav: (v: ViewState) => void, user: any, onLogout: () => void, onLoginClick: () => void, onRegisterClick: () => void }) => (
  <nav className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-md h-24 flex items-center justify-between px-6 lg:px-12 border-b border-white/5 shadow-2xl transition-all">
    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNav('home')}>
      <div className="font-display text-3xl font-bold tracking-wider text-white group-hover:text-gold-400 transition-colors duration-300">
        GPHS <span className="text-gold-400 group-hover:text-white transition-colors duration-300">DIRECTORY</span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={onRegisterClick} className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold-400/50 hover:text-gold-400 transition text-xs font-bold uppercase tracking-widest">
         <UserPlus size={16}/> List Your Business
      </button>
      {user ? (
        <>
          {(user.role === 'admin' || user.role === 'moderator') && (
            <button onClick={() => onNav('admin')} className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 hover:border-gold-400 hover:text-gold-400 transition text-xs font-bold uppercase tracking-widest">
              <LayoutDashboard size={16} /> Admin
            </button>
          )}
          <button onClick={() => onNav('owner')} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-400 text-black font-bold uppercase hover:bg-white transition text-xs tracking-widest">
             <User size={16} /> My Business
          </button>
          <button onClick={onLogout} className="p-3 bg-zinc-900 rounded-full text-zinc-500 hover:text-red-500 hover:bg-red-950 transition"><LogOut size={18}/></button>
        </>
      ) : (
        <button onClick={onLoginClick} className="px-8 py-2.5 border border-gold-400/30 text-gold-400 rounded-full text-xs font-bold uppercase hover:bg-gold-400 hover:text-black transition tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.1)]">
          Login
        </button>
      )}
    </div>
  </nav>
);

// 2. HERO
const Hero = ({ featured, onSelect, onRegister }: { featured: Business | null, onSelect: (b: Business) => void, onRegister: () => void }) => (
  <section className="relative pt-48 pb-32 px-6 overflow-hidden bg-zinc-950">
    {/* Animated Background Elements */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gold-400/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

    <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
      {/* Text Content */}
      <div className="flex-1 text-center md:text-left">
          {/* Logo / Mascot Restoration */}
          <div className="w-24 h-24 mx-auto md:mx-0 mb-8 rounded-2xl border border-gold-400/20 bg-zinc-900/50 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.1)] animate-fade-in">
             <img src="mascot.png" className="w-16 h-16 object-contain" onError={(e) => e.currentTarget.style.display='none'} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-gold-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"></span>
              Official Student Marketplace
          </div>
          <h1 className="font-display text-7xl md:text-8xl font-bold text-white mb-6 leading-[0.9] tracking-tighter">
            GPHS STUDENT <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-gold-400 to-yellow-200">BUSINESS DIRECTORY</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-xl mb-10 font-light leading-relaxed">
            The premier directory for student-run businesses at GPHS. Discover unique services, crafts, and food right on campus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
             <button className="px-8 py-4 bg-gold-400 text-black font-display text-xl uppercase rounded-lg hover:bg-white hover:scale-105 transition shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                Browse Directory
             </button>
             <button onClick={onRegister} className="px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-display text-xl uppercase rounded-lg hover:bg-zinc-800 transition">
                Start Selling
             </button>
          </div>
      </div>

      {/* Featured Card */}
      {featured && (
        <div className="flex-1 w-full max-w-lg perspective-1000">
           <div 
             onClick={() => onSelect(featured)} 
             className="relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl group cursor-pointer hover:border-gold-400/50 transition-all duration-500 transform hover:-rotate-1 hover:scale-[1.02]"
           >
              {/* Image Container */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-black">
                 <div className="absolute top-4 left-4 z-20 bg-gold-400 text-black text-xs font-bold px-3 py-1 uppercase rounded-full tracking-wider shadow-lg">Featured Pick</div>
                 <img src={featured.images[0] || featured.imageURL || 'mascot.png'} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                 
                 <div className="absolute bottom-4 left-4 right-4 z-20">
                    <h3 className="font-display text-4xl text-white mb-1 drop-shadow-md">{featured.business}</h3>
                    <p className="text-zinc-300 text-sm line-clamp-2 drop-shadow-sm">{featured.description}</p>
                 </div>
              </div>
              
              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <User size={14} className="text-zinc-400"/>
                    </div>
                    <div className="text-xs">
                        <div className="text-zinc-500 uppercase">Owner</div>
                        <div className="text-white font-bold">{featured.ownerName || featured.owner}</div>
                    </div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-gold-400 group-hover:bg-gold-400 group-hover:text-black transition">
                    <ArrowRight size={20} className="-rotate-45 group-hover:rotate-0 transition duration-300"/>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  </section>
);

// 3. GRID
const Grid = ({ businesses, onSelect }: { businesses: Business[], onSelect: (b: Business) => void }) => (
  <div className="max-w-7xl mx-auto px-6 py-24 bg-zinc-950">
    <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
      <div>
         <h2 className="font-display text-5xl md:text-6xl text-white mb-2">EXPLORE <span className="text-zinc-600">MARKET</span></h2>
         <p className="text-zinc-400">Find businesses, services, and creative works from students.</p>
      </div>
      <div className="w-full md:w-auto relative group">
         <input type="text" placeholder="Search for anything..." className="w-full md:w-80 bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-12 pr-6 text-white focus:border-gold-400 focus:outline-none transition" />
         <Search className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-gold-400 transition" size={18} />
      </div>
    </div>
    
    {businesses.length === 0 ? (
       <div className="text-center py-32 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
           <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store size={32} className="text-zinc-600"/>
           </div>
           <p className="text-3xl font-display text-white mb-2">No businesses active.</p>
           <p className="text-zinc-500">Check back later or register your own!</p>
       </div>
    ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {businesses.map((b) => {
            // Robust expiration check
            const isExpired = b.subscriptionEnd && Number(b.subscriptionEnd) < Date.now();
            return (
            <div key={b.id} onClick={() => onSelect(b)} className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:border-gold-400/30 transition duration-500 cursor-pointer flex flex-col h-full">
                {/* Image Area */}
                <div className="h-64 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60 z-10"/>
                    
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                         {b.featured && <div className="bg-gold-400 text-black p-2 rounded-full shadow-lg"><Star size={14} fill="black" /></div>}
                         {isExpired && <div className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg uppercase tracking-wide">Expired</div>}
                    </div>

                    <img src={b.images[0] || b.imageURL || ''} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                    
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                        <div className="text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">{b.category}</div>
                        <h3 className="font-display text-3xl text-white leading-none group-hover:text-gold-400 transition">{b.business}</h3>
                    </div>
                </div>

                {/* Info Area */}
                <div className="p-6 pt-2 flex flex-col flex-1 border-t border-white/5 bg-zinc-900">
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">{b.description}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase">
                             {isExpired ? (
                                <span className="text-red-500 flex items-center gap-2"><Clock size={14}/> Closed (Expired)</span>
                             ) : (
                                <span className="flex items-center gap-2"><Clock size={14}/> {b.status === 'approved' ? 'Open Now' : 'Closed'}</span>
                             )}
                        </div>
                        <span className="text-white text-sm font-bold bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700 group-hover:border-gold-400/50 transition">
                            {b.price || '$-$$$'}
                        </span>
                    </div>
                </div>
            </div>
        )})}
        </div>
    )}
  </div>
);

// 3.5 CTA
const JoinCTA = ({ onRegister }: { onRegister: () => void }) => (
    <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-zinc-900 to-black border border-gold-500/20 rounded-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-400/5 blur-3xl rounded-full -ml-32 -mb-32"></div>
            
            <div className="relative z-10 max-w-2xl">
                <div className="inline-block px-3 py-1 mb-4 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 text-xs font-bold uppercase tracking-widest">
                    For Students
                </div>
                <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Let your business be seen by all of Gwynn Park</h2>
                <p className="text-zinc-400 text-lg">
                    Have a side hustle? Selling crafts, food, or services? 
                    Join the official GPHS Directory to reach hundreds of students and staff instantly.
                </p>
                <div className="flex flex-wrap gap-4 mt-6 text-sm text-zinc-500">
                    <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500"/> $1 Weekly Fee</span>
                    <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500"/> Instant Exposure</span>
                    <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500"/> Manage Your Listing</span>
                </div>
            </div>
            
            <div className="relative z-10 shrink-0">
                <button 
                    onClick={onRegister}
                    className="bg-gold-400 text-black font-display text-2xl uppercase px-8 py-4 rounded-xl hover:bg-white hover:scale-105 transition shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center gap-2"
                >
                    Get Started <ArrowRight size={24}/>
                </button>
            </div>
        </div>
    </div>
);

// 3.6 FOOTER
const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-gold-400 hover:text-black hover:border-gold-400 transition cursor-pointer">
    {icon}
  </div>
);

const Footer = ({ onNav, onLogin, onRegister, onSupport }: any) => (
  <footer className="bg-black border-t border-zinc-900 pt-24 pb-12 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
      <div className="space-y-6">
        <div>
           <h3 className="font-display text-3xl font-bold text-white uppercase tracking-wider">GPHS <span className="text-gold-400">DIRECTORY</span></h3>
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
          Supporting student entrepreneurs and building the next generation of business leaders. Shop local, support students.
        </p>
      </div>

      <div>
        <h4 className="font-display text-xl text-white uppercase mb-6 tracking-wide">Quick Links</h4>
        <ul className="space-y-4 text-sm font-medium text-zinc-500">
          <li><button onClick={() => onNav('home')} className="hover:text-gold-400 transition">Home</button></li>
          <li><button onClick={onRegister} className="hover:text-gold-400 transition">List Your Business</button></li>
          <li><button onClick={onLogin} className="hover:text-gold-400 transition">Login</button></li>
          <li><button className="hover:text-gold-400 transition">About Us</button></li>
          <li><button onClick={onSupport} className="hover:text-gold-400 transition">Support</button></li>
        </ul>
      </div>

      <div>
        <h4 className="font-display text-xl text-white uppercase mb-6 tracking-wide">Contact</h4>
        <ul className="space-y-4 text-sm text-zinc-500">
          <li className="flex items-start gap-3">
             <MapPin className="text-gold-400 shrink-0 mt-0.5" size={18} />
             <span>Gwynn Park High School</span>
          </li>
          <li className="flex items-start gap-3">
             <Mail className="text-gold-400 shrink-0 mt-0.5" size={18} />
             <a href="mailto:christopher-alas@pgcps.org" className="hover:text-white transition">christopher-alas@pgcps.org</a>
          </li>
          <li className="flex items-start gap-3">
             <Phone className="text-gold-400 shrink-0 mt-0.5" size={18} />
             <span>(240) 623-8773</span>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="font-display text-xl text-white uppercase mb-6 tracking-wide">Newsletter</h4>
        <p className="text-zinc-500 text-sm mb-4">Subscribe for weekly deals.</p>
        <div className="flex">
           <input type="email" placeholder="Email Address" className="bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-l w-full text-sm focus:outline-none focus:border-gold-400 placeholder-zinc-600" />
           <button className="bg-gold-400 text-black px-4 rounded-r hover:bg-white transition flex items-center justify-center"><Send size={18} /></button>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
       <div className="text-zinc-600 text-sm">© 2025-2026 GPHS Student Directory. All Rights Reserved.</div>
       <div className="flex gap-4">
          <SocialIcon icon={<Instagram size={18}/>} />
          <SocialIcon icon={<Twitter size={18}/>} />
          <SocialIcon icon={<Music2 size={18}/>} /> 
          <SocialIcon icon={<Linkedin size={18}/>} />
       </div>
    </div>
  </footer>
);

// 4. REWRITTEN ADMIN DASHBOARD
const AdminDashboard = ({ onExit, businesses, onRefresh }: { onExit: () => void, businesses: Business[], onRefresh: () => Promise<void> | void }) => {
  const [selected, setSelected] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<'businesses' | 'tickets' | 'users'>('businesses');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<any[]>([]); 
  const [replyTicket, setReplyTicket] = useState<SupportTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Deletion State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => any, loading: boolean } | null>(null);

  // Password Management States
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingPasswordUser, setEditingPasswordUser] = useState<{id: string, source: 'users'|'applications', name: string} | null>(null);

  useEffect(() => {
    // Force refresh on mount
    onRefresh && onRefresh();
    if (activeTab === 'tickets') {
      getSupportTickets().then(setTickets);
    } else if (activeTab === 'users') {
      getUsers().then(setUsers);
    }
  }, [activeTab]);

  const handleResolveTicket = async (id: string) => {
    if (!window.confirm("Mark this ticket as resolved?")) return;
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'closed' } : t));
    try {
        await updateTicketStatus(id, 'closed');
        const updated = await getSupportTickets();
        setTickets(updated);
    } catch(e) {
        alert("Error updating ticket status");
    }
  };

  const refreshTickets = () => {
      getSupportTickets().then(setTickets);
  };
  
  const refreshUsers = () => {
      getUsers().then(setUsers);
  }

  // --- ROBUST DELETION LOGIC ---
  const triggerDeleteBusiness = (id: string, name: string) => {
      setDeleteModal({
          isOpen: true,
          title: `Delete Business?`,
          message: `Are you sure you want to delete "${name}"? This will permanently remove the listing, images, and reviews. This action cannot be undone.`,
          loading: false,
          onConfirm: async () => {
              setDeleteModal(prev => prev ? { ...prev, loading: true } : null);
              try {
                  console.log("Attempting to delete business with ID:", id);
                  await deleteDoc(doc(db, "applications", id));
                  console.log("Delete successful");
                  if (onRefresh) await onRefresh();
                  setDeleteModal(null);
              } catch (e: any) {
                  console.error("Delete failed:", e);
                  alert(`Failed to delete: ${e.message}`);
                  setDeleteModal(null);
              }
          }
      });
  };

  const triggerDeleteUser = (id: string, source: 'users' | 'applications', name: string) => {
     setDeleteModal({
          isOpen: true,
          title: `Delete User?`,
          message: `Are you sure you want to delete "${name}"? ${source === 'applications' ? 'Warning: This user owns a business. Deleting them will also delete their business listing.' : ''}`,
          loading: false,
          onConfirm: async () => {
              setDeleteModal(prev => prev ? { ...prev, loading: true } : null);
              try {
                  console.log("Attempting to delete user:", id, source);
                  await deleteUser(id, source);
                  refreshUsers();
                  if (onRefresh) await onRefresh();
                  setDeleteModal(null);
              } catch (e: any) {
                  console.error("Delete failed:", e);
                  alert(`Failed to delete: ${e.message}`);
                  setDeleteModal(null);
              }
          }
      });
  };

  const togglePasswordVisibility = (id: string) => {
      const newSet = new Set(visiblePasswords);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setVisiblePasswords(newSet);
  };
  
  // Filtering logic
  const filteredBusinesses = businesses.filter(b => b.business.toLowerCase().includes(searchTerm.toLowerCase()) || b.owner.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto min-h-screen">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
         <div>
             <h1 className="font-display text-5xl text-white uppercase mb-1">Admin Portal</h1>
             <p className="text-zinc-500">Manage listings, users, and support requests.</p>
         </div>
         <div className="flex items-center gap-3">
             <div className="relative">
                 <Search className="absolute left-3 top-2.5 text-zinc-600" size={16}/>
                 <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-gold-400 focus:outline-none w-64"
                 />
             </div>
             <button onClick={onExit} className="px-5 py-2 bg-zinc-800 rounded-full text-sm font-bold text-white hover:bg-zinc-700 transition">Exit</button>
         </div>
       </div>

       {/* Tabs */}
       <div className="flex gap-2 mb-8 border-b border-zinc-800">
          {[
              { id: 'businesses', icon: <Store size={18}/>, label: 'Businesses' },
              { id: 'tickets', icon: <LifeBuoy size={18}/>, label: 'Support' },
              { id: 'users', icon: <Users size={18}/>, label: 'Users' }
          ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'text-gold-400 border-gold-400' : 'text-zinc-500 border-transparent hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
          ))}
       </div>
       
       {/* TAB CONTENT: BUSINESSES */}
       {activeTab === 'businesses' && (
           <div className="grid grid-cols-1 gap-4">
             {filteredBusinesses.map(b => {
                const isExpired = b.subscriptionEnd && Number(b.subscriptionEnd) < Date.now();
                return (
                    <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 hover:border-zinc-700 transition group">
                        {/* Image */}
                        <div className="w-full md:w-20 h-20 bg-black rounded-lg overflow-hidden shrink-0 border border-zinc-800 relative">
                            <img src={b.images[0] || b.imageURL || 'mascot.png'} className="w-full h-full object-cover" />
                            {b.featured && <div className="absolute top-1 right-1 bg-gold-400 p-1 rounded-full"><Star size={8} className="text-black fill-black"/></div>}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-display text-white">{b.business}</h3>
                            <div className="text-zinc-500 text-sm flex flex-col md:flex-row gap-2 items-center md:items-start">
                                <span className="flex items-center gap-1"><User size={12}/> {b.owner}</span>
                                <span className="hidden md:inline">•</span>
                                <span>{b.category}</span>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="shrink-0 flex flex-col items-center">
                            {isExpired ? (
                                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 uppercase">Expired</span>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${b.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                    {b.status}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                            <button 
                                onClick={() => setSelected(b)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-white hover:text-black text-white rounded-lg text-xs font-bold uppercase transition border border-zinc-700"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    triggerDeleteBusiness(b.id, b.business);
                                }}
                                className="px-3 py-2 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition border border-red-900/30 group/del"
                                title="Delete Permanently"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                );
             })}
             {filteredBusinesses.length === 0 && <div className="p-12 text-center text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">No businesses found.</div>}
           </div>
       )}
       
       {/* TAB CONTENT: TICKETS */}
       {activeTab === 'tickets' && (
           <div className="space-y-4">
               {tickets.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">No tickets found.</div>
               ) : (
                   tickets.map(t => (
                       <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col lg:flex-row gap-6 hover:border-zinc-700 transition">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${t.status === 'open' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                        {t.status}
                                    </span>
                                    <span className="text-zinc-500 text-xs">{new Date(t.date).toLocaleDateString()}</span>
                                    <span className="text-zinc-500 text-xs">•</span>
                                    <span className="text-gold-400 text-xs uppercase font-bold">{t.category}</span>
                                </div>
                                <h3 className="text-white font-bold">{t.name} <span className="text-zinc-500 font-normal text-sm ml-2">&lt;{t.email}&gt;</span></h3>
                                <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-zinc-300 text-sm">
                                    "{t.message}"
                                </div>
                                {t.reply && (
                                    <div className="pl-4 border-l-2 border-gold-400/30 mt-2">
                                        <p className="text-xs text-gold-400 mb-1">Admin Reply:</p>
                                        <p className="text-zinc-400 text-sm">"{t.reply}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex lg:flex-col gap-2 justify-center shrink-0">
                                {t.status === 'open' && (
                                    <>
                                        <button onClick={() => setReplyTicket(t)} className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/20 rounded-lg text-xs font-bold uppercase transition flex items-center justify-center gap-2">
                                            <Reply size={14}/> Reply
                                        </button>
                                        <button onClick={() => handleResolveTicket(t.id)} className="px-4 py-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white border border-green-600/20 rounded-lg text-xs font-bold uppercase transition flex items-center justify-center gap-2">
                                            <CheckCircle size={14}/> Resolve
                                        </button>
                                    </>
                                )}
                            </div>
                       </div>
                   ))
               )}
           </div>
       )}

       {/* TAB CONTENT: USERS */}
       {activeTab === 'users' && (
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
             <table className="w-full text-left min-w-[800px]">
               <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase font-bold">
                 <tr>
                   <th className="p-4">Username</th>
                   <th className="p-4">Role</th>
                   <th className="p-4">Password</th>
                   <th className="p-4">Contact</th>
                   <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                 {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                     <tr key={u.id} className="hover:bg-zinc-800/50 transition">
                       <td className="p-4">
                           <div className="font-bold text-white">{u.username}</div>
                           {u.businessName && <div className="text-xs text-gold-400 flex items-center gap-1"><Store size={10}/> {u.businessName}</div>}
                       </td>
                       <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs uppercase border ${u.role === 'admin' ? 'bg-red-900/20 text-red-500 border-red-900' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                               {u.role}
                           </span>
                       </td>
                       <td className="p-4 font-mono text-zinc-400 text-xs">
                           <div className="flex items-center gap-2">
                             <span className="bg-black px-2 py-1 rounded border border-zinc-800 min-w-[100px] text-center">
                                {visiblePasswords.has(u.id) ? (u.password || 'N/A') : '••••••••'}
                             </span>
                             <button onClick={() => togglePasswordVisibility(u.id)} className="p-1 hover:text-gold-400 text-zinc-600 transition">
                                {visiblePasswords.has(u.id) ? <EyeOff size={14}/> : <Eye size={14}/>}
                             </button>
                           </div>
                       </td>
                       <td className="p-4 text-zinc-400 text-sm">{u.email || 'N/A'}</td>
                       <td className="p-4 text-right">
                         <div className="flex justify-end gap-2">
                             <button onClick={() => setEditingPasswordUser({id: u.id, source: u.source, name: u.username})} className="text-gold-400 hover:text-white font-bold text-xs uppercase border border-gold-400/30 hover:bg-gold-400/10 px-3 py-1 rounded transition flex items-center gap-1 cursor-pointer">
                               <Key size={12}/> Edit Pass
                             </button>
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    triggerDeleteUser(u.id, u.source, u.username);
                                }} 
                                className="text-red-500 hover:text-white font-bold text-xs uppercase border border-red-500/30 hover:bg-red-500/10 px-3 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                             >
                               <Trash2 size={12}/> Delete
                             </button>
                         </div>
                       </td>
                     </tr>
                   ))}
               </tbody>
             </table>
           </div>
       )}
       
       {/* Modals */}
       {selected && (
         <EditBusinessModal 
            business={selected} 
            onClose={() => setSelected(null)} 
            onRefresh={onRefresh}
            isAdmin={true}
         />
       )}

       {replyTicket && (
           <ReplyModal 
              ticket={replyTicket}
              onClose={() => setReplyTicket(null)}
              onRefresh={refreshTickets}
           />
       )}

       {editingPasswordUser && (
           <ChangePasswordModal 
             user={editingPasswordUser}
             onClose={() => setEditingPasswordUser(null)}
             onSuccess={() => { refreshUsers(); setEditingPasswordUser(null); alert("Password updated successfully."); }}
           />
       )}

       {/* Delete Confirmation Modal */}
       {deleteModal && (
           <DeleteConfirmationModal 
               title={deleteModal.title}
               message={deleteModal.message}
               onConfirm={deleteModal.onConfirm}
               onCancel={() => setDeleteModal(null)}
               loading={deleteModal.loading}
           />
       )}
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<ViewState>('home');
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showCreateBiz, setShowCreateBiz] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Initial Data Load
  useEffect(() => {
    seedDatabase();
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    const data = await getBusinesses();
    setBusinesses(data);
  };

  const handleLogin = (u: any) => {
    setUser(u);
    setShowLogin(false);
    setShowRegister(false);
    if (u.role === 'admin') setView('admin');
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  // Filter businesses for display
  // Robust check: explicitly cast subscriptionEnd to Number to ensure correct comparison
  const activeBusinesses = businesses.filter(b => 
      b.status === 'approved' && 
      (!b.subscriptionEnd || Number(b.subscriptionEnd) > Date.now())
  );
  
  const featured = businesses.find(b => 
      b.featured && 
      (!b.subscriptionEnd || Number(b.subscriptionEnd) > Date.now())
  ) || null;

  // Check if current user has a business
  const myBusiness = user ? businesses.find(b => b.owner === user.username) : null;

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans selection:bg-gold-400 selection:text-black">
      <Navbar 
         onNav={setView} 
         user={user} 
         onLogout={handleLogout} 
         onLoginClick={() => setShowLogin(true)}
         onRegisterClick={() => {
             if(user) {
                 if(myBusiness) setView('owner');
                 else setShowCreateBiz(true);
             } else {
                 setShowRegister(true);
             }
         }}
      />

      {view === 'home' && (
        <>
           <Hero 
              featured={featured} 
              onSelect={(b) => { setSelectedBusiness(b); setView('profile'); }}
              onRegister={() => {
                  if(user) {
                      if(myBusiness) setView('owner');
                      else setShowCreateBiz(true);
                  } else {
                      setShowRegister(true);
                  }
              }}
           />
           <JoinCTA 
              onRegister={() => {
                  if(user) {
                      if(myBusiness) setView('owner');
                      else setShowCreateBiz(true);
                  } else {
                      setShowRegister(true);
                  }
              }}
           />
           <Grid 
              businesses={activeBusinesses} 
              onSelect={(b) => { setSelectedBusiness(b); setView('profile'); }}
           />
           <Footer 
              onNav={setView} 
              onLogin={() => setShowLogin(true)} 
              onRegister={() => setShowRegister(true)} 
              onSupport={() => setShowSupport(true)}
           />
        </>
      )}

      {view === 'profile' && selectedBusiness && (
        <BusinessProfile 
           business={selectedBusiness} 
           onBack={() => setView('home')} 
           user={user} 
           onLogin={() => setShowLogin(true)}
           onRefresh={loadBusinesses}
        />
      )}

      {view === 'admin' && user?.role === 'admin' && (
        <AdminDashboard 
           onExit={() => setView('home')} 
           businesses={businesses} 
           onRefresh={loadBusinesses}
        />
      )}

      {view === 'owner' && user && (
          <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto min-h-screen">
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="font-display text-4xl text-white uppercase">Owner Dashboard</h1>
                   <p className="text-zinc-500">Welcome, {user.username}</p>
                </div>
                <button onClick={() => setView('home')} className="text-zinc-500 hover:text-white transition">Back Home</button>
              </div>

              {myBusiness ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                          <div className="w-full md:w-1/3 aspect-square bg-black rounded-lg overflow-hidden border border-zinc-700">
                             <img src={myBusiness.images[0] || myBusiness.imageURL || 'mascot.png'} className="w-full h-full object-cover"/>
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between items-start">
                                <div>
                                   <h2 className="text-3xl font-display text-white mb-2">{myBusiness.business}</h2>
                                   <div className="inline-block px-3 py-1 rounded bg-zinc-800 text-xs font-bold uppercase text-zinc-400 border border-zinc-700 mb-4">
                                      {myBusiness.category}
                                   </div>
                                </div>
                                <div className={`px-3 py-1 rounded text-xs font-bold uppercase border ${myBusiness.status === 'approved' ? 'bg-green-900/20 text-green-500 border-green-900' : 'bg-yellow-900/20 text-yellow-500 border-yellow-900'}`}>
                                   {myBusiness.status}
                                </div>
                             </div>
                             
                             <p className="text-zinc-400 mb-6">{myBusiness.description}</p>
                             
                             <div className="flex flex-wrap gap-4">
                                <button onClick={() => setEditingBusiness(myBusiness)} className="bg-gold-400 text-black px-6 py-2 rounded-lg font-bold uppercase text-sm hover:bg-white transition flex items-center gap-2">
                                   <Settings size={16}/> Edit Business
                                </button>
                                <button onClick={() => { setSelectedBusiness(myBusiness); setView('profile'); }} className="bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold uppercase text-sm hover:bg-zinc-700 transition flex items-center gap-2">
                                   <Eye size={16}/> View Public Page
                                </button>
                             </div>
                          </div>
                      </div>
                      
                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 text-center">
                              <div className="text-2xl font-bold text-white">{myBusiness.views || 0}</div>
                              <div className="text-xs text-zinc-500 uppercase">Total Views</div>
                          </div>
                          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 text-center">
                              <div className="text-2xl font-bold text-white">{myBusiness.reviews?.length || 0}</div>
                              <div className="text-xs text-zinc-500 uppercase">Reviews</div>
                          </div>
                          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 text-center">
                              {myBusiness.subscriptionEnd && Number(myBusiness.subscriptionEnd) > Date.now() ? (
                                  <div className="text-2xl font-bold text-green-500">Active</div>
                              ) : (
                                  <div className="text-2xl font-bold text-red-500">Expired</div>
                              )}
                              <div className="text-xs text-zinc-500 uppercase">Subscription</div>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="text-center py-24 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl">
                      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-600">
                         <Store size={32}/>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">No Business Listed</h2>
                      <p className="text-zinc-400 mb-8 max-w-md mx-auto">You haven't registered a business yet.</p>
                      <button onClick={() => setShowCreateBiz(true)} className="bg-gold-400 text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-white transition">
                         Register New Business
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
      {showRegister && <LoginModal onClose={() => setShowRegister(false)} onLogin={handleLogin} initialView="signup"/>}
      {showCreateBiz && user && <CreateBusinessModal user={user} onClose={() => setShowCreateBiz(false)} onRefresh={loadBusinesses}/>}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      
      {editingBusiness && (
          <EditBusinessModal 
              business={editingBusiness} 
              onClose={() => setEditingBusiness(null)}
              onRefresh={loadBusinesses}
              isAdmin={false}
          />
      )}
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { Users, Store, MessageSquare, TrendingUp, Search, Trash2, Edit, CheckCircle, XCircle, AlertCircle, Lock, LogOut, LayoutDashboard, ExternalLink, ShieldAlert, Sparkles, RefreshCw, ArrowUp, ArrowDown, Menu, Copy, UserCheck, UserCog, Ghost, Filter, Database, Settings, Save, Phone, Mail, MapPin, Loader2, ChevronDown, Eye, LifeBuoy } from 'lucide-react';
import { db, getBusinesses, getUsers, getSupportTickets, deleteUser, updateTicketStatus, updateUserPassword, saveBusinessOrder, getGlobalSettings, updateGlobalSettings } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Business, User, SupportTicket } from '../types';
import { EditBusinessModal } from './EditBusinessModal';
import { ReplyModal } from './ReplyModal';

// Shared Internal Component for Deletions within the Admin Dashboard
const AdminDeleteModal = ({ title, message, onConfirm, onCancel, loading }: any) => (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
        <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] border border-red-500/20 shadow-2xl p-10 text-center animate-fade-in">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
                <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-display text-white mb-2 uppercase tracking-tight">{title}</h3>
            <p className="text-zinc-500 mb-10 text-sm leading-relaxed px-4">{message}</p>
            <div className="flex gap-4">
                <button onClick={onCancel} disabled={loading} className="flex-1 py-4 rounded-2xl bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 transition">Cancel</button>
                <button onClick={onConfirm} disabled={loading} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition flex items-center justify-center gap-2 shadow-xl shadow-red-600/20">
                    {loading ? <Loader2 size={16} className="animate-spin"/> : 'Confirm Delete'}
                </button>
            </div>
        </div>
    </div>
);

interface Props {
  user: User;
  onLogout: () => void;
  onNav: (view: any) => void;
}

export const AdminDashboard: React.FC<Props> = ({ user, onLogout, onNav }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'users' | 'support' | 'settings'>('overview');
  const [stats, setStats] = useState({ revenue: 0, activeListings: 0, users: 0, openTickets: 0 });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modal States
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [replyTicket, setReplyTicket] = useState<SupportTicket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'listing' | 'user', label: string, source?: string } | null>(null);

  // User Filter State
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'registered' | 'implicit'>('all');
  
  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({ contactName: '', contactEmail: '', contactPhone: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [bizData, userData, ticketData, settingsData] = await Promise.all([
            getBusinesses(),
            getUsers(),
            getSupportTickets(),
            getGlobalSettings()
        ]);

        bizData.sort((a, b) => (a.order ?? 10000) - (b.order ?? 10000));

        setBusinesses(bizData);
        setUsers(userData);
        setTickets(ticketData);
        setGlobalSettings(settingsData);

        const active = bizData.filter(b => b.status === 'approved' && (!b.subscriptionEnd || b.subscriptionEnd > Date.now())).length;
        const revenue = bizData.length * 1.00;
        const open = ticketData.filter(t => t.status === 'open').length;

        setStats({
            revenue,
            activeListings: active,
            users: userData.length,
            openTickets: open
        });
    } catch (e) {
        console.error("Failed to load admin data", e);
    } finally {
        setLoading(false);
    }
  };

  const handleApprove = async (id: string, currentStatus: string) => {
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
      await updateDoc(doc(db, "applications", id), { status: newStatus });
      loadData();
  };

  const executeDelete = async () => {
      if (!deleteTarget) return;
      setActionLoading(true);
      try {
          if (deleteTarget.type === 'listing') {
              await deleteUser(deleteTarget.id, 'applications');
          } else {
              // Execute user delete
              await deleteUser(deleteTarget.id, (deleteTarget.source as any) || 'users');
              
              // Cascade if registered user
              if (deleteTarget.source === 'users') {
                  const targetUser = users.find(u => u.id === deleteTarget.id);
                  if (targetUser) {
                      const userApps = businesses.filter(b => b.owner === targetUser.username);
                      for (const app of userApps) {
                          await deleteUser(app.id, 'applications');
                      }
                  }
              }
          }
          await loadData();
          setDeleteTarget(null);
      } catch (e: any) {
          alert("Delete failed: " + e.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleResetPassword = async (userObj: any) => {
      const newPw = prompt(`Enter new password for ${userObj.username}:`);
      if(!newPw) return;
      await updateUserPassword(userObj.id, newPw, userObj.source || 'users');
      alert("Password updated.");
  };

  const moveBusiness = async (index: number, direction: 'up' | 'down') => {
      if (searchTerm) return;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= businesses.length) return;

      const newBusinesses = [...businesses];
      [newBusinesses[index], newBusinesses[newIndex]] = [newBusinesses[newIndex], newBusinesses[index]];
      setBusinesses(newBusinesses);

      const updates = newBusinesses.map((b, i) => ({ ...b, order: i }));
      await saveBusinessOrder(updates);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await updateGlobalSettings(globalSettings);
          alert("Settings updated successfully!");
      } catch (e) {
          alert("Failed to save settings.");
      }
  };

  const filteredBusinesses = businesses.filter(b => 
      b.business.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => {
      const matchesSearch = (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      if (userFilter === 'all') return true;
      if (userFilter === 'admin') return u.role === 'admin';
      if (userFilter === 'implicit') return u.source === 'applications';
      if (userFilter === 'registered') return u.source === 'users' && u.role !== 'admin';
      return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row text-white font-sans animate-fade-in relative">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-zinc-900 border-b lg:border-b-0 lg:border-r border-white/5 flex-shrink-0 flex flex-col h-auto lg:h-screen sticky top-0 z-30">
            <div className="p-6 lg:p-10 border-b border-white/5 flex justify-between items-center bg-zinc-900">
                <div className="font-display text-2xl font-black tracking-tighter text-white">
                    GPHS<span className="text-gold font-light tracking-widest ml-1 opacity-80">ADMIN</span>
                </div>
                <button className="lg:hidden p-2 text-zinc-500 hover:text-white transition" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu size={24} />
                </button>
            </div>
            
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block flex-1 overflow-y-auto`}>
                <nav className="p-6 space-y-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18}/> },
                        { id: 'businesses', label: 'Holdings', icon: <Store size={18}/> },
                        { id: 'users', label: 'User Hub', icon: <Users size={18}/> },
                        { id: 'support', label: 'Support Queue', icon: <LifeBuoy size={18}/>, badge: stats.openTickets },
                        { id: 'settings', label: 'System Settings', icon: <Settings size={18}/> }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }} 
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-gold text-black font-black shadow-xl shadow-gold/10' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            {tab.icon} {tab.label}
                            {tab.badge && tab.badge > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span>}
                        </button>
                    ))}
                    
                    <button 
                        onClick={() => onNav('chat')} 
                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 text-zinc-500 hover:bg-white/5 hover:text-white group"
                    >
                        <MessageSquare size={18} className="group-hover:text-gold transition"/> Encrypted Comms
                    </button>
                </nav>

                <div className="p-6 border-t border-white/5 mt-auto">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-6 py-4 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest">
                        <LogOut size={16}/> End Session
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-auto lg:h-screen p-8 lg:p-20 bg-zinc-950">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-10">
                <div>
                    <h1 className="font-display text-6xl text-white uppercase tracking-tighter leading-none">
                        {activeTab === 'overview' && 'Dashboard'}
                        {activeTab === 'businesses' && <>Market <br/>Control</>}
                        {activeTab === 'users' && <>Directory <br/>Registry</>}
                        {activeTab === 'support' && <>Support <br/>Interface</>}
                        {activeTab === 'settings' && <>Global <br/>Override</>}
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={loadData} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-gold hover:text-black transition duration-500 shadow-2xl">
                        <RefreshCw size={24}/>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-96 text-gold animate-pulse gap-4">
                    <Sparkles size={64}/>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Data...</p>
                </div>
            ) : (
                <>
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                            {[
                                { label: 'Revenue Generated', value: `$${stats.revenue.toFixed(2)}`, icon: <TrendingUp size={24}/>, color: 'text-green-500' },
                                { label: 'Market Holdings', value: stats.activeListings, icon: <Store size={24}/>, color: 'text-gold' },
                                { label: 'Unique Entrants', value: stats.users, icon: <Users size={24}/>, color: 'text-blue-500' },
                                { label: 'Priority Alerts', value: stats.openTickets, icon: <ShieldAlert size={24}/>, color: 'text-red-500' }
                            ].map((s, i) => (
                                <div key={i} className="glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                                    <div className={`${s.color} mb-6`}>{s.icon}</div>
                                    <h3 className="text-5xl font-display font-black text-white mb-2">{s.value}</h3>
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* BUSINESSES TAB */}
                    {activeTab === 'businesses' && (
                        <div className="space-y-10">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="relative w-full md:max-w-md group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold transition" size={20}/>
                                    <input 
                                        type="text" 
                                        placeholder="Filter by business or owner..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-5 pl-14 text-white focus:border-gold/30 outline-none transition shadow-2xl"
                                    />
                                </div>
                                {searchTerm && <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest animate-pulse">Reordering disabled during search</div>}
                            </div>

                            <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400 min-w-[900px]">
                                        <thead className="bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                                            <tr>
                                                <th className="p-8">Holding</th>
                                                <th className="p-8">Owner Handle</th>
                                                <th className="p-8 text-center">Protocol Status</th>
                                                <th className="p-8 text-center">Subscription</th>
                                                <th className="p-8 text-right">Execution</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredBusinesses.map((b, index) => (
                                                <tr key={b.id} className="hover:bg-white/[0.02] transition duration-300 group">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/5">
                                                                <img src={b.images[0] || 'mascot.png'} className="w-full h-full object-cover"/>
                                                            </div>
                                                            <div className="font-bold text-white group-hover:text-gold transition">{b.business}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-zinc-500 font-medium">@{b.owner}</td>
                                                    <td className="p-8 text-center">
                                                        <button 
                                                            onClick={() => handleApprove(b.id, b.status)} 
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${b.status === 'approved' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'}`}
                                                        >
                                                            {b.status}
                                                        </button>
                                                    </td>
                                                    <td className="p-8 text-center">
                                                        {b.subscriptionEnd && b.subscriptionEnd > Date.now() ? (
                                                            <span className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><CheckCircle size={14}/> Active</span>
                                                        ) : (
                                                            <span className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><XCircle size={14}/> Expired</span>
                                                        )}
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            {!searchTerm && (
                                                                <div className="flex gap-1 border-r border-white/5 pr-3 mr-1">
                                                                    <button onClick={() => moveBusiness(index, 'up')} disabled={index === 0} className="p-2.5 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition disabled:opacity-20"><ArrowUp size={16}/></button>
                                                                    <button onClick={() => moveBusiness(index, 'down')} disabled={index === businesses.length - 1} className="p-2.5 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition disabled:opacity-20"><ArrowDown size={16}/></button>
                                                                </div>
                                                            )}
                                                            <button onClick={() => setEditingBusiness(b)} className="p-3 bg-zinc-900 rounded-xl text-gold hover:bg-gold hover:text-black transition"><Edit size={18}/></button>
                                                            <button onClick={() => setDeleteTarget({ id: b.id, type: 'listing', label: b.business })} className="p-3 bg-red-950/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition"><Trash2 size={18}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="space-y-10">
                            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                                <div className="relative w-full lg:max-w-md group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold transition" size={20}/>
                                    <input 
                                        type="text" 
                                        placeholder="Search handles or credentials..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-5 pl-14 text-white focus:border-gold/30 outline-none shadow-2xl"
                                    />
                                </div>
                                <div className="flex gap-2 p-1.5 bg-zinc-900 rounded-2xl border border-white/5">
                                    {['all', 'registered', 'implicit', 'admin'].map(f => (
                                        <button 
                                            key={f} 
                                            onClick={() => setUserFilter(f as any)} 
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userFilter === f ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400 min-w-[900px]">
                                        <thead className="bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                                            <tr>
                                                <th className="p-8">Security Handle</th>
                                                <th className="p-8">Authority</th>
                                                <th className="p-8">Registry Origin</th>
                                                <th className="p-8">Endpoint</th>
                                                <th className="p-8 text-right">Overrides</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredUsers.map((u, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition duration-300">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-black border border-white/5">
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white">@{u.username}</div>
                                                                <div className="text-[10px] uppercase text-zinc-600">IDRef: {u.id.substring(0,8)}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-8">
                                                        {u.source === 'users' ? (
                                                            <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest"><Database size={14}/> Registered</div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest"><Ghost size={14}/> Implicit</div>
                                                        )}
                                                    </td>
                                                    <td className="p-8 text-xs font-mono text-zinc-600">{u.email || u.contactInfo || 'DECRYPT_FAILURE'}</td>
                                                    <td className="p-8 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <button onClick={() => handleResetPassword(u)} className="p-3 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition"><Lock size={18}/></button>
                                                            <button onClick={() => setDeleteTarget({ id: u.id, type: 'user', label: u.username, source: u.source })} className="p-3 bg-red-950/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition"><Trash2 size={18}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="max-w-2xl mx-auto animate-fade-in">
                            <div className="bg-zinc-900 p-12 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                                <form onSubmit={handleSaveSettings} className="space-y-10 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Entity Name</label>
                                        <input 
                                            type="text" 
                                            value={globalSettings.contactName} 
                                            onChange={e => setGlobalSettings({...globalSettings, contactName: e.target.value})}
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white focus:border-gold/30 outline-none transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Secure Support Endpoint</label>
                                        <input 
                                            type="email" 
                                            value={globalSettings.contactEmail} 
                                            onChange={e => setGlobalSettings({...globalSettings, contactEmail: e.target.value})}
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white focus:border-gold/30 outline-none transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Global Voice ID</label>
                                        <input 
                                            type="text" 
                                            value={globalSettings.contactPhone} 
                                            onChange={e => setGlobalSettings({...globalSettings, contactPhone: e.target.value})}
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white focus:border-gold/30 outline-none transition"
                                        />
                                    </div>
                                    <div className="pt-6 flex justify-end">
                                        <button type="submit" className="bg-white text-black font-black uppercase text-[10px] tracking-widest px-10 py-5 rounded-2xl hover:bg-gold transition shadow-2xl flex items-center gap-3">
                                            <Save size={18} /> Commit Configuration
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* SUPPORT TAB */}
                    {activeTab === 'support' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                            {tickets.map(t => (
                                <div key={t.id} className={`glass-card p-10 rounded-[2.5rem] border border-white/5 flex flex-col ${t.status === 'closed' ? 'opacity-40 grayscale-[50%]' : ''}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.status === 'open' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {t.status}
                                        </span>
                                        <span className="text-[10px] text-zinc-700 font-black">{new Date(t.date).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-xl mb-1">{t.category}</h3>
                                    <p className="text-xs text-zinc-500 mb-6 font-mono">@{t.email}</p>
                                    <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 flex-1 mb-8 italic text-zinc-400 text-sm leading-relaxed">
                                        "{t.message}"
                                    </div>
                                    <div className="flex gap-3">
                                        {t.status === 'open' && (
                                            <button onClick={() => setReplyTicket(t)} className="flex-1 py-4 bg-gold text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition">
                                                Intervene
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => updateTicketStatus(t.id, t.status === 'open' ? 'closed' : 'open').then(loadData)} 
                                            className="p-4 bg-zinc-800 text-zinc-400 rounded-xl hover:text-white transition"
                                        >
                                            <CheckCircle size={20}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
            
            {/* Action Overlays */}
            {editingBusiness && <EditBusinessModal business={editingBusiness} onClose={() => setEditingBusiness(null)} onRefresh={loadData} isAdmin={true} />}
            {replyTicket && <ReplyModal ticket={replyTicket} onClose={() => setReplyTicket(null)} onRefresh={loadData} />}
            {deleteTarget && (
                <AdminDeleteModal 
                    title={`Delete ${deleteTarget.type === 'listing' ? 'Listing' : 'Account'}`}
                    message={`This action will permanently erase "${deleteTarget.label}" from the directory. This protocol is irreversible.`}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={executeDelete}
                    loading={actionLoading}
                />
            )}
        </main>
    </div>
  );
};

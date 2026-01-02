import React, { useState, useEffect } from 'react';
import { Users, Store, MessageSquare, TrendingUp, Search, Trash2, Edit, CheckCircle, XCircle, AlertCircle, Lock, LogOut, LayoutDashboard, ExternalLink, ShieldAlert, Sparkles, RefreshCw, ArrowUp, ArrowDown, Menu } from 'lucide-react';
import { db, getBusinesses, getUsers, getSupportTickets, deleteUser, updateTicketStatus, updateUserPassword, saveBusinessOrder } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Business, User, SupportTicket } from '../types';
import { EditBusinessModal } from './EditBusinessModal';
import { ReplyModal } from './ReplyModal';

interface Props {
  user: User;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'users' | 'support'>('overview');
  const [stats, setStats] = useState({ revenue: 0, activeListings: 0, users: 0, openTickets: 0 });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modal States
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [replyTicket, setReplyTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [bizData, userData, ticketData] = await Promise.all([
            getBusinesses(),
            getUsers(),
            getSupportTickets()
        ]);

        // Sort by order
        bizData.sort((a, b) => (a.order ?? 10000) - (b.order ?? 10000));

        setBusinesses(bizData);
        setUsers(userData);
        setTickets(ticketData);

        // Calculate Stats
        const active = bizData.filter(b => b.status === 'approved' && (!b.subscriptionEnd || b.subscriptionEnd > Date.now())).length;
        const revenue = bizData.length * 1.00; // Mock revenue calculation based on $1 setup
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

  const handleDeleteBusiness = async (id: string) => {
      if(!window.confirm("Permanently delete this business listing?")) return;
      await deleteUser(id, 'applications');
      loadData();
  };

  const handleDeleteUser = async (id: string) => {
      if(!window.confirm("Permanently delete this user account? This will also remove their owned businesses.")) return;
      await deleteUser(id, 'users');
      // Also delete their businesses
      const userBiz = businesses.find(b => b.owner === users.find(u => u.id === id)?.username);
      if(userBiz) await deleteUser(userBiz.id, 'applications');
      loadData();
  };

  const handleResetPassword = async (id: string) => {
      const newPw = prompt("Enter new password for this user:");
      if(!newPw) return;
      await updateUserPassword(id, newPw, 'users');
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

  const filteredBusinesses = businesses.filter(b => 
      b.business.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row text-white font-sans animate-fade-in">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-zinc-900 border-b lg:border-b-0 lg:border-r border-white/5 flex-shrink-0 flex flex-col h-auto lg:h-screen sticky top-0 z-30">
            <div className="p-6 lg:p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900">
                <div className="font-display text-2xl font-black tracking-tighter text-white">
                    GPHS<span className="text-gold font-light tracking-widest ml-1 opacity-80">ADMIN</span>
                </div>
                <button 
                    className="lg:hidden p-2 text-zinc-500 hover:text-white transition"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu size={24} />
                </button>
            </div>
            
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block flex-1 overflow-y-auto`}>
                <nav className="p-4 space-y-2">
                    <button onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'overview' ? 'bg-gold text-black font-bold' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                        <LayoutDashboard size={18}/> Overview
                    </button>
                    <button onClick={() => { setActiveTab('businesses'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'businesses' ? 'bg-gold text-black font-bold' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                        <Store size={18}/> Listings
                    </button>
                    <button onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'users' ? 'bg-gold text-black font-bold' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                        <Users size={18}/> Users
                    </button>
                    <button onClick={() => { setActiveTab('support'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'support' ? 'bg-gold text-black font-bold' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                        <MessageSquare size={18}/> Support 
                        {stats.openTickets > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.openTickets}</span>}
                    </button>
                </nav>

                <div className="p-4 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-gold font-black">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white">Admin Console</div>
                            <div className="text-[10px] text-zinc-500">v2.1 Stable</div>
                        </div>
                    </div>
                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition text-sm font-bold">
                        <LogOut size={16}/> Logout
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-auto lg:h-screen p-6 lg:p-16 bg-zinc-950">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="font-display text-4xl text-white uppercase tracking-tight mb-2">
                        {activeTab === 'overview' && 'Dashboard Overview'}
                        {activeTab === 'businesses' && 'Listing Management'}
                        {activeTab === 'users' && 'User Directory'}
                        {activeTab === 'support' && 'Support Center'}
                    </h1>
                    <p className="text-zinc-500 text-sm">Welcome back, Administrator.</p>
                </div>
                <button onClick={loadData} className="p-3 bg-zinc-900 border border-white/5 rounded-full hover:rotate-180 transition duration-500 text-gold shadow-lg">
                    <RefreshCw size={20}/>
                </button>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-gold animate-pulse">
                    <Sparkles size={32}/>
                </div>
            ) : (
                <>
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                            {[
                                { label: 'Total Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: <TrendingUp size={24}/>, color: 'text-green-500' },
                                { label: 'Active Listings', value: stats.activeListings, icon: <Store size={24}/>, color: 'text-gold' },
                                { label: 'Registered Users', value: stats.users, icon: <Users size={24}/>, color: 'text-blue-500' },
                                { label: 'Open Tickets', value: stats.openTickets, icon: <ShieldAlert size={24}/>, color: 'text-red-500' }
                            ].map((s, i) => (
                                <div key={i} className="glass-card p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                                    <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition duration-500 ${s.color}`}>{s.icon}</div>
                                    <div className={`${s.color} mb-4`}>{s.icon}</div>
                                    <h3 className="text-4xl font-display font-black text-white mb-1">{s.value}</h3>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* BUSINESSES TAB */}
                    {activeTab === 'businesses' && (
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="relative w-full sm:max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18}/>
                                    <input 
                                        type="text" 
                                        placeholder="Search businesses..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 text-white focus:border-gold/30 outline-none"
                                    />
                                </div>
                                {searchTerm && <div className="text-xs text-orange-500 font-bold uppercase">Clear search to reorder</div>}
                            </div>
                            <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400 min-w-[800px]">
                                        <thead className="bg-zinc-900 text-xs font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                                            <tr>
                                                <th className="p-6">Business</th>
                                                <th className="p-6">Owner</th>
                                                <th className="p-6">Status</th>
                                                <th className="p-6">Sub Status</th>
                                                <th className="p-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredBusinesses.map((b, index) => (
                                                <tr key={b.id} className="hover:bg-white/5 transition">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <img src={b.images[0] || 'mascot.png'} className="w-10 h-10 rounded-lg object-cover bg-black"/>
                                                            <div className="font-bold text-white">{b.business}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">{b.owner}</td>
                                                    <td className="p-6">
                                                        <button onClick={() => handleApprove(b.id, b.status)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${b.status === 'approved' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'}`}>
                                                            {b.status}
                                                        </button>
                                                    </td>
                                                    <td className="p-6">
                                                        {b.subscriptionEnd && b.subscriptionEnd > Date.now() ? (
                                                            <span className="text-green-500 flex items-center gap-2"><CheckCircle size={12}/> Active</span>
                                                        ) : (
                                                            <span className="text-red-500 flex items-center gap-2"><XCircle size={12}/> Expired</span>
                                                        )}
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {!searchTerm && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => moveBusiness(index, 'up')} 
                                                                        disabled={index === 0}
                                                                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent" 
                                                                        title="Move Up"
                                                                    >
                                                                        <ArrowUp size={16}/>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => moveBusiness(index, 'down')} 
                                                                        disabled={index === businesses.length - 1}
                                                                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent mr-2" 
                                                                        title="Move Down"
                                                                    >
                                                                        <ArrowDown size={16}/>
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button onClick={() => setEditingBusiness(b)} className="p-2 hover:bg-zinc-800 rounded-lg text-gold transition"><Edit size={16}/></button>
                                                            <button onClick={() => handleDeleteBusiness(b.id)} className="p-2 hover:bg-red-900/20 rounded-lg text-red-500 transition"><Trash2 size={16}/></button>
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
                        <div className="space-y-8">
                             <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18}/>
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 text-white focus:border-gold/30 outline-none"
                                />
                            </div>
                            <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400 min-w-[800px]">
                                        <thead className="bg-zinc-900 text-xs font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                                            <tr>
                                                <th className="p-6">Identity</th>
                                                <th className="p-6">Role</th>
                                                <th className="p-6">Contact</th>
                                                <th className="p-6">Joined</th>
                                                <th className="p-6 text-right">Security</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-white/5 transition">
                                                    <td className="p-6">
                                                        <div className="font-bold text-white">{u.username}</div>
                                                        <div className="text-xs">{u.displayName}</div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-bold uppercase">{u.role}</span>
                                                    </td>
                                                    <td className="p-6">{u.email}</td>
                                                    <td className="p-6">{new Date(u.created || Date.now()).toLocaleDateString()}</td>
                                                    <td className="p-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleResetPassword(u.id)} className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400 transition" title="Reset Password"><Lock size={16}/></button>
                                                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-red-900/20 rounded-lg text-red-500 transition" title="Delete User"><Trash2 size={16}/></button>
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

                    {/* SUPPORT TAB */}
                    {activeTab === 'support' && (
                        <div className="grid grid-cols-1 gap-4">
                            {tickets.length === 0 ? (
                                <div className="p-12 text-center text-zinc-500">No support tickets found.</div>
                            ) : (
                                tickets.map(t => (
                                    <div key={t.id} className={`glass-card p-6 rounded-2xl border flex items-start gap-4 ${t.status === 'open' ? 'border-gold/30 bg-gold/5' : 'border-white/5'}`}>
                                        <div className={`mt-1 p-2 rounded-full ${t.status === 'open' ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                                            <MessageSquare size={16}/>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-white font-bold">{t.category}</h3>
                                                    <div className="text-xs text-zinc-400">From: {t.email} • {new Date(t.date).toLocaleDateString()}</div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${t.status === 'open' ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{t.status}</span>
                                            </div>
                                            <p className="text-zinc-300 text-sm mb-4 bg-black/20 p-3 rounded-lg border border-white/5">"{t.message}"</p>
                                            {t.reply && (
                                                <div className="mb-4 ml-4 pl-4 border-l-2 border-gold/30 text-sm">
                                                    <div className="text-[10px] font-black uppercase text-gold mb-1">Admin Reply</div>
                                                    <p className="text-zinc-400">{t.reply}</p>
                                                </div>
                                            )}
                                            {t.status === 'open' && (
                                                <button onClick={() => setReplyTicket(t)} className="text-xs font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-gold transition flex items-center gap-2">
                                                    Reply & Close <ExternalLink size={12}/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </main>

        {editingBusiness && (
            <EditBusinessModal 
                business={editingBusiness} 
                onClose={() => setEditingBusiness(null)} 
                onRefresh={loadData} 
                isAdmin={true} 
            />
        )}

        {replyTicket && (
            <ReplyModal 
                ticket={replyTicket} 
                onClose={() => setReplyTicket(null)} 
                onRefresh={loadData} 
            />
        )}
    </div>
  );
};
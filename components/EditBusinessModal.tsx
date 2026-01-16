
import React, { useState, useEffect, useRef } from 'react';
import { Business, BusinessTicket } from '../types';
import { db, uploadImage, deleteUser, getBusinessTickets, resolveBusinessTicket } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Save, Trash2, CheckCircle, Image as ImageIcon, Calendar, Star, Plus, Link, AlertTriangle, Instagram, Twitter, Facebook, Globe, Phone, Mail, Loader2, User, Upload, Camera, BadgeCheck, Store, MapPin, Clock, DollarSign, Sparkles, RefreshCw, Inbox, MessageSquare, Reply } from 'lucide-react';

interface Props {
  business: Business;
  onClose: () => void;
  onRefresh: () => void | Promise<void>;
  isAdmin: boolean;
}

export const EditBusinessModal: React.FC<Props> = ({ business, onClose, onRefresh, isAdmin }) => {
  const [formData, setFormData] = useState<Partial<Business>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'gallery' | 'inbox' | 'admin'>('details');
  const [loading, setLoading] = useState(false);
  const [subDays, setSubDays] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Ticket System State
  const [tickets, setTickets] = useState<BusinessTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Separate state for social links
  const [socialLinks, setSocialLinks] = useState({ instagram: '', twitter: '', facebook: '', website: '' });

  // Refs for hidden file inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({ ...business });
    
    // Parse existing social string into separate fields
    const s = business.social || '';
    const parts = s.split(',').map(p => p.trim());
    const newLinks = { instagram: '', twitter: '', facebook: '', website: '' };
    
    parts.forEach(link => {
        const l = link.toLowerCase();
        if (l.includes('instagram')) newLinks.instagram = link;
        else if (l.includes('twitter') || l.includes('x.com')) newLinks.twitter = link;
        else if (l.includes('facebook')) newLinks.facebook = link;
        else if (link) newLinks.website = link; // Assign remaining to website
    });
    setSocialLinks(newLinks);

    // Calculate remaining days based on business data initially
    calculateDays(business.subscriptionEnd);
    
    // Fetch tickets if inbox tab active (or pre-fetch)
    fetchTickets();
  }, [business]);

  const fetchTickets = async () => {
      setLoadingTickets(true);
      try {
          const t = await getBusinessTickets(business.id);
          setTickets(t);
      } catch (e) {
          console.error("Failed to load tickets", e);
      } finally {
          setLoadingTickets(false);
      }
  };

  const calculateDays = (endTime: number | undefined) => {
    const now = Date.now();
    const end = Number(endTime) || 0;
    const diff = end - now;
    // If diff is negative (expired), we can show negative days or just treat as 0/expired logic
    const days = Math.ceil(diff / 86400000);
    setSubDays(days);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (approve = false) => {
    setLoading(true);
    try {
      // Combine social links back into one string
      const socialString = [
          socialLinks.instagram,
          socialLinks.twitter,
          socialLinks.facebook,
          socialLinks.website
      ].filter(Boolean).join(',');

      const updates: any = { ...formData, social: socialString };
      delete updates.id;

      if (approve) updates.status = 'approved';
      
      const ref = doc(db, "applications", business.id);
      await updateDoc(ref, updates);
      alert("Business saved successfully!");
      if(onRefresh) await onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error saving business");
    } finally {
      setLoading(false);
    }
  };

  // Modified to update local state only
  const addTime = (days: number) => {
    const now = Date.now();
    // Use current formData subscriptionEnd or default to now
    const currentEnd = (typeof formData.subscriptionEnd === 'number' && formData.subscriptionEnd > now) 
        ? formData.subscriptionEnd 
        : now;
    
    const newEnd = currentEnd + (days * 86400000);
    
    // Update form data
    setFormData(prev => ({ ...prev, subscriptionEnd: newEnd }));
    
    // Update UI display
    calculateDays(newEnd);
  };

  // Modified to update local state only
  const setExpired = () => {
      setFormData(prev => ({ ...prev, subscriptionEnd: 0 }));
      setSubDays(-1);
  };

  const deleteBusiness = async () => {
      if(!business?.id) {
          alert("Error: Business record is missing an ID.");
          return;
      }
      if(!window.confirm("Permanently delete this business listing? This action cannot be undone.")) return;
      
      setLoading(true);
      try {
          // Use shared deleteUser helper which handles proper deletion for applications
          await deleteUser(business.id, 'applications');
          
          if(onRefresh) await onRefresh();
          onClose();
      } catch (e: any) {
          console.error("Delete failed:", e);
          alert("Error deleting business: " + (e.message || "Unknown error occurred."));
      } finally {
          setLoading(false);
      }
  };

  const deleteImage = async (index: number) => {
      if(!window.confirm("Delete this image?")) return;
      const currentImages = formData.images || [];
      const newImages = currentImages.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleAddImageUrl = () => {
      if (!newImageUrl) return;
      const currentImages = formData.images || [];
      setFormData({ ...formData, images: [...currentImages, newImageUrl] });
      setNewImageUrl('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
          const url = await uploadImage(file);
          const currentImages = formData.images || [];
          setFormData({ ...formData, images: [...currentImages, url] });
      } catch (e: any) {
          console.error(e);
          alert("Failed to upload image. Please try again or use a URL.");
      } finally {
          setUploading(false);
          // Reset input
          if (e.target) e.target.value = '';
      }
  };

  const handleTicketReply = async (ticket: BusinessTicket) => {
      if(!replyText.trim()) return;
      
      setLoading(true); // Re-use global loading for simplicity
      try {
          await resolveBusinessTicket(ticket.id, replyText);
          
          // Open mail client
          const subject = encodeURIComponent(`Re: ${ticket.subject} - Support`);
          const body = encodeURIComponent(`Hi ${ticket.customerName},\n\n${replyText}\n\n--\n${business.business} Support`);
          window.location.href = `mailto:${ticket.customerEmail}?subject=${subject}&body=${body}`;
          
          setReplyText('');
          setActiveTicketId(null);
          await fetchTickets();
      } catch (e) {
          alert("Failed to resolve ticket.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-zinc-950 w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[90vh] relative animate-fade-in">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-zinc-900/50 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <Store className="text-gold-400" size={24} />
                <h2 className="font-display text-2xl text-white uppercase tracking-wider font-black">Manage Venture</h2>
            </div>
            <p className="text-zinc-400 text-xs font-medium tracking-wide">Editing Profile: <span className="text-white font-bold">{business.business}</span></p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white group">
            <X size={20} className="group-hover:rotate-90 transition duration-300" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6 pb-2 bg-zinc-950 border-b border-white/5">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {['details', 'gallery', 'inbox', isAdmin && 'admin'].filter(Boolean).map((tab) => (
                    <button 
                        key={tab as string}
                        onClick={() => setActiveTab(tab as any)} 
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab 
                            ? 'bg-gold-400 text-black border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                            : 'bg-zinc-900 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                    >
                        {tab === 'inbox' ? (
                            <span className="flex items-center gap-2">Inbox {tickets.filter(t => t.status === 'open').length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}</span>
                        ) : tab}
                    </button>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-zinc-950">
          {activeTab === 'details' && (
            <div className="space-y-12">
                {/* Section 1: Core Identity */}
                <div className="space-y-6">
                    <h3 className="text-white font-display text-lg uppercase tracking-wide border-l-2 border-gold-400 pl-3">Core Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Business Name</label>
                            <input name="business" value={formData.business || ''} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50 outline-none transition font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Market Category</label>
                            <div className="relative">
                                <select name="category" value={formData.category || ''} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white focus:border-gold-400 outline-none appearance-none cursor-pointer">
                                    <option value="General">General</option>
                                    <option value="Food & Drink">Food & Drink</option>
                                    <option value="Clothing">Clothing</option>
                                    <option value="Services">Services</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Art & Design">Art & Design</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">My Role</label>
                            <input name="ownerPos" value={formData.ownerPos || ''} onChange={handleChange} placeholder="e.g. Founder & CEO" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-gold-400 outline-none transition" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Vision & Description</label>
                            <textarea name="description" rows={4} value={formData.description || ''} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-gold-400 outline-none transition resize-none leading-relaxed" />
                        </div>
                    </div>
                </div>

                {/* Section 2: Operations */}
                <div className="space-y-6">
                    <h3 className="text-white font-display text-lg uppercase tracking-wide border-l-2 border-gold-400 pl-3">Operations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><DollarSign size={14}/> Pricing Tier</label>
                            <input name="price" value={formData.price || ''} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-gold-400 outline-none transition" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={14}/> Location</label>
                            <input name="location" value={formData.location || ''} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-gold-400 outline-none transition" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock size={14}/> Availability</label>
                            <input name="hours" value={formData.hours || ''} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-gold-400 outline-none transition" />
                         </div>
                    </div>
                </div>

                {/* Section 3: Digital Presence */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 md:p-8">
                    <h3 className="text-white font-display text-lg uppercase tracking-wide mb-6 flex items-center gap-2">
                        <Globe size={20} className="text-gold-400" /> Digital Presence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="relative group">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pink-500 transition"><Instagram size={18}/></div>
                             <input placeholder="Instagram URL" value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 focus:border-pink-500 focus:bg-black/60 outline-none transition text-sm" />
                         </div>
                         <div className="relative group">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition"><Twitter size={18}/></div>
                             <input placeholder="Twitter/X URL" value={socialLinks.twitter} onChange={e => setSocialLinks({...socialLinks, twitter: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 focus:border-blue-400 focus:bg-black/60 outline-none transition text-sm" />
                         </div>
                         <div className="relative group">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-600 transition"><Facebook size={18}/></div>
                             <input placeholder="Facebook URL" value={socialLinks.facebook} onChange={e => setSocialLinks({...socialLinks, facebook: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 focus:border-blue-600 focus:bg-black/60 outline-none transition text-sm" />
                         </div>
                         <div className="relative group">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-gold-400 transition"><Link size={18}/></div>
                             <input placeholder="Website / Other URL" value={socialLinks.website} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 focus:border-gold-400 focus:bg-black/60 outline-none transition text-sm" />
                         </div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-8">
                <input 
                    type="file" 
                    ref={galleryInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                />
                
                <div 
                    onClick={() => galleryInputRef.current?.click()}
                    className={`bg-zinc-900/50 border-2 border-dashed border-zinc-800 hover:border-gold-400/50 hover:bg-zinc-900 transition rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer group ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    {uploading ? (
                        <Loader2 className="text-gold-400 animate-spin mb-4" size={40}/>
                    ) : (
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6 group-hover:bg-gold-400 group-hover:text-black transition text-zinc-500 shadow-xl">
                             <Upload size={32}/>
                        </div>
                    )}
                    <h3 className="font-display text-2xl text-white uppercase tracking-wider mb-2">Upload Visuals</h3>
                    <p className="text-zinc-500 text-sm">Click to select high-res images from your device</p>
                </div>

                <div className="flex items-center gap-4 my-6">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">OR PASTE URL</span>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1 group">
                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold-400 transition" size={18}/>
                        <input 
                            type="text" 
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg" 
                            className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:border-gold-400 focus:outline-none transition"
                        />
                    </div>
                    <button onClick={handleAddImageUrl} className="bg-zinc-800 text-white font-bold px-8 rounded-xl hover:bg-zinc-700 transition uppercase flex items-center gap-2">
                        <Plus size={18} /> Add
                    </button>
                </div>

                <div className="pt-8 border-t border-white/5">
                    <h3 className="text-zinc-400 font-bold uppercase text-xs mb-6 flex items-center gap-2"><ImageIcon size={16}/> Current Gallery ({formData.images?.length || 0})</h3>
                    {(!formData.images || formData.images.length === 0) && (
                        <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-white/5 border-dashed">
                             <p className="text-zinc-600 italic text-sm">No images added yet.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {formData.images?.map((img, i) => (
                            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-lg">
                                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-sm">
                                    <button onClick={() => deleteImage(i)} className="bg-red-500 text-white p-3 rounded-full hover:scale-110 transition shadow-xl">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'inbox' && (
              <div className="space-y-6">
                  {/* Added Header with Refresh Button */}
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="font-display text-lg text-white uppercase tracking-wide">Support Inbox</h3>
                      <button onClick={fetchTickets} className="p-2 bg-zinc-900 border border-white/5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                          <RefreshCw size={14} className={loadingTickets ? 'animate-spin' : ''} /> Refresh
                      </button>
                  </div>

                  {loadingTickets ? (
                      <div className="text-center py-20 text-gold-400 animate-pulse">
                          <Loader2 size={32} className="mx-auto mb-2 animate-spin"/>
                          <p className="text-[10px] font-black uppercase tracking-widest">Accessing Secure Messages...</p>
                      </div>
                  ) : tickets.length === 0 ? (
                      <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5 border-dashed">
                          <Inbox size={48} className="mx-auto mb-4 text-zinc-700"/>
                          <h3 className="text-zinc-400 font-bold mb-1">No Tickets</h3>
                          <p className="text-zinc-600 text-sm">Your help desk is clear.</p>
                      </div>
                  ) : (
                      <div className="grid gap-4">
                          {tickets.map(ticket => (
                              <div key={ticket.id} className={`bg-zinc-900/50 border border-white/5 rounded-2xl p-6 ${ticket.status === 'closed' ? 'opacity-50' : 'border-gold-500/20'}`}>
                                  <div className="flex justify-between items-start mb-4">
                                      <div>
                                          <div className="flex items-center gap-2 mb-1">
                                              <h4 className="text-white font-bold text-lg">{ticket.subject}</h4>
                                              {ticket.status === 'open' ? (
                                                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded">Open</span>
                                              ) : (
                                                  <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black uppercase rounded">Resolved</span>
                                              )}
                                          </div>
                                          <div className="text-xs text-zinc-500 flex items-center gap-2">
                                              <User size={12}/> {ticket.customerName}
                                              <span className="text-zinc-700">|</span>
                                              <Mail size={12}/> {ticket.customerEmail}
                                              <span className="text-zinc-700">|</span>
                                              {new Date(ticket.timestamp).toLocaleDateString()}
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="bg-black/40 p-4 rounded-xl text-zinc-300 text-sm mb-4 border border-white/5 font-medium">
                                      "{ticket.message}"
                                  </div>

                                  {ticket.status === 'open' && (
                                      <div>
                                          {activeTicketId === ticket.id ? (
                                              <div className="space-y-3 animate-fade-in bg-zinc-950 p-4 rounded-xl border border-white/10">
                                                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Your Response</label>
                                                  <textarea 
                                                      value={replyText} 
                                                      onChange={e => setReplyText(e.target.value)}
                                                      placeholder="Type your reply here..."
                                                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-gold/50 transition"
                                                      rows={3}
                                                  />
                                                  <div className="flex gap-2 justify-end">
                                                      <button onClick={() => setActiveTicketId(null)} className="px-4 py-2 text-zinc-500 hover:text-white text-xs font-bold uppercase transition">Cancel</button>
                                                      <button onClick={() => handleTicketReply(ticket)} className="px-6 py-2 bg-gold text-black rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-white transition">
                                                          <Reply size={14}/> Send & Resolve
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <button onClick={() => { setActiveTicketId(ticket.id); setReplyText(''); }} className="text-gold text-xs font-bold uppercase hover:text-white transition flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg hover:bg-gold/20">
                                                  <MessageSquare size={14}/> Reply to Ticket
                                              </button>
                                          )}
                                      </div>
                                  )}
                                  
                                  {ticket.reply && (
                                      <div className="mt-4 pl-4 border-l-2 border-gold/30">
                                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Response sent {ticket.replyTimestamp && new Date(ticket.replyTimestamp).toLocaleDateString()}</p>
                                          <p className="text-zinc-400 text-sm">{ticket.reply}</p>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Featured Status Button */}
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 flex items-center justify-between hover:border-gold-400/30 transition">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${formData.featured ? 'bg-gold-400 text-black' : 'bg-zinc-800 text-zinc-600'}`}>
                            <Star size={24} fill={formData.featured ? "black" : "none"} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Featured</h3>
                            <p className="text-zinc-500 text-xs">Highlight on homepage.</p>
                        </div>
                     </div>
                     <button 
                        type="button"
                        onClick={() => setFormData({...formData, featured: !formData.featured})}
                        className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                            formData.featured 
                            ? 'bg-gold-400 text-black shadow-lg shadow-gold-400/25' 
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
                        }`}
                     >
                        {formData.featured ? 'Active' : 'Turn On'}
                     </button>
                  </div>

                  {/* Verified Status Button */}
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 flex items-center justify-between hover:border-blue-500/30 transition">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${formData.verified ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-600'}`}>
                            <BadgeCheck size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Verified</h3>
                            <p className="text-zinc-500 text-xs">Official trust badge.</p>
                        </div>
                     </div>
                     <button 
                        type="button"
                        onClick={() => setFormData({...formData, verified: !formData.verified})}
                        className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                            formData.verified 
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
                        }`}
                     >
                        {formData.verified ? 'Verified' : 'Turn On'}
                     </button>
                  </div>
              </div>

              <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10">
                <div className="flex items-center justify-between mb-8">
                     <h3 className="font-display text-xl text-white flex items-center gap-3"><Calendar size={24} className="text-gold-400"/> Subscription Status</h3>
                     <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${subDays >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                         {subDays >= 0 ? 'Active' : 'Expired'}
                     </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Status Display */}
                    <div className="flex flex-col justify-center">
                       {subDays >= 0 ? (
                            <div>
                                <div className="text-5xl font-display font-black text-white mb-2">{subDays}</div>
                                <div className="text-zinc-500 text-sm font-medium">Days remaining in current plan</div>
                            </div>
                       ) : (
                            <div>
                                <div className="text-4xl font-display font-black text-red-500 mb-2 flex items-center gap-3">
                                     <AlertTriangle size={36}/> Expired
                                </div>
                                <div className="text-red-400/70 text-sm">Subscription ended {Math.abs(subDays)} days ago</div>
                            </div>
                       )}
                    </div>

                    {/* Controls - RESTORED CUSTOM BUTTONS & TIMER */}
                    <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Quick Modify</div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => addTime(7)} className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-xs font-bold transition">+1 Week</button>
                            <button onClick={() => addTime(30)} className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-xs font-bold transition">+1 Month</button>
                            <button onClick={() => addTime(90)} className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-xs font-bold transition">+3 Months</button>
                            <button onClick={setExpired} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg text-xs font-bold transition border border-red-500/20">Expire Now</button>
                        </div>

                        <div className="h-px bg-white/5 my-4"></div>

                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Custom Days</div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => addTime(-1)} 
                                className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-gold-400 hover:text-black transition"
                             >-</button>
                             <div className="flex-1 bg-zinc-900 border border-white/10 rounded-lg flex items-center justify-center text-white font-mono">
                                 {subDays > 0 ? `+${subDays}` : subDays}
                             </div>
                             <button 
                                onClick={() => addTime(1)} 
                                className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-gold-400 hover:text-black transition"
                             >+</button>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-3 text-center">Changes saved on confirmation.</p>
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/10 bg-zinc-950 flex justify-between items-center gap-4">
           {/* DELETE BUTTON ADDED BACK */}
           <button 
                type="button"
                onClick={deleteBusiness}
                className="bg-red-900/10 text-red-500 border border-red-900/30 p-4 rounded-xl font-bold hover:bg-red-900/30 transition uppercase flex items-center gap-2 tracking-wide text-xs"
           >
               <Trash2 size={18} /> <span className="hidden md:inline">Delete Business</span>
           </button>

           <div className="flex gap-4 flex-1 justify-end">
               {isAdmin && (
                 <button 
                    type="button"
                    onClick={() => handleSave(true)} 
                    disabled={loading}
                    className="bg-green-900/20 text-green-500 border border-green-900/50 p-4 rounded-xl font-bold hover:bg-green-900/40 transition uppercase flex justify-center items-center gap-2 disabled:opacity-50 tracking-wide text-xs px-6"
                 >
                    {loading ? 'Processing...' : <><CheckCircle size={18} /> Approve</>}
                 </button>
               )}
               <button 
                  type="button"
                  onClick={() => handleSave(false)} 
                  disabled={loading}
                  className="bg-gold-400 text-black p-4 rounded-xl font-black hover:bg-white transition uppercase flex justify-center items-center gap-2 disabled:opacity-50 tracking-widest text-xs shadow-xl shadow-gold-400/20 px-8"
               >
                  {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
               </button>
           </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm animate-fade-in">
                <Sparkles size={48} className="text-gold-400 animate-pulse mb-4" />
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Processing...</p>
            </div>
        )}
      </div>
    </div>
  );
};

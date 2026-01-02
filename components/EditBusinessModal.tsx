import React, { useState, useEffect, useRef } from 'react';
import { Business } from '../types';
import { db, uploadImage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Save, Trash2, CheckCircle, Image as ImageIcon, Calendar, Star, Plus, Link, AlertTriangle, Instagram, Twitter, Facebook, Globe, Phone, Mail, Loader2, User, Upload, Camera, BadgeCheck, Store, MapPin, Clock, DollarSign, Sparkles } from 'lucide-react';

interface Props {
  business: Business;
  onClose: () => void;
  onRefresh: () => void | Promise<void>;
  isAdmin: boolean;
}

export const EditBusinessModal: React.FC<Props> = ({ business, onClose, onRefresh, isAdmin }) => {
  const [formData, setFormData] = useState<Partial<Business>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'gallery' | 'admin'>('details');
  const [loading, setLoading] = useState(false);
  const [subDays, setSubDays] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [customDays, setCustomDays] = useState(30);
  
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

    // Calculate remaining days
    const now = Date.now();
    const end = Number(business.subscriptionEnd) || 0; // Ensure number
    const diff = end - now;
    const days = Math.ceil(diff / 86400000);
    setSubDays(days);
  }, [business]);

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

  const addTime = (days: number) => {
    // Explicitly cast to Number to avoid string concatenation if data is malformed
    const subEnd = Number(business.subscriptionEnd);
    const currentEnd = (subEnd && subEnd > Date.now()) ? subEnd : Date.now();
    const newEnd = currentEnd + (days * 86400000);
    
    const ref = doc(db, "applications", business.id);
    updateDoc(ref, { subscriptionEnd: newEnd }).then(async () => {
        setSubDays(prev => prev + days);
        alert(`Successfully adjusted subscription by ${days} days.`);
        if(onRefresh) await onRefresh();
    });
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-zinc-950 w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[90vh] relative">
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
                {['details', 'gallery', isAdmin && 'admin'].filter(Boolean).map((tab) => (
                    <button 
                        key={tab as string}
                        onClick={() => setActiveTab(tab as any)} 
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab 
                            ? 'bg-gold-400 text-black border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                            : 'bg-zinc-900 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                    >
                        {tab}
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

          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Featured Toggle */}
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 flex items-center justify-between hover:border-gold-400/30 transition">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center text-gold-400"><Star size={24}/></div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Featured Business</h3>
                            <p className="text-zinc-500 text-xs">Display on homepage hero.</p>
                        </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.featured || false} 
                            onChange={(e) => setFormData({...formData, featured: e.target.checked})} 
                            className="sr-only peer" 
                        />
                        <div className="w-14 h-8 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold-400"></div>
                     </label>
                  </div>

                  {/* Verified Toggle */}
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 flex items-center justify-between hover:border-blue-500/30 transition">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400"><BadgeCheck size={24}/></div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Verified Business</h3>
                            <p className="text-zinc-500 text-xs">Mark as officially trusted.</p>
                        </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.verified || false} 
                            onChange={(e) => setFormData({...formData, verified: e.target.checked})} 
                            className="sr-only peer" 
                        />
                        <div className="w-14 h-8 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                     </label>
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

                    {/* Controls */}
                    <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Modify Duration</div>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                 <select 
                                    onChange={(e) => setCustomDays(Number(e.target.value))}
                                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gold-400 outline-none transition"
                                    defaultValue={30}
                                 >
                                    <option value={7}>1 Week (+7 days)</option>
                                    <option value={30}>1 Month (+30 days)</option>
                                    <option value={90}>3 Months (+90 days)</option>
                                    <option value={180}>6 Months (+180 days)</option>
                                    <option value={365}>1 Year (+365 days)</option>
                                    <option value={-7}>Revoke 1 Week (-7 days)</option>
                                    <option value={-30}>Revoke 1 Month (-30 days)</option>
                                 </select>
                                 <input 
                                    type="number"
                                    value={customDays}
                                    onChange={(e) => setCustomDays(Number(e.target.value))}
                                    className="w-24 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gold-400 outline-none text-center font-bold"
                                    placeholder="Days"
                                 />
                            </div>
                            <button 
                                onClick={() => addTime(customDays)}
                                className="w-full bg-white text-black px-6 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gold-400 transition shadow-lg"
                            >
                                Apply Adjustment
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/10 bg-zinc-950 flex gap-4">
           {isAdmin && (
             <>
               <button 
                  type="button"
                  onClick={() => handleSave(true)} 
                  disabled={loading}
                  className="flex-1 bg-green-900/20 text-green-500 border border-green-900/50 p-4 rounded-xl font-bold hover:bg-green-900/40 transition uppercase flex justify-center items-center gap-2 disabled:opacity-50 tracking-wide text-xs"
               >
                  {loading ? 'Processing...' : <><CheckCircle size={18} /> Approve</>}
               </button>
             </>
           )}
           <button 
              type="button"
              onClick={() => handleSave(false)} 
              disabled={loading}
              className="flex-[2] bg-gold-400 text-black p-4 rounded-xl font-black hover:bg-white transition uppercase flex justify-center items-center gap-2 disabled:opacity-50 tracking-widest text-xs shadow-xl shadow-gold-400/20"
           >
              {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
           </button>
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
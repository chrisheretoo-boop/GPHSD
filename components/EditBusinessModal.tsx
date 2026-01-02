import React, { useState, useEffect, useRef } from 'react';
import { Business } from '../types';
import { db, uploadImage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Save, Trash2, CheckCircle, Image as ImageIcon, Calendar, Star, Plus, Link, AlertTriangle, Instagram, Twitter, Facebook, Globe, Phone, Mail, Loader2, User, Upload, Camera } from 'lucide-react';

interface Props {
  business: Business;
  onClose: () => void;
  onRefresh: () => void | Promise<void>;
  isAdmin: boolean;
}

export const EditBusinessModal: React.FC<Props> = ({ business, onClose, onRefresh, isAdmin }) => {
  const [formData, setFormData] = useState<Partial<Business>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'owner' | 'gallery' | 'admin'>('details');
  const [loading, setLoading] = useState(false);
  const [subDays, setSubDays] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Separate state for social links
  const [socialLinks, setSocialLinks] = useState({ instagram: '', twitter: '', facebook: '', website: '' });

  // Refs for hidden file inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

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
        alert(`Added ${days} days.`);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'gallery' | 'owner') => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
          const url = await uploadImage(file);
          if (target === 'gallery') {
              const currentImages = formData.images || [];
              setFormData({ ...formData, images: [...currentImages, url] });
          } else {
              setFormData({ ...formData, ownerImg: url });
          }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-900 w-full max-w-3xl rounded-xl border border-gold-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950">
          <div>
            <h2 className="font-display text-2xl text-white uppercase tracking-wider">Manage Business</h2>
            <p className="text-zinc-500 text-sm">Editing: <span className="text-gold-400">{business.business}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          <button onClick={() => setActiveTab('details')} className={`flex-1 p-4 font-display text-lg uppercase transition whitespace-nowrap ${activeTab === 'details' ? 'bg-zinc-800 text-gold-400 border-b-2 border-gold-400' : 'text-zinc-500 hover:text-white'}`}>Details</button>
          <button onClick={() => setActiveTab('owner')} className={`flex-1 p-4 font-display text-lg uppercase transition whitespace-nowrap ${activeTab === 'owner' ? 'bg-zinc-800 text-gold-400 border-b-2 border-gold-400' : 'text-zinc-500 hover:text-white'}`}>Profile</button>
          <button onClick={() => setActiveTab('gallery')} className={`flex-1 p-4 font-display text-lg uppercase transition whitespace-nowrap ${activeTab === 'gallery' ? 'bg-zinc-800 text-gold-400 border-b-2 border-gold-400' : 'text-zinc-500 hover:text-white'}`}>Gallery</button>
          {isAdmin && <button onClick={() => setActiveTab('admin')} className={`flex-1 p-4 font-display text-lg uppercase transition whitespace-nowrap ${activeTab === 'admin' ? 'bg-zinc-800 text-gold-400 border-b-2 border-gold-400' : 'text-zinc-500 hover:text-white'}`}>Admin</button>}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-zinc-900">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Business Name</label>
                <input name="business" value={formData.business || ''} onChange={handleChange} className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Category</label>
                <select name="category" value={formData.category || ''} onChange={handleChange} className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none">
                   <option value="General">General</option>
                   <option value="Food & Drink">Food & Drink</option>
                   <option value="Clothing">Clothing</option>
                   <option value="Services">Services</option>
                   <option value="Technology">Technology</option>
                   <option value="Art & Design">Art & Design</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Price Range</label>
                <input name="price" value={formData.price || ''} onChange={handleChange} className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
                <textarea name="description" rows={3} value={formData.description || ''} onChange={handleChange} className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Location</label>
                <input name="location" value={formData.location || ''} onChange={handleChange} className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Hours</label>
                <input name="hours" value={formData.hours || ''} onChange={handleChange} className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none" />
              </div>
              
              {/* Social Media Section */}
              <div className="col-span-2 bg-zinc-950 border border-white/10 rounded-lg p-4 mt-2">
                  <label className="block text-xs font-bold text-gold-400 uppercase mb-3">Social Media & Links</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative group">
                          <Instagram className="absolute left-3 top-3 text-zinc-600 group-focus-within:text-pink-500 transition" size={18}/>
                          <input 
                            placeholder="Instagram URL" 
                            value={socialLinks.instagram} 
                            onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 pl-10 text-white focus:border-gold-400 focus:outline-none text-sm" 
                          />
                      </div>
                      <div className="relative group">
                          <Twitter className="absolute left-3 top-3 text-zinc-600 group-focus-within:text-blue-400 transition" size={18}/>
                          <input 
                            placeholder="Twitter/X URL" 
                            value={socialLinks.twitter} 
                            onChange={e => setSocialLinks({...socialLinks, twitter: e.target.value})}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 pl-10 text-white focus:border-gold-400 focus:outline-none text-sm" 
                          />
                      </div>
                      <div className="relative group">
                          <Facebook className="absolute left-3 top-3 text-zinc-600 group-focus-within:text-blue-600 transition" size={18}/>
                          <input 
                            placeholder="Facebook URL" 
                            value={socialLinks.facebook} 
                            onChange={e => setSocialLinks({...socialLinks, facebook: e.target.value})}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 pl-10 text-white focus:border-gold-400 focus:outline-none text-sm" 
                          />
                      </div>
                      <div className="relative group">
                          <Globe className="absolute left-3 top-3 text-zinc-600 group-focus-within:text-gold-400 transition" size={18}/>
                          <input 
                            placeholder="Website / Other URL" 
                            value={socialLinks.website} 
                            onChange={e => setSocialLinks({...socialLinks, website: e.target.value})}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 pl-10 text-white focus:border-gold-400 focus:outline-none text-sm" 
                          />
                      </div>
                  </div>
              </div>
            </div>
          )}
          
          {activeTab === 'owner' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-6 rounded border border-white/10 flex flex-col items-center mb-6">
                  <div className="relative w-28 h-28 mb-4 group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                      <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden border-2 border-gold-400 flex items-center justify-center">
                          {formData.ownerImg ? (
                              <img src={formData.ownerImg} className="w-full h-full object-cover" />
                          ) : (
                              <User className="text-zinc-600" size={32} />
                          )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                         <Camera className="text-white" size={24}/>
                      </div>
                      {uploading && (
                          <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                              <Loader2 className="animate-spin text-gold-400" size={24}/>
                          </div>
                      )}
                  </div>
                  <input 
                    type="file" 
                    ref={profileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'owner')}
                  />
                  
                  <div className="w-full max-w-sm text-center">
                      <button 
                        onClick={() => profileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-xs font-bold text-gold-400 uppercase hover:text-white transition flex items-center justify-center gap-1 mx-auto mb-2"
                      >
                         <Upload size={12}/> Upload Photo
                      </button>
                      
                      <div className="relative group">
                        <Link className="absolute left-3 top-3 text-zinc-600" size={14}/>
                        <input 
                            name="ownerImg" 
                            value={formData.ownerImg || ''} 
                            onChange={handleChange} 
                            placeholder="Or paste URL..."
                            className="w-full bg-black border border-white/10 rounded p-2 pl-9 text-white focus:border-gold-400 focus:outline-none text-xs text-center" 
                        />
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Owner Full Name</label>
                    <input 
                        name="ownerName" 
                        value={formData.ownerName || ''} 
                        onChange={handleChange} 
                        className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Title / Position</label>
                    <input 
                        name="ownerPos" 
                        value={formData.ownerPos || ''} 
                        onChange={handleChange} 
                        placeholder="Founder, CEO, etc."
                        className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none" 
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Public Contact (Email or Phone)</label>
                    <input 
                        name="ownerContact" 
                        value={formData.ownerContact || ''} 
                        onChange={handleChange} 
                        placeholder="For customers to reach you directly"
                        className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none" 
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Owner Bio</label>
                    <textarea 
                        name="ownerBio" 
                        rows={4}
                        value={formData.ownerBio || ''} 
                        onChange={handleChange} 
                        placeholder="Tell a bit about yourself..."
                        className="w-full bg-zinc-950 border border-white/10 rounded p-3 text-white focus:border-gold-400 focus:outline-none resize-none" 
                    />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6">
                <input 
                    type="file" 
                    ref={galleryInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'gallery')}
                />
                
                <div 
                    onClick={() => galleryInputRef.current?.click()}
                    className={`bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-gold-400/50 hover:bg-zinc-900 transition rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer group ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    {uploading ? (
                        <Loader2 className="text-gold-400 animate-spin mb-2" size={32}/>
                    ) : (
                        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-gold-400 group-hover:text-black transition text-zinc-500">
                             <Upload size={24}/>
                        </div>
                    )}
                    <h3 className="font-display text-xl text-white uppercase tracking-wider mb-1">Upload Image</h3>
                    <p className="text-zinc-500 text-sm">Click to select file from device</p>
                </div>

                <div className="flex items-center gap-4 my-4">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <span className="text-zinc-600 text-xs font-bold uppercase">OR PASTE URL</span>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Link className="absolute left-3 top-3.5 text-zinc-600 group-focus-within:text-gold-400 transition" size={18}/>
                        <input 
                            type="text" 
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg" 
                            className="w-full bg-black border border-white/10 rounded pl-10 pr-4 py-3 text-white focus:border-gold-400 focus:outline-none"
                        />
                    </div>
                    <button onClick={handleAddImageUrl} className="bg-zinc-800 text-white font-bold px-6 rounded hover:bg-zinc-700 transition uppercase flex items-center gap-2">
                        <Plus size={18} /> Add
                    </button>
                </div>

                <div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs mb-4">Current Gallery ({formData.images?.length || 0})</h3>
                    {(!formData.images || formData.images.length === 0) && (
                        <p className="text-zinc-600 italic text-sm">No images added yet.</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.images?.map((img, i) => (
                            <div key={i} className="relative group aspect-square rounded overflow-hidden border border-zinc-800 bg-black">
                            <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <button onClick={() => deleteImage(i)} className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition shadow-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-6">
              {/* Featured Toggle */}
              <div className="bg-zinc-950 p-4 rounded border border-white/10 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-gold-400/20 rounded-full text-gold-400"><Star size={20}/></div>
                    <div>
                        <h3 className="font-bold text-white">Featured Business</h3>
                        <p className="text-zinc-500 text-xs">Display this business prominently on the homepage hero section.</p>
                    </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.featured || false} 
                        onChange={(e) => setFormData({...formData, featured: e.target.checked})} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-400"></div>
                 </label>
              </div>

              <div className="bg-zinc-950 p-4 rounded border border-white/10">
                <h3 className="font-display text-lg text-gold-400 mb-4 flex items-center gap-2"><Calendar size={20}/> Subscription Status</h3>
                <div className="flex items-center gap-4">
                   {subDays >= 0 ? (
                        <div className="text-3xl font-bold text-white">{subDays} <span className="text-sm font-normal text-zinc-500">days left</span></div>
                   ) : (
                        <div className="text-3xl font-bold text-red-500 flex items-center gap-2">
                             <AlertTriangle size={28}/> 
                             Expired <span className="text-sm font-normal text-red-400/70">({Math.abs(subDays)} days ago)</span>
                        </div>
                   )}
                   <div className="flex gap-2">
                     <button onClick={() => addTime(7)} className="px-3 py-1 bg-zinc-800 border border-white/10 hover:border-gold-400 text-white rounded text-sm">+ 7 Days</button>
                     <button onClick={() => addTime(30)} className="px-3 py-1 bg-zinc-800 border border-white/10 hover:border-gold-400 text-white rounded text-sm">+ 30 Days</button>
                     <button onClick={() => addTime(-7)} className="px-3 py-1 bg-red-900/20 border border-red-500/50 hover:bg-red-900/40 text-red-400 rounded text-sm">- 7 Days</button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-zinc-950 flex gap-4">
           {isAdmin && (
             <>
               <button 
                  type="button"
                  onClick={() => handleSave(true)} 
                  disabled={loading}
                  className="flex-1 bg-green-900/20 text-green-500 border border-green-900/50 p-3 rounded font-bold hover:bg-green-900/40 transition uppercase flex justify-center items-center gap-2 disabled:opacity-50"
               >
                  {loading ? 'Processing...' : <><CheckCircle size={18} /> Approve</>}
               </button>
             </>
           )}
           <button 
              type="button"
              onClick={() => handleSave(false)} 
              disabled={loading}
              className="flex-[2] bg-gold-400 text-black p-3 rounded font-bold hover:bg-white transition uppercase flex justify-center items-center gap-2 disabled:opacity-50"
           >
              {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
           </button>
        </div>
      </div>
    </div>
  );
};
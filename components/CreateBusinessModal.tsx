import React, { useState } from 'react';
// Fixed: Added 'Loader2' to the import list from lucide-react
import { X, Store, CheckCircle, ArrowRight, Loader, Clock, Info, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Props {
  user: any;
  onClose: () => void;
  onRefresh: () => void;
}

export const CreateBusinessModal: React.FC<Props> = ({ user, onClose, onRefresh }) => {
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business: '',
    category: 'General',
    description: '',
    price: '$-$$',
    location: 'GPHS Campus',
    hours: '8:00 AM - 3:00 PM'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaymentComplete = async () => {
    setLoading(true);
    try {
        await addDoc(collection(db, "applications"), {
            ...formData,
            owner: user.username,
            // Inherit centralized profile data
            ownerName: user.displayName || user.username, 
            ownerImg: user.profileImg || '',
            ownerBio: user.bio || '',
            ownerContact: user.contactInfo || user.email || '',
            status: 'pending',
            weeklyViews: 0,
            views: 0,
            images: [], 
            reviews: [],
            created: Date.now(),
            subscriptionEnd: Date.now() + (30 * 24 * 60 * 60 * 1000) 
        });
        setStep('success');
        onRefresh();
    } catch (err) {
        alert("Registration failed.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
       <div className="bg-zinc-900 w-full max-w-lg rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-950">
            <div>
                <h2 className="font-display text-2xl text-white uppercase tracking-wider flex items-center gap-3">
                    <Store size={24} className="text-gold"/> New Venture
                </h2>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-1">Expanding your portfolio</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-zinc-600 hover:text-white"><X size={20}/></button>
          </div>
          
          <div className="p-8 overflow-y-auto custom-scrollbar">
            {step === 'details' && (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Business Identity</label>
                        <input name="business" required value={formData.business} onChange={handleChange} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-white focus:border-gold/30 outline-none transition placeholder-zinc-800" placeholder="e.g., GPHS Tech Hub" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Market Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-white focus:border-gold/30 outline-none transition">
                            <option value="General">General</option>
                            <option value="Food & Drink">Food & Drink</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Services">Services</option>
                            <option value="Technology">Technology</option>
                            <option value="Art & Design">Art & Design</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Vision Statement / Pitch</label>
                        <textarea name="description" required rows={4} value={formData.description} onChange={handleChange} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-white focus:border-gold/30 outline-none transition placeholder-zinc-800 resize-none" placeholder="Describe the service..." />
                    </div>
                    <button onClick={() => { if(formData.business && formData.description) setStep('payment'); else alert("Fill required fields."); }} className="w-full bg-white text-black font-black uppercase text-[10px] tracking-widest p-5 rounded-2xl hover:bg-gold transition flex items-center justify-center gap-3 shadow-xl">
                        Launch Next Phase <ArrowRight size={16}/>
                    </button>
                </div>
            )}
            {step === 'payment' && (
                <div className="space-y-6">
                    <div className="bg-black/50 p-8 rounded-3xl border border-white/5 text-center">
                        <h3 className="font-display text-xl text-white mb-2 uppercase">Subscription Setup</h3>
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-6">$1.00 / Weekly Access Fee</p>
                        <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl text-left mb-8">
                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-3"><ShieldCheck size={14}/> Service Agreement</div>
                            <p className="text-zinc-400 text-xs leading-relaxed opacity-70">
                                This listing will inherit your <b>Global Identity</b> profile (Photo, Bio, Contact). Ensure your profile is up to date in your dashboard to maintain consistency.
                            </p>
                        </div>
                        <button onClick={handlePaymentComplete} disabled={loading} className="w-full bg-gold text-black font-black uppercase text-[10px] tracking-widest p-5 rounded-2xl hover:bg-white transition flex items-center justify-center gap-3 shadow-xl shadow-gold/10">
                            <CheckCircle size={16}/> Activate Listing
                        </button>
                    </div>
                </div>
            )}
            {step === 'success' && (
                <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
                     <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold animate-pulse"><CheckCircle size={40} /></div>
                     <h3 className="text-4xl font-display text-white uppercase">Venture Launched</h3>
                     <p className="text-zinc-600 text-xs tracking-wide uppercase font-black">Waiting for directory review</p>
                     <button onClick={onClose} className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gold transition">Return to Command</button>
                </div>
            )}
          </div>
          
          {/* Loading Overlay */}
          {loading && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm animate-fade-in">
                 <Sparkles size={48} className="text-gold animate-pulse mb-4" />
                 <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Processing...</p>
             </div>
          )}
       </div>
    </div>
  );
};
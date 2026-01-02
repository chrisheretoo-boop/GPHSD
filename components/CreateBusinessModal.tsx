import React, { useState } from 'react';
import { X, Store, CheckCircle, ArrowRight, Loader, Clock, Info, ShieldCheck } from 'lucide-react';
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
        // Create the business listing
        await addDoc(collection(db, "applications"), {
            ...formData,
            owner: user.username,
            ownerName: user.username, 
            status: 'pending', // Pending approval
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
        console.error(err);
        alert("Transaction failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
       <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-gold-500/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950">
            <div>
                <h2 className="font-display text-2xl text-white uppercase tracking-wider flex items-center gap-2">
                    <Store size={24} className="text-gold-400"/> Register Business
                </h2>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">
                    {step === 'details' && 'Step 1: Business Details'}
                    {step === 'payment' && 'Step 2: Subscription'}
                    {step === 'success' && 'Registration Complete'}
                </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} className="text-zinc-500 hover:text-white"/></button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {step === 'details' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Business Name</label>
                        <input 
                            name="business"
                            required
                            type="text" 
                            value={formData.business} 
                            onChange={handleChange} 
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition placeholder-zinc-700" 
                            placeholder="e.g., GPHS Coffee Co." 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Category</label>
                        <select 
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition"
                        >
                            <option value="General">General</option>
                            <option value="Food & Drink">Food & Drink</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Services">Services</option>
                            <option value="Technology">Technology</option>
                            <option value="Art & Design">Art & Design</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Description</label>
                        <textarea 
                            name="description"
                            required
                            rows={4}
                            value={formData.description} 
                            onChange={handleChange} 
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition placeholder-zinc-700 resize-none" 
                            placeholder="Tell us about your business..." 
                        />
                    </div>

                    <button 
                        onClick={() => {
                            if(formData.business && formData.description) setStep('payment');
                            else alert("Please fill in all required fields.");
                        }}
                        className="w-full mt-4 bg-gold-400 text-black font-bold p-4 rounded-lg uppercase tracking-widest hover:bg-white transition flex items-center justify-center gap-2"
                    >
                        Next Step <ArrowRight size={18}/>
                    </button>
                </div>
            )}

            {step === 'payment' && (
                <div className="space-y-6">
                    <div className="bg-zinc-950 p-6 rounded border border-white/10 text-center">
                        <h3 className="font-bold text-white text-xl mb-2">Setup Weekly Subscription</h3>
                        <p className="text-zinc-400 text-sm mb-4">Support the directory with a small weekly contribution of <span className="text-white font-bold">$1.00</span>.</p>
                        
                        <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-200 mb-6 text-left">
                            <p className="font-bold mb-2 flex items-center gap-2 text-blue-400"><ShieldCheck size={16}/> Subscription Terms & Conditions</p>
                            <div className="leading-relaxed opacity-80 text-xs space-y-2">
                                <p>By proceeding with this payment, you acknowledge and agree to the following:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><b>Expiration Policy:</b> This payment covers a 7-day listing period. If your subscription is not renewed upon expiration, your business will be <b>automatically removed</b> from the public directory until payment is resumed.</li>
                                    <li><b>School Policy:</b> All business content must adhere to GPHS school guidelines. Admins reserve the right to remove inappropriate listings without refund.</li>
                                    <li><b>No Refunds:</b> All subscription fees are final and non-refundable.</li>
                                </ul>
                                <p className="pt-1 border-t border-blue-500/20 mt-2">
                                    By clicking below, you officially agree to the <b>Terms of Service</b> and <b>Privacy Policy</b>.
                                </p>
                            </div>
                        </div>
                        
                        <a 
                            href="https://buy.stripe.com/eVqfZi0ev6w04b57kb6Vq0m" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gold-400 text-black font-bold px-8 py-4 rounded-lg uppercase tracking-widest hover:bg-white transition mb-4 w-full justify-center"
                        >
                            Pay $1.00 & Subscribe <ArrowRight size={18}/>
                        </a>
                        <p className="text-zinc-600 text-xs mt-4">Opens securely in a new tab via Stripe.</p>
                    </div>

                    <div className="flex gap-3">
                         <button 
                            type="button" 
                            onClick={() => setStep('details')}
                            className="flex-1 bg-zinc-800 text-zinc-400 font-bold p-4 rounded-lg uppercase tracking-widest hover:text-white hover:bg-zinc-700 transition"
                        >
                            Back
                        </button>
                        <button 
                            onClick={handlePaymentComplete}
                            disabled={loading}
                            className="flex-[2] bg-zinc-100 text-black font-bold p-4 rounded-lg uppercase tracking-widest hover:bg-white transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader className="animate-spin" size={18}/> : <><CheckCircle size={18}/> I have subscribed</>}
                        </button>
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                     <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 mb-2 animate-pulse">
                        <Clock size={40} />
                     </div>
                     <h3 className="text-3xl font-display text-white">Application Received</h3>
                     <p className="text-zinc-400 max-w-xs mx-auto">Your business is now <b>pending approval</b>. An admin will review your listing shortly. It will appear online once approved.</p>
                     <button onClick={onClose} className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold uppercase hover:bg-gold-400 transition">Go to Dashboard</button>
                </div>
            )}
          </div>
       </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Business, Review } from '../types';
import { ArrowLeft, MapPin, Clock, DollarSign, User, Mail, Globe, Share2, Star, Send, LogIn, Copy, ExternalLink, Phone, Instagram, Twitter, Facebook, X, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Sparkles, BadgeCheck, HelpCircle, CheckCircle } from 'lucide-react';
import { db, createBusinessTicket } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface Props {
  business: Business;
  onBack: () => void;
  user: any;
  onLogin: () => void;
  onRefresh: () => void;
}

export const BusinessProfile: React.FC<Props> = ({ business, onBack, user, onLogin, onRefresh }) => {
  const [reviews, setReviews] = useState<Review[]>(business.reviews || []);
  const [selectedImage, setSelectedImage] = useState(business.images?.[0] || business.imageURL || 'mascot.png');
  const [showContact, setShowContact] = useState(false);
  
  // Review State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ticket State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketName, setTicketName] = useState('');
  const [ticketSending, setTicketSending] = useState(false);

  const isExpired = business.subscriptionEnd && Number(business.subscriptionEnd) < Date.now();

  useEffect(() => {
      setReviews(business.reviews || []);
      setSelectedImage(business.images?.[0] || business.imageURL || 'mascot.png');
      
      // Pre-fill ticket fields if user is logged in
      if (user) {
          setTicketName(user.displayName || user.username);
          setTicketEmail(user.email || user.contactInfo || '');
      }
  }, [business, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewText.trim()) return;
    setSubmitting(true);
    try {
        const newReview: Review = {
            name: user.username,
            displayName: user.displayName || user.username,
            photoURL: user.profileImg || '',
            rating,
            text: reviewText,
            date: Date.now()
        };
        const ref = doc(db, "applications", business.id);
        await updateDoc(ref, { reviews: arrayUnion(newReview) });
        setReviews([...reviews, newReview]);
        setReviewText('');
        setRating(5);
        onRefresh();
    } catch (err) {
        alert("Review failed.");
    } finally {
        setSubmitting(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setTicketSending(true);
      try {
          await createBusinessTicket(business.id, {
              customerName: ticketName,
              customerEmail: ticketEmail,
              subject: ticketSubject,
              message: ticketMessage
          });
          alert("Ticket submitted! The business owner has been notified.");
          setShowTicketModal(false);
          setTicketSubject('');
          setTicketMessage('');
      } catch (e) {
          console.error(e);
          alert("Failed to submit ticket.");
      } finally {
          setTicketSending(false);
      }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-20 px-6 animate-fade-in relative">
      <div className="max-w-7xl mx-auto">
        <button onClick={onBack} className="mb-12 flex items-center gap-3 text-zinc-600 hover:text-white transition uppercase text-[10px] font-black tracking-[0.3em] group">
          <ArrowLeft size={16} className="group-hover:-translate-x-2 transition" /> Back to Market
        </button>

        {isExpired && (
            <div className="mb-12 glass-card border-red-500/20 rounded-[2rem] p-8 flex items-center gap-6 text-red-500 animate-pulse">
                <AlertTriangle size={32}/>
                <div>
                    <h3 className="font-display text-2xl uppercase">Listing Expired</h3>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Visibility restricted due to inactive subscription</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-12">
            <div className="relative group/gallery">
                <div className="aspect-[16/10] rounded-[3rem] overflow-hidden bg-black shadow-2xl border border-white/5">
                    <img src={selectedImage} className={`w-full h-full object-cover transition-all duration-1000 group-hover/gallery:scale-105 ${isExpired ? 'grayscale' : ''}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-10 left-10">
                        <div className="text-gold text-[10px] font-black uppercase tracking-[0.4em] mb-3">{business.category}</div>
                        <h1 className="font-display text-5xl md:text-7xl text-white leading-none uppercase flex items-center gap-4">
                            {business.business}
                            {business.verified && (
                                <BadgeCheck className="text-blue-500 w-10 h-10 md:w-16 md:h-16" fill="currentColor" stroke="black"/>
                            )}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-12 border-b border-white/5 pb-12">
                 {[
                     { icon: <MapPin size={18}/>, label: 'Origin', value: business.location },
                     { icon: <Clock size={18}/>, label: 'Availability', value: business.hours },
                     { icon: <DollarSign size={18}/>, label: 'Pricing', value: business.price }
                 ].map((stat, i) => stat.value && (
                     <div key={i} className="space-y-2">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                            {stat.icon} {stat.label}
                        </div>
                        <div className="text-white font-bold text-lg">{stat.value}</div>
                     </div>
                 ))}
            </div>

            <div className="space-y-6">
                <h2 className="font-display text-3xl text-white uppercase tracking-tight">The Vision</h2>
                <p className="text-zinc-500 text-xl leading-relaxed font-medium">{business.description}</p>
            </div>

            <div className="pt-16 space-y-12">
                <h2 className="font-display text-4xl text-white uppercase">Client Log</h2>
                <div className="space-y-6">
                    {reviews.length === 0 ? (
                        <div className="p-12 text-center glass-card rounded-[2rem]">
                            <p className="text-zinc-700 font-display uppercase tracking-widest">No entries recorded</p>
                        </div>
                    ) : (
                        reviews.map((r, i) => (
                            <div key={i} className="glass-card rounded-[2.5rem] p-8 flex gap-6">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 border border-white/5">
                                    {r.photoURL ? <img src={r.photoURL} className="w-full h-full object-cover"/> : <User className="w-full h-full p-3 text-zinc-700"/>}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-white font-black uppercase text-[10px] tracking-widest">{r.displayName || r.name}</div>
                                            <div className="flex gap-1 mt-1">
                                                {[...Array(5)].map((_, si) => <Star key={si} size={10} className={si < r.rating ? "text-gold fill-gold" : "text-zinc-800"}/>)}
                                            </div>
                                        </div>
                                        <div className="text-zinc-700 text-[8px] font-black uppercase tracking-widest">{new Date(r.date).toLocaleDateString()}</div>
                                    </div>
                                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">"{r.text}"</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="glass-card rounded-[3rem] p-10 border border-gold/5">
                    <h3 className="font-display text-2xl text-white mb-8 uppercase">Log an Experience</h3>
                    {user ? (
                        <form onSubmit={handleSubmitReview} className="space-y-8">
                             <div className="flex gap-2">
                                {[1,2,3,4,5].map(s => (
                                    <button key={s} type="button" onClick={() => setRating(s)} className="transition hover:scale-110">
                                        <Star size={24} className={s <= rating ? "text-gold fill-gold" : "text-zinc-800"}/>
                                    </button>
                                ))}
                             </div>
                             <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Submit feedback..." className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-6 text-white focus:border-gold/30 outline-none transition text-sm font-medium h-32 resize-none" />
                             <div className="flex justify-end">
                                <button type="submit" disabled={submitting || !reviewText.trim()} className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gold transition-all shadow-xl">
                                    {submitting ? 'Recording...' : 'Post Entry'}
                                </button>
                             </div>
                        </form>
                    ) : (
                        <button onClick={onLogin} className="w-full py-6 glass rounded-[2rem] text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition">Sign in to leave reviews</button>
                    )}
                </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className={`glass-card rounded-[3rem] p-10 space-y-8 border border-white/5 ${isExpired ? 'opacity-30' : ''}`}>
                <div className="text-center">
                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-black mx-auto mb-6 border-2 border-gold/10 shadow-2xl">
                         {business.ownerImg ? <img src={business.ownerImg} className="w-full h-full object-cover"/> : <User size={40} className="text-zinc-800 w-full h-full p-6"/>}
                    </div>
                    <h3 className="text-2xl font-display text-white mb-1 uppercase tracking-tight">{business.ownerName || business.owner}</h3>
                    <div className="text-gold text-[10px] font-black uppercase tracking-widest opacity-60">{business.ownerPos || 'Executive'}</div>
                </div>
                <p className="text-zinc-600 text-sm text-center leading-relaxed italic font-medium">"{business.ownerBio || 'No biography recorded for this owner.'}"</p>
                <button onClick={() => setShowContact(true)} className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-gold transition-all shadow-xl">
                    Initiate Contact
                </button>
                <div className="h-px bg-white/5 w-full"></div>
                
                {/* Support System Button */}
                <button onClick={() => setShowTicketModal(true)} className="w-full py-5 border border-white/10 text-zinc-400 hover:text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    <HelpCircle size={14}/> Help Desk
                </button>
            </div>

            <div className="bg-gradient-to-br from-gold/5 to-transparent border border-white/5 rounded-[2.5rem] p-10">
                <Sparkles size={24} className="text-gold mb-6"/>
                <h3 className="font-display text-xl text-white uppercase mb-4">Market Insight</h3>
                <p className="text-zinc-600 text-xs leading-relaxed font-medium">This is a verified GPHS student enterprise. All revenue directly supports local youth innovation.</p>
            </div>
          </div>
        </div>

        {/* Contact Info Modal */}
        {showContact && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowContact(false)}>
                <div className="bg-zinc-900 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-8 relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowContact(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20}/></button>
                    
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold mx-auto mb-4 border border-gold/20">
                            <Phone size={32} />
                        </div>
                        <h3 className="font-display text-2xl text-white uppercase tracking-tight">Contact Info</h3>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{business.business}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-black/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <Mail size={18}/>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</div>
                                <a href={`mailto:${business.ownerContact}`} className="text-white font-bold hover:text-gold transition text-sm truncate block max-w-[200px]">
                                    {business.ownerContact || 'No email provided'}
                                </a>
                            </div>
                        </div>
                        
                        <div className="bg-black/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <User size={18}/>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Owner Handle</div>
                                <div className="text-white font-bold text-sm">@{business.owner}</div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => setShowContact(false)} className="w-full mt-8 bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 transition">
                        Close
                    </button>
                </div>
            </div>
        )}

        {/* Support Ticket Modal */}
        {showTicketModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-zinc-900 w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl p-8 overflow-hidden relative">
                    <button onClick={() => setShowTicketModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20}/></button>
                    
                    <div className="mb-8">
                        <h3 className="font-display text-2xl text-white uppercase tracking-tight mb-2">Business Help Desk</h3>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Direct support from {business.business}</p>
                    </div>

                    <form onSubmit={handleTicketSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Your Name</label>
                                <input required value={ticketName} onChange={e => setTicketName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-gold/30"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Contact Email</label>
                                <input required type="email" value={ticketEmail} onChange={e => setTicketEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-gold/30"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Subject</label>
                            <input required value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-gold/30"/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Message</label>
                            <textarea required rows={4} value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-gold/30 resize-none"/>
                        </div>
                        <button type="submit" disabled={ticketSending} className="w-full bg-gold text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition flex items-center justify-center gap-2 mt-4">
                            {ticketSending ? <Loader2 size={16} className="animate-spin"/> : <><Send size={16}/> Submit Ticket</>}
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

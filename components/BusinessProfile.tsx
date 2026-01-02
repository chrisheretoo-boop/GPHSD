import React, { useState, useEffect } from 'react';
import { Business, Review } from '../types';
import { ArrowLeft, MapPin, Clock, DollarSign, User, Mail, Globe, Share2, Star, Send, LogIn, Copy, ExternalLink, Phone, Instagram, Twitter, Facebook, X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface Props {
  business: Business;
  onBack: () => void;
  user: any;
  onLogin: () => void;
  onRefresh: () => void;
}

export const BusinessProfile: React.FC<Props> = ({ business, onBack, user, onLogin, onRefresh }) => {
  // Local state for reviews to support optimistic updates
  const [reviews, setReviews] = useState<Review[]>(business.reviews || []);
  const [selectedImage, setSelectedImage] = useState(business.images?.[0] || business.imageURL || 'mascot.png');
  const [showContact, setShowContact] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Expiration Check
  const isExpired = business.subscriptionEnd && Number(business.subscriptionEnd) < Date.now();

  // Sync reviews and image if business prop changes
  useEffect(() => {
      setReviews(business.reviews || []);
      setSelectedImage(business.images?.[0] || business.imageURL || 'mascot.png');
  }, [business]);

  // Gallery Logic
  const galleryImages = business.images && business.images.length > 0 
      ? business.images 
      : [business.imageURL || 'mascot.png'];

  const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
      let currentIndex = galleryImages.indexOf(selectedImage);
      if (currentIndex === -1) currentIndex = 0;
      const newIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
      setSelectedImage(galleryImages[newIndex]);
  };

  const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      let currentIndex = galleryImages.indexOf(selectedImage);
      if (currentIndex === -1) currentIndex = 0;
      const newIndex = (currentIndex + 1) % galleryImages.length;
      setSelectedImage(galleryImages[newIndex]);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewText.trim()) return;
    
    setSubmitting(true);
    try {
        const newReview: Review = {
            name: user.username,
            rating,
            text: reviewText,
            date: Date.now()
        };
        
        const ref = doc(db, "applications", business.id);
        await updateDoc(ref, {
            reviews: arrayUnion(newReview)
        });
        
        // Optimistic update
        setReviews([...reviews, newReview]);
        setReviewText('');
        setRating(5);
        
        // Trigger global refresh
        onRefresh();
    } catch (err) {
        console.error(err);
        alert("Failed to submit review. Please try again.");
    } finally {
        setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Small visual feedback could be added here, but generic alert is functional for now
      alert("Copied to clipboard!");
  };

  const getSocialDetails = (url: string) => {
      const lower = url.toLowerCase();
      if (lower.includes('instagram')) return { icon: <Instagram size={18}/>, label: 'Instagram', color: 'text-pink-500' };
      if (lower.includes('twitter') || lower.includes('x.com')) return { icon: <Twitter size={18}/>, label: 'Twitter', color: 'text-blue-400' };
      if (lower.includes('facebook')) return { icon: <Facebook size={18}/>, label: 'Facebook', color: 'text-blue-600' };
      return { icon: <Globe size={18}/>, label: 'Website', color: 'text-zinc-400' };
  };

  // Parse social links
  const socialLinks = business.social ? business.social.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={onBack} 
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-gold-400 transition uppercase text-sm font-bold tracking-wider group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" /> Back to Directory
        </button>

        {isExpired && (
            <div className="mb-8 bg-red-900/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4 text-red-400 animate-fade-in">
                <div className="p-3 bg-red-900/20 rounded-full">
                    <AlertTriangle size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white">Business Temporarily Unavailable</h3>
                    <p className="text-sm opacity-80">The subscription for this business has expired. Please contact the owner for more information.</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Image */}
            <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative bg-zinc-900 group/image">
               <img 
                 src={selectedImage} 
                 alt={business.business} 
                 className={`w-full h-full object-contain md:object-cover transition-all duration-500 ${isExpired ? 'grayscale opacity-50' : ''}`}
               />
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-gold-400 text-xs font-bold uppercase border border-gold-400/20 z-10">
                 {business.category}
               </div>

               {/* Navigation Arrows */}
               {galleryImages.length > 1 && (
                   <>
                       <button 
                           onClick={handlePrev}
                           className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-gold-400 hover:text-black text-white p-2 md:p-3 rounded-full backdrop-blur-md border border-white/10 transition-all z-20 shadow-lg"
                       >
                           <ChevronLeft size={24} />
                       </button>
                       <button 
                           onClick={handleNext}
                           className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-gold-400 hover:text-black text-white p-2 md:p-3 rounded-full backdrop-blur-md border border-white/10 transition-all z-20 shadow-lg"
                       >
                           <ChevronRight size={24} />
                       </button>
                       
                       {/* Counter Badge */}
                       <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/10 z-10 pointer-events-none">
                           {galleryImages.indexOf(selectedImage) + 1} / {galleryImages.length}
                       </div>
                   </>
               )}
            </div>

            {/* Title & Info */}
            <div>
              <h1 className="font-display text-5xl md:text-6xl text-white mb-4">{business.business}</h1>
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-zinc-400">
                {business.location && (
                  <div className="flex items-center gap-1"><MapPin size={16} className="text-gold-400" /> {business.location}</div>
                )}
                {business.hours && (
                   <div className="flex items-center gap-1"><Clock size={16} className="text-gold-400" /> {business.hours}</div>
                )}
                {business.price && (
                   <div className="flex items-center gap-1"><DollarSign size={16} className="text-gold-400" /> {business.price}</div>
                )}
              </div>
            </div>

            {/* Gallery (Moved Above Description) */}
            {business.images && business.images.length > 0 && (
              <div className="animate-fade-in">
                <h3 className="font-display text-lg text-zinc-500 uppercase mb-3">Gallery ({business.images.length})</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {business.images.map((img, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setSelectedImage(img)}
                        className={`aspect-square rounded-lg overflow-hidden border transition relative group ${selectedImage === img ? 'border-gold-400 ring-2 ring-gold-400/30' : 'border-zinc-800 hover:border-zinc-500'}`}
                    >
                      <img src={img} className={`w-full h-full object-cover ${isExpired ? 'grayscale' : ''}`} />
                      {selectedImage !== img && <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition"/>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                <h3 className="font-display text-2xl text-white mb-4">About the Business</h3>
                <p className="text-zinc-300 leading-relaxed text-lg whitespace-pre-wrap">{business.description}</p>
            </div>

            {/* Reviews Section */}
            <div className="pt-8 border-t border-zinc-800">
                <h3 className="font-display text-3xl text-white mb-6">Customer Reviews</h3>
                
                {/* Review List */}
                <div className="space-y-4 mb-8">
                    {reviews.length === 0 ? (
                        <p className="text-zinc-500 italic">No reviews yet. Be the first to review!</p>
                    ) : (
                        reviews.map((review, idx) => (
                            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs uppercase">
                                            {review.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{review.name}</div>
                                            <div className="flex text-gold-400 gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-zinc-700"} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-zinc-600 text-xs">{new Date(review.date).toLocaleDateString()}</div>
                                </div>
                                <p className="text-zinc-300 text-sm pl-11">{review.text}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Review Form */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <h4 className="font-bold text-white uppercase text-sm mb-4">Write a Review</h4>
                    
                    {!user ? (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-center">
                            <p className="text-zinc-400 mb-4">You must be logged in to leave a review.</p>
                            <button 
                                onClick={onLogin}
                                className="inline-flex items-center gap-2 bg-gold-400 text-black font-bold px-6 py-2 rounded-lg uppercase text-sm hover:bg-white transition"
                            >
                                <LogIn size={16}/> Login to Review
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition hover:scale-110"
                                        >
                                            <Star 
                                                size={24} 
                                                fill={star <= rating ? "#FFD700" : "none"} 
                                                className={star <= rating ? "text-gold-400" : "text-zinc-600 hover:text-gold-400"} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Your Review</label>
                                <textarea 
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="Share your experience with this business..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition resize-none h-24"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={submitting || !reviewText.trim()}
                                    className="bg-gold-400 text-black font-bold px-6 py-2 rounded-lg uppercase text-sm hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting ? 'Posting...' : <><Send size={16}/> Post Review</>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar */}
          <div className="space-y-6">
            
            {/* Owner Card */}
            <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl relative ${isExpired ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-display text-2xl text-white mb-6 border-b border-zinc-800 pb-2">Business Owner</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-gold-400 overflow-hidden border border-zinc-700">
                   {business.ownerImg ? <img src={business.ownerImg} className="w-full h-full object-cover"/> : <User size={32} />}
                </div>
                <div>
                  <div className="font-bold text-lg text-white">{business.ownerName || business.owner}</div>
                  <div className="text-sm text-gold-400">{business.ownerPos || 'Founder'}</div>
                </div>
              </div>
              <p className="text-zinc-400 text-sm mb-6 italic">"{business.ownerBio || 'No bio available.'}"</p>
              
              <div className="space-y-3">
                 <button 
                    onClick={() => setShowContact(true)}
                    disabled={!!isExpired}
                    className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gold-400 transition flex items-center justify-center gap-2 uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Mail size={16} /> Contact Owner
                 </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-gold-500/10 to-transparent border border-gold-500/20 rounded-xl p-6">
               <h3 className="font-display text-xl text-gold-400 mb-2">Support Student Biz</h3>
               <p className="text-zinc-400 text-sm mb-4">By supporting this business, you are helping GPHS students gain real-world entrepreneurial experience.</p>
               <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Verified Student Business
               </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Contact Options Modal */}
      {showContact && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowContact(false)}>
            <div className="bg-zinc-900 w-full max-w-sm rounded-xl border border-zinc-700 shadow-2xl overflow-hidden p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display text-2xl text-white uppercase">Contact Options</h3>
                    <button onClick={() => setShowContact(false)}><X size={20} className="text-zinc-500 hover:text-white"/></button>
                </div>
                
                <div className="space-y-4">
                     {/* Email / Contact */}
                     {business.ownerContact ? (
                        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex items-center justify-between group">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="p-2 bg-zinc-900 rounded-full border border-zinc-800">
                                   {business.ownerContact.includes('@') ? <Mail size={18} className="text-gold-400"/> : <Phone size={18} className="text-gold-400"/>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-xs font-bold text-zinc-500 uppercase">
                                        {business.ownerContact.includes('@') ? 'Email Address' : 'Phone Number'}
                                    </div>
                                    <div className="truncate text-sm text-white select-all font-mono">{business.ownerContact}</div>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => copyToClipboard(business.ownerContact)} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition" title="Copy">
                                    <Copy size={18}/>
                                </button>
                                {business.ownerContact.includes('@') && (
                                    <a href={`mailto:${business.ownerContact}`} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition" title="Send Email">
                                        <ExternalLink size={18}/>
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                         <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-center text-zinc-500 italic text-sm">
                             No email or phone provided.
                         </div>
                    )}

                    {/* Social Links List */}
                    {socialLinks.length > 0 && socialLinks.map((link, idx) => {
                        const details = getSocialDetails(link);
                        return (
                            <div key={idx} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex items-center justify-between group">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-2 bg-zinc-900 rounded-full border border-zinc-800">
                                    <span className={details.color}>{details.icon}</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-xs font-bold text-zinc-500 uppercase">{details.label}</div>
                                        <div className="truncate text-sm text-white">{link.replace(/^https?:\/\/(www\.)?/, '')}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => copyToClipboard(link)} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition" title="Copy Link">
                                        <Copy size={18}/>
                                    </button>
                                    <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition" title="Open Link">
                                        <ExternalLink size={18}/>
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500">Please mention <span className="text-gold-400 font-bold">GPHS Directory</span> when contacting.</p>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
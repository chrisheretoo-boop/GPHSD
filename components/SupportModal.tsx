import React, { useState } from 'react';
import { X, Send, MessageSquare, AlertCircle, CheckCircle, LifeBuoy, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Props {
  onClose: () => void;
}

export const SupportModal: React.FC<Props> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General Support');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await addDoc(collection(db, "support_tickets"), {
            email,
            name,
            category,
            message,
            date: Date.now(),
            status: 'open'
        });
        setSuccess(true);
        setTimeout(() => {
            onClose();
        }, 2000);
    } catch (err) {
        console.error(err);
        alert("Failed to submit ticket. Please try again.");
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
       <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-gold-500/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] overflow-hidden flex flex-col max-h-[90vh] relative">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950">
            <div>
                <h2 className="font-display text-2xl text-white uppercase tracking-wider flex items-center gap-2">
                    <LifeBuoy size={24} className="text-gold-400"/> Support
                </h2>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">We are here to help</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} className="text-zinc-500 hover:text-white"/></button>
          </div>
          
          {success ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2">
                      <CheckCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-display text-white">Ticket Submitted!</h3>
                  <p className="text-zinc-400 text-sm">We've received your message and will get back to you shortly.</p>
                  <button onClick={onClose} className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-sm font-bold uppercase transition">Close</button>
              </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input 
                        required
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition placeholder-zinc-700" 
                        placeholder="John Doe" 
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                    <input 
                        required
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition placeholder-zinc-700" 
                        placeholder="john@example.com" 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Category</label>
                    <select 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition"
                    >
                        <option value="General Support">General Support</option>
                        <option value="Password Reset">Password Reset</option>
                        <option value="Bug Report">Bug Report</option>
                        <option value="Feature Request">Feature Request</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Message</label>
                    <textarea 
                        required
                        rows={5}
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition placeholder-zinc-700 resize-none" 
                        placeholder="Describe your issue or question..." 
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gold-400 text-black font-bold p-4 rounded-lg uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-400/20 flex items-center justify-center gap-2"
                >
                    <Send size={18}/> Submit Ticket
                </button>
            </form>
          )}

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
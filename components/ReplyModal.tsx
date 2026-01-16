
import React, { useState } from 'react';
import { X, Send, MessageSquare, Mail } from 'lucide-react';
import { SupportTicket } from '../types';
import { replyToTicket } from '../firebase';

interface Props {
  ticket: SupportTicket;
  onClose: () => void;
  onRefresh: () => void;
}

export const ReplyModal: React.FC<Props> = ({ ticket, onClose, onRefresh }) => {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        // 1. Save reply to database and close ticket
        await replyToTicket(ticket.id, reply);
        
        // 2. Open default email client to actually send the message to the user
        const subject = encodeURIComponent(`Re: Support Ticket - ${ticket.category} (GPHS Directory)`);
        const body = encodeURIComponent(`Hi ${ticket.name},\n\n${reply}\n\n---\nOriginal Message:\n${ticket.message}`);
        
        // Use window.location.href or window.open for mailto
        window.location.href = `mailto:${ticket.email}?subject=${subject}&body=${body}`;

        onRefresh();
        onClose();
    } catch (err) {
        console.error(err);
        alert("Failed to update ticket system. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
       <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-gold-500/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950">
            <div>
                <h2 className="font-display text-2xl text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={24} className="text-gold-400"/> Reply to Ticket
                </h2>
                <p className="text-zinc-500 text-xs">Replying to: <span className="text-white">{ticket.email}</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} className="text-zinc-500 hover:text-white"/></button>
          </div>
          
          <div className="p-6 bg-zinc-900/50 border-b border-white/5">
             <p className="text-zinc-400 text-sm italic mb-1">User Message:</p>
             <div className="bg-zinc-950 p-4 rounded-lg border border-white/10 text-zinc-300 text-sm max-h-32 overflow-y-auto custom-scrollbar">
                "{ticket.message}"
             </div>
          </div>

          <form onSubmit={handleSend} className="p-6 space-y-4">
             <div className="space-y-2">
               <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Your Reply</label>
               <textarea 
                  required
                  rows={6}
                  value={reply} 
                  onChange={e => setReply(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-400 focus:outline-none transition placeholder-zinc-700 resize-none" 
                  placeholder="Type your response here..." 
               />
               <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <Mail size={12}/> This will open your default email client to send the response.
               </p>
             </div>

             <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded text-zinc-400 hover:text-white transition text-sm font-bold uppercase">Cancel</button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gold-400 text-black font-bold px-6 py-2 rounded-lg uppercase tracking-widest hover:bg-white transition disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? 'Processing...' : <><Send size={16}/> Send & Close</>}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
};

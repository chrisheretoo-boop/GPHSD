import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface Props {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

export const PolicyModal: React.FC<Props> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
       <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-gold-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950">
            <h2 className="font-display text-2xl text-white uppercase tracking-wider flex items-center gap-2">
                {type === 'privacy' ? <Shield size={24} className="text-gold-400"/> : <FileText size={24} className="text-gold-400"/>}
                {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} className="text-zinc-500 hover:text-white"/></button>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar text-zinc-300 text-sm leading-relaxed space-y-4">
            {type === 'privacy' ? (
                <>
                    <p><strong>Last Updated: October 2025</strong></p>
                    <p>At GPHS Directory, we respect your privacy and are committed to protecting the personal information you share with us. This policy outlines how we collect, use, and safeguard your data.</p>
                    
                    <h3 className="text-white font-bold text-lg mt-4">1. Information We Collect</h3>
                    <p>We collect information you provide directly to us when registering a business, such as your name, email address, business details, and images. We do not store payment information; all transactions are processed securely via Stripe.</p>

                    <h3 className="text-white font-bold text-lg mt-4">2. How We Use Your Information</h3>
                    <p>Your public business information is displayed on the directory to facilitate connections with students and staff. We use your contact email to send important updates regarding your account or subscription status.</p>

                    <h3 className="text-white font-bold text-lg mt-4">3. Data Security</h3>
                    <p>We implement industry-standard security measures to protect your data. However, no transmission over the internet is completely secure, and we cannot guarantee absolute security.</p>
                    
                    <h3 className="text-white font-bold text-lg mt-4">4. Third-Party Services</h3>
                    <p>We use Firebase for data storage and authentication, and Stripe for payment processing. Please refer to their respective privacy policies for more information on how they handle data.</p>
                </>
            ) : (
                <>
                     <p><strong>Last Updated: October 2025</strong></p>
                     <p>By using the GPHS Directory, you agree to these Terms of Service. Please read them carefully.</p>

                     <h3 className="text-white font-bold text-lg mt-4">1. Acceptable Use</h3>
                     <p>All listings must adhere to Gwynn Park High School guidelines. We strictly prohibit the sale of illegal items, weapons, drugs, or inappropriate content. Admins reserve the right to remove any listing without notice.</p>

                     <h3 className="text-white font-bold text-lg mt-4">2. Subscriptions & Payments</h3>
                     <p>Business listings require a weekly subscription fee of $1.00. Failure to renew will result in the temporary removal of your listing from the public directory. All payments are non-refundable.</p>

                     <h3 className="text-white font-bold text-lg mt-4">3. Student Integrity</h3>
                     <p>This platform is intended for student-run businesses. Misrepresentation of ownership or fraudulent activity will result in a permanent ban.</p>
                     
                     <h3 className="text-white font-bold text-lg mt-4">4. Limitation of Liability</h3>
                     <p>GPHS Directory provides this platform "as is". We are not responsible for the quality of goods or services sold by student businesses listed on this site.</p>
                </>
            )}
          </div>
          <div className="p-4 border-t border-white/10 bg-zinc-950 flex justify-end">
              <button onClick={onClose} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-bold uppercase text-sm transition">Close</button>
          </div>
       </div>
    </div>
  );
};
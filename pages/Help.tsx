import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Help: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'Citizen' | 'Official' | 'Security'>('Citizen');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setTicketSuccess(true);
    // Reset form after 3 seconds and close modal
    setTimeout(() => {
      setShowTicketModal(false);
      setTicketSuccess(false);
      setTicketForm({ subject: '', category: 'General Inquiry', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">
      {/* Support Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => !isSubmitting && setShowTicketModal(false)}></div>
          <div className="relative bg-slate-900 w-full max-w-2xl rounded-[4rem] shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            {!ticketSuccess ? (
              <div className="p-12">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-4xl font-black text-white tracking-tighter">Open Support Ticket</h3>
                    <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Official Assistance Request</p>
                  </div>
                  <button 
                    onClick={() => setShowTicketModal(false)}
                    disabled={isSubmitting}
                    className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-500 transition-all disabled:opacity-50"
                  >
                    <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
                </div>

                <form onSubmit={handleTicketSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Subject</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Payment Issue, License Renewal Error"
                      value={ticketForm.subject}
                      onChange={e => setTicketForm({...ticketForm, subject: e.target.value})}
                      className="w-full px-8 py-5 rounded-[2rem] bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 transition-all font-bold text-white outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Category</label>
                    <select 
                      required
                      value={ticketForm.category}
                      onChange={e => setTicketForm({...ticketForm, category: e.target.value})}
                      className="w-full px-8 py-5 rounded-[2rem] bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 transition-all font-bold text-white outline-none appearance-none"
                    >
                      <option>General Inquiry</option>
                      <option>Technical Support</option>
                      <option>Billing & Payments</option>
                      <option>License Verification</option>
                      <option>Account Security</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Message</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Describe your issue in detail..."
                      value={ticketForm.message}
                      onChange={e => setTicketForm({...ticketForm, message: e.target.value})}
                      className="w-full px-8 py-5 rounded-[2.5rem] bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 transition-all font-bold text-white outline-none resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-700 transition shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        Submitting Ticket...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        Submit Ticket
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-20 text-center animate-in zoom-in-95 duration-500">
                <div className="w-32 h-32 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-10 text-5xl shadow-2xl shadow-emerald-600/40">
                  <i className="fa-solid fa-check-double"></i>
                </div>
                <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">Ticket Submitted</h3>
                <p className="text-slate-400 font-bold text-lg leading-relaxed">
                  Your support request has been logged. <br />
                  Reference ID: <span className="text-emerald-500">#SLRSA-{Math.floor(100000 + Math.random() * 900000)}</span>
                </p>
                <p className="text-slate-500 font-medium mt-8 italic">Closing window...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="bg-slate-900 text-white py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-7xl font-black tracking-tighter mb-8 leading-none">Help Center</h1>
          <p className="text-xl text-slate-400 font-medium mb-12">Search our knowledge base or select a portal below to find answers to common questions.</p>
          
          <div className="relative max-w-2xl mx-auto group">
            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-emerald-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder="How can we help you today?" 
              className="w-full pl-16 pr-8 py-6 rounded-3xl bg-slate-800 border-2 border-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:text-slate-900 transition-all font-bold text-xl text-white"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Portal Selection */}
        <div className="flex flex-col md:flex-row gap-8 mb-24">
          <HelpPortal 
            active={activeCategory === 'Citizen'} 
            onClick={() => setActiveCategory('Citizen')}
            icon="fa-user" 
            label="Citizen Portal" 
            desc="Vehicle owners, payments, and digital IDs."
          />
          <HelpPortal 
            active={activeCategory === 'Official'} 
            onClick={() => setActiveCategory('Official')}
            icon="fa-building-columns" 
            label="Department Portal" 
            desc="Staff access, audits, and record management."
          />
          <HelpPortal 
            active={activeCategory === 'Security'} 
            onClick={() => setActiveCategory('Security')}
            icon="fa-shield-halved" 
            label="Enforcement Portal" 
            desc="Roadside verification and ticket issuance."
          />
        </div>

        {/* FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-5xl font-black text-white tracking-tighter mb-12">Frequently Asked Questions</h2>
            
            {activeCategory === 'Citizen' && (
              <div className="space-y-6">
                <FAQItem question="How do I register a new vehicle?" answer="Log in to your Citizen Dashboard and click 'New Registration'. You will need your VIN, owner details, and a mobile payment method (AfriMoney or Orange Money)." />
                <FAQItem question="Where can I find my digital license?" answer="Once registered and verified, your license details appear on your main dashboard. This acts as your official digital ID for SLRSA verification." />
                <FAQItem question="My payment was successful but my status is still 'Expired'?" answer="In some cases, the department needs up to 24 hours to manually verify document uploads. Please check the 'Department Portal' status in your history." />
              </div>
            )}

            {activeCategory === 'Official' && (
              <div className="space-y-6">
                <FAQItem question="How do I access the Finance Ledger?" answer="Only users with the Finance Department password (SLRSA003) can access auditing tools. Use the 'Sign In' portal to switch roles." />
                <FAQItem question="Can I edit a VIN after it's been registered?" answer="No. For security and integrity (IOS 26), VINs are unique identifiers. To correct a VIN error, the record must be purged by an Admin." />
              </div>
            )}

            {activeCategory === 'Security' && (
              <div className="space-y-6">
                <FAQItem question="The scanner won't recognize a plate number?" answer="Ensure the camera has direct light. You can also manually type the Plate Number or VIN into the Enforcement Hub search bar." />
                <FAQItem question="Are citations issued in the app legally binding?" answer="Yes. All digital tickets are synchronized with the National Revenue Registry and SLRSA legal database immediately upon issuance." />
              </div>
            )}
          </div>

          {/* Support Contacts */}
          <div className="space-y-12">
            <div className="bg-slate-900 p-12 rounded-[4rem] shadow-2xl border border-slate-800">
              <h3 className="text-3xl font-black text-white mb-8 tracking-tight">Need Support?</h3>
              <div className="space-y-10">
                <ContactInfo icon="fa-envelope" label="Email Helpdesk" value="info@slrsa.gov.sl" />
                <ContactInfo icon="fa-phone" label="Toll Free" value="+232 77714177" />
                <ContactInfo icon="fa-location-dot" label="Main Office" value="Kissy Road, Freetown Sierra Leone" />
              </div>
              
              <div className="mt-12 pt-10 border-t border-slate-800 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 italic">Support available 24/7 for field officers.</p>
                <button 
                  onClick={() => setShowTicketModal(true)}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 active:scale-95"
                >
                  Open Support Ticket
                </button>
              </div>
            </div>
            
            <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
              <i className="fa-solid fa-headset absolute -right-4 -bottom-4 text-9xl opacity-10"></i>
              <h4 className="text-xl font-black mb-4 relative z-10 tracking-tight">System Status</h4>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
                <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">All Nodes Operational</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32 text-center">
           <Link to="/" className="inline-flex items-center gap-3 bg-white text-slate-900 px-12 py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 hover:text-white transition shadow-2xl group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

const HelpPortal: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string, desc: string }> = ({ active, onClick, icon, label, desc }) => (
  <button 
    onClick={onClick}
    className={`flex-1 text-left p-10 rounded-[3.5rem] border-2 transition-all duration-500 group ${active ? 'bg-slate-900 border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl mb-6 transition-all ${active ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h3 className={`text-2xl font-black mb-2 tracking-tight ${active ? 'text-white' : 'text-slate-300'}`}>{label}</h3>
    <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
  </button>
);

const FAQItem: React.FC<{ question: string, answer: string }> = ({ question, answer }) => (
  <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-xl group hover:border-emerald-500/50 transition-colors">
    <h4 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:text-emerald-400 transition-colors">{question}</h4>
    <p className="text-lg text-slate-400 font-medium leading-relaxed">{answer}</p>
  </div>
);

const ContactInfo: React.FC<{ icon: string, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-6">
    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  </div>
);

export default Help;
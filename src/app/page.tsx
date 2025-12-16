'use client';

import { useState, useEffect } from 'react';

/* ===========================================
   HIREINBOX - PRODUCTION BUILD
   Landing Page + Dashboard
   =========================================== */

interface Reference {
  name: string | null;
  title: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null;
}

interface Candidate {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  score: number | null;
  status: string;
  ai_reasoning: string | null;
  strengths: string[] | null;
  missing: string[] | null;
  cv_text: string | null;
  created_at: string;
  current_role: string | null;
  experience_years: number | null;
  location: string | null;
  education: string | null;
  references: Reference[] | null;
}

interface Role {
  id: string;
  title: string;
  status: string;
  criteria: {
    min_experience_years: number;
    required_skills: string[];
    preferred_skills: string[];
    locations: string[];
  };
}

const Logo = ({ size = 36, showText = true, onClick }: { size?: number; showText?: boolean; onClick?: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {showText && (
      <span style={{ fontSize: size > 30 ? '1.25rem' : '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
    )}
  </div>
);

export default function Home() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

  return view === 'dashboard' 
    ? <Dashboard onLogout={() => setView('landing')} />
    : <LandingPage onLogin={() => setView('dashboard')} />;
}

/* ===========================================
   LANDING PAGE
   =========================================== */
function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{ 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
      background: '#ffffff', 
      color: '#0f172a', 
      lineHeight: 1.6,
      minHeight: '100vh'
    }}>
      {/* NAV */}
      <nav style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100, 
        background: 'rgba(255,255,255,0.97)', 
        backdropFilter: 'blur(12px)', 
        borderBottom: '1px solid #f1f5f9' 
      }}>
        <div style={{ 
          maxWidth: 1120, 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          height: 64, 
          padding: '0 20px' 
        }}>
          <div>
            <Logo size={28} />
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 500, marginTop: 2, marginLeft: 38 }}>Less noise. Better hires.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onLogin} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', padding: '8px 16px' }}>Log in</button>
            <button onClick={onLogin} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Start free</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '120px 20px 60px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16, color: '#0f172a' }}>
            You got 47 CVs.<br />3 are worth calling.
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.6 }}>
            AI screens every CV and explains who&apos;s qualified.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <button onClick={onLogin} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '16px 32px', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Try it free</button>
            <button onClick={onLogin} style={{ background: 'white', color: '#0f172a', border: '2px solid #e2e8f0', padding: '16px 32px', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>See it in action</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Free for your first role · POPIA compliant</p>
        </div>

        {/* Hero Visual */}
        <div style={{ marginTop: 64, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}></div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }}></div>
            <span style={{ marginLeft: 12, fontSize: '0.85rem', color: '#64748b' }}>yourcompany@hireinbox.co.za</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'white', borderRadius: 12, border: '2px solid #dcfce7' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>TM</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>Thabo Molefe</div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Senior Developer · 4 years · Johannesburg</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534' }}>92/100</div>
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>Meets all criteria</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eef2ff', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>LN</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>Lerato Nkosi</div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Product Manager · 5 years · Cape Town</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4F46E5' }}>78/100</div>
                <div style={{ fontSize: '0.8rem', color: '#4F46E5', fontWeight: 600 }}>Strong, wrong role</div>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>+ 44 more screened automatically</div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ padding: '40px 20px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>~90%</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>CVs filtered out</div>
          </div>
          <div style={{ width: 1, height: 40, background: '#e2e8f0' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Minutes</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Not hours to review</div>
          </div>
          <div style={{ width: 1, height: 40, background: '#e2e8f0' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Auto</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Acknowledgment sent</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 20px', maxWidth: 1120, margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>Set up in 5 minutes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          {[
            { num: '1', title: 'Forward your job inbox', desc: 'Works with Gmail, Outlook, any email.' },
            { num: '2', title: 'Tell us what you need', desc: 'Experience, skills, location. Plain English.' },
            { num: '3', title: 'Call your shortlist', desc: 'Every CV scored. Every decision explained.' }
          ].map(step => (
            <div key={step.num} style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#eef2ff', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, margin: '0 auto 16px' }}>{step.num}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: '1rem', color: '#64748b' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 20px', background: '#0f172a' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 12 }}>Built for how SMEs actually hire</h2>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', textAlign: 'center', marginBottom: 48 }}>No new software to learn. Just clarity.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: '📋', title: 'Plain-English reasoning', desc: '"4 years React, based in JHB, missing AWS" — not just a number.' },
              { icon: '🎯', title: 'Wrong-role detection', desc: 'We save mismatched candidates for future roles.' },
              { icon: '🧠', title: 'Talent memory', desc: 'Every CV indexed. Find them when you need them.' }
            ].map(f => (
              <div key={f.title} style={{ background: '#1e293b', borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '80px 20px', maxWidth: 1120, margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Costs less than one bad interview</h2>
        <p style={{ fontSize: '1.1rem', color: '#64748b', textAlign: 'center', marginBottom: 48 }}>Free to try. Cancel anytime.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 960, margin: '0 auto' }}>
          {[
            { name: 'Starter', desc: 'Hiring 1-2x a year', price: 'R399', features: ['20 CVs/month', '1 active role'], popular: false },
            { name: 'Growth', desc: 'Regular hiring', price: 'R799', features: ['50 CVs/month', '3 roles + Pool'], popular: true },
            { name: 'Business', desc: 'Always hiring', price: 'R1,499', features: ['100 CVs/month', 'Unlimited + Team'], popular: false }
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.popular ? '#0f172a' : 'white', border: plan.popular ? 'none' : '2px solid #e2e8f0', borderRadius: 16, padding: 28, position: 'relative' }}>
              {plan.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#4F46E5', color: 'white', padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>POPULAR</div>}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: plan.popular ? 'white' : '#0f172a', marginBottom: 4 }}>{plan.name}</h3>
              <p style={{ fontSize: '0.9rem', color: plan.popular ? '#94a3b8' : '#64748b', marginBottom: 16 }}>{plan.desc}</p>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: plan.popular ? 'white' : '#0f172a' }}>{plan.price}</span>
                <span style={{ fontSize: '1rem', color: plan.popular ? '#94a3b8' : '#64748b' }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '1rem', color: plan.popular ? '#e2e8f0' : '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#22c55e' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={onLogin} style={{ width: '100%', padding: '14px', background: plan.popular ? 'white' : '#0f172a', color: plan.popular ? '#0f172a' : 'white', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Try free</button>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>Your next hire is already in your inbox.</h2>
          <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: 32 }}>Let&apos;s find them together.</p>
          <button onClick={onLogin} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '16px 48px', borderRadius: 10, fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer' }}>Try HireInbox free</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 20px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <Logo size={24} />
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4, marginLeft: 34 }}>Less noise. Better hires.</div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Terms</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>POPIA</a>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>© 2025 HireInbox 🇿🇦</div>
        </div>
      </footer>
    </div>
  );
}

/* ===========================================
   DASHBOARD
   =========================================== */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [cvText, setCvText] = useState('');
  const [isScreening, setIsScreening] = useState(false);

  useEffect(() => { fetchRoles(); fetchCandidates(); }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) { 
        const d = await res.json(); 
        setRoles(d.roles || []); 
        if (d.roles?.length > 0 && !selectedRole) setSelectedRole(d.roles[0].id); 
      }
    } catch (e) { console.error(e); }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) { const d = await res.json(); setCandidates(d.candidates || []); }
    } catch (e) { console.error(e); }
  };

  const handleFetchEmails = async () => {
    setIsFetchingEmails(true);
    try {
      const res = await fetch('/api/fetch-emails', { method: 'POST' });
      const d = await res.json();
      if (res.ok) { 
        fetchCandidates(); 
        alert(`✓ Processed ${d.processed || 0} CV(s)`);
      } else {
        alert(`Error: ${d.error || 'Failed'}`);
      }
    } catch (e) { 
      console.error(e); 
      alert('Connection failed'); 
    }
    setIsFetchingEmails(false);
  };

  const handleScreenCV = async () => {
    if (!cvText.trim() || !selectedRole) return;
    setIsScreening(true);
    try {
      const res = await fetch('/api/screen', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cvText, roleId: selectedRole }) 
      });
      if (res.ok) { fetchCandidates(); setCvText(''); alert('✓ CV screened'); }
    } catch (e) { console.error(e); alert('Screening failed'); }
    setIsScreening(false);
  };

  const filteredCandidates = candidates.filter(c => activeTab === 'all' || c.status === activeTab);
  const getInitials = (n: string | null) => n ? n.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase() : '??';
  const getTimeAgo = (d: string) => { 
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); 
    if (s < 60) return 'Just now'; 
    if (s < 3600) return `${Math.floor(s/60)}m ago`; 
    if (s < 86400) return `${Math.floor(s/3600)}h ago`; 
    return `${Math.floor(s/86400)}d ago`; 
  };
  const formatWhatsApp = (p: string) => p.replace(/[^0-9]/g, '').replace(/^0/, '27');

  const currentRole = roles.find(r => r.id === selectedRole);
  const shortlistCount = candidates.filter(c => c.status === 'shortlist').length;
  const poolCount = candidates.filter(c => c.status === 'talent_pool').length;
  const rejectCount = candidates.filter(c => c.status === 'reject').length;

  const statusColors: Record<string, { bg: string; text: string }> = {
    shortlist: { bg: '#dcfce7', text: '#166534' },
    talent_pool: { bg: '#eef2ff', text: '#4F46E5' },
    reject: { bg: '#fee2e2', text: '#991b1b' }
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: 260, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: 20, borderBottom: '1px solid #e2e8f0' }}>
          <Logo size={32} onClick={onLogout} />
        </div>
        
        <nav style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Overview</div>
            <SidebarItem icon="📊" label="Dashboard" active onClick={() => setActiveTab('all')} />
            <SidebarItem icon="📧" label="Check Inbox" onClick={handleFetchEmails} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Candidates</div>
            <SidebarItem icon="✓" label="Shortlisted" badge={shortlistCount} active={activeTab === 'shortlist'} onClick={() => setActiveTab('shortlist')} />
            <SidebarItem icon="🧠" label="Talent Pool" badge={poolCount} active={activeTab === 'talent_pool'} onClick={() => setActiveTab('talent_pool')} />
            <SidebarItem icon="✗" label="Rejected" active={activeTab === 'reject'} onClick={() => setActiveTab('reject')} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Roles</div>
            {roles.map(r => (
              <SidebarItem key={r.id} icon="💼" label={r.title} active={selectedRole === r.id} onClick={() => setSelectedRole(r.id)} />
            ))}
            <SidebarItem icon="+" label="Add New Role" color="#4F46E5" onClick={() => setShowNewRoleModal(true)} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Settings</div>
            <SidebarItem icon="⚙️" label="Company Settings" onClick={() => alert('Coming soon')} />
            <SidebarItem icon="👥" label="Team" onClick={() => alert('Coming soon')} />
            <SidebarItem icon="💳" label="Billing" onClick={() => alert('Coming soon')} />
          </div>
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: '#f8fafc' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>SM</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Simon M.</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>simon@acme.co.za</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: '100%', marginTop: 12, padding: 10, background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', color: '#64748b', cursor: 'pointer' }}>← Back to Home</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: 260 }}>
        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleFetchEmails} disabled={isFetchingEmails} style={{ padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
              {isFetchingEmails ? '⏳ Checking...' : '📧 Check Emails'}
            </button>
            <button onClick={() => setShowNewRoleModal(true)} style={{ padding: '10px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
              + New Role
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: 32 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            <StatCard icon="📧" value={candidates.length.toString()} label="CVs this month" />
            <StatCard icon="✓" value={shortlistCount.toString()} label="Shortlisted" />
            <StatCard icon="🧠" value={poolCount.toString()} label="In Talent Pool" />
            <StatCard icon="⏱️" value={`${(candidates.length * 4.5 / 60).toFixed(1)}h`} label="Time saved" extra={`≈ R${(candidates.length * 200).toLocaleString()} in admin costs`} />
          </div>

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
            {/* Candidate List */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {[
                  { id: 'all', label: 'All', count: candidates.length },
                  { id: 'shortlist', label: 'Shortlisted', count: shortlistCount },
                  { id: 'talent_pool', label: 'Talent Pool', count: poolCount },
                  { id: 'reject', label: 'Rejected', count: rejectCount },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ 
                    padding: '14px 20px', 
                    fontSize: '0.95rem', 
                    fontWeight: 600, 
                    color: activeTab === tab.id ? '#4F46E5' : '#64748b', 
                    background: activeTab === tab.id ? 'white' : 'transparent', 
                    border: 'none', 
                    borderBottom: `2px solid ${activeTab === tab.id ? '#4F46E5' : 'transparent'}`, 
                    cursor: 'pointer' 
                  }}>
                    {tab.label} <span style={{ marginLeft: 6, padding: '2px 8px', background: activeTab === tab.id ? '#eef2ff' : '#f1f5f9', borderRadius: 100, fontSize: '0.8rem' }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#ecfdf5', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, color: '#059669', marginBottom: 20 }}>
                  <span style={{ width: 8, height: 8, background: '#059669', borderRadius: '50%' }}></span>
                  Live — updates as CVs arrive
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredCandidates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                      <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>No candidates yet</div>
                      <div style={{ color: '#64748b' }}>Click &quot;Check Emails&quot; to fetch new CVs</div>
                    </div>
                  ) : filteredCandidates.map(c => {
                    const colors = statusColors[c.status] || statusColors.reject;
                    return (
                      <div key={c.id} onClick={() => setSelectedCandidate(c)} style={{ 
                        background: 'white', 
                        borderRadius: 12, 
                        border: '1px solid #e2e8f0', 
                        padding: 16, 
                        cursor: 'pointer',
                        opacity: c.status === 'reject' ? 0.7 : 1
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{getInitials(c.name)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{c.name || 'Unknown'}</span>
                              {c.score && <span style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text, background: colors.bg, padding: '2px 8px', borderRadius: 6 }}>{c.score}/100</span>}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ai_reasoning || 'Processing...'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, background: colors.bg, color: colors.text }}>
                                {c.status === 'shortlist' ? '✓ Shortlisted' : c.status === 'talent_pool' ? '→ Pool' : '✗ Rejected'}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{getTimeAgo(c.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        {c.status === 'shortlist' && c.phone && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                            <a href={`https://wa.me/${formatWhatsApp(c.phone)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ flex: 1, padding: 10, background: '#25D366', color: 'white', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>💬 WhatsApp</a>
                            <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: 10, background: '#4F46E5', color: 'white', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>📞 Call</a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Active Role */}
              {currentRole && (
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>{currentRole.title}</h3>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#ecfdf5', color: '#059669', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600, marginBottom: 16 }}>
                    <span style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%' }}></span>
                    ACTIVE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#166534' }}>{shortlistCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SHORTLISTED</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4F46E5' }}>{poolCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>POOLED</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#64748b' }}>{rejectCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>REJECTED</div>
                    </div>
                  </div>
                  {currentRole.criteria && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8 }}>REQUIREMENTS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ padding: '6px 12px', background: '#eef2ff', color: '#4F46E5', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500 }}>{currentRole.criteria.min_experience_years}+ years</span>
                        {currentRole.criteria.required_skills?.map((s, i) => (
                          <span key={i} style={{ padding: '6px 12px', background: '#eef2ff', color: '#4F46E5', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ flex: 1, padding: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Edit Criteria</button>
                    <button style={{ flex: 1, padding: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Pause</button>
                  </div>
                </div>
              )}

              {/* Screen a CV */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Screen a CV</h3>
                <textarea
                  value={cvText}
                  onChange={e => setCvText(e.target.value)}
                  placeholder="Paste CV text here..."
                  style={{ width: '100%', height: 120, padding: 14, border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', resize: 'none', fontFamily: 'inherit', marginBottom: 12 }}
                />
                <button onClick={handleScreenCV} disabled={isScreening || !cvText.trim()} style={{ width: '100%', padding: 14, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: isScreening || !cvText.trim() ? 0.5 : 1 }}>
                  {isScreening ? '⏳ Screening...' : 'Screen CV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Candidate Modal */}
      {selectedCandidate && (
        <div onClick={() => setSelectedCandidate(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: (statusColors[selectedCandidate.status] || statusColors.reject).bg, color: (statusColors[selectedCandidate.status] || statusColors.reject).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem' }}>{getInitials(selectedCandidate.name)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{selectedCandidate.name}</div>
                    <div style={{ color: '#64748b' }}>{selectedCandidate.email}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidate(null)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 24, padding: 20, background: '#f8fafc', borderRadius: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 800, color: (statusColors[selectedCandidate.status] || statusColors.reject).text }}>{selectedCandidate.score || '--'}</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Score</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 8, background: (statusColors[selectedCandidate.status] || statusColors.reject).bg, color: (statusColors[selectedCandidate.status] || statusColors.reject).text, fontWeight: 700, marginBottom: 8 }}>
                    {selectedCandidate.status === 'shortlist' ? '✓ Shortlisted' : selectedCandidate.status === 'talent_pool' ? '→ Talent Pool' : '✗ Rejected'}
                  </div>
                  <div style={{ color: '#475569', lineHeight: 1.6 }}>{selectedCandidate.ai_reasoning}</div>
                </div>
              </div>
              
              {selectedCandidate.phone && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <a href={`https://wa.me/${formatWhatsApp(selectedCandidate.phone)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: 14, background: '#25D366', color: 'white', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}>💬 WhatsApp</a>
                  <a href={`tel:${selectedCandidate.phone}`} style={{ flex: 1, padding: 14, background: '#4F46E5', color: 'white', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}>📞 Call</a>
                  <a href={`mailto:${selectedCandidate.email}`} style={{ flex: 1, padding: 14, background: '#f97316', color: 'white', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}>📧 Email</a>
                </div>
              )}

              {selectedCandidate.strengths && selectedCandidate.strengths.length > 0 && (
                <div style={{ background: '#ecfdf5', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: 10 }}>✓ Strengths</div>
                  <ul style={{ paddingLeft: 20, margin: 0, color: '#166534' }}>
                    {selectedCandidate.strengths.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                  </ul>
                </div>
              )}

              {selectedCandidate.missing && selectedCandidate.missing.length > 0 && (
                <div style={{ background: '#fffbeb', borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: '#d97706', marginBottom: 10 }}>⚠ Gaps</div>
                  <ul style={{ paddingLeft: 20, margin: 0, color: '#d97706' }}>
                    {selectedCandidate.missing.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Role Modal */}
      {showNewRoleModal && (
        <NewRoleModal onClose={() => setShowNewRoleModal(false)} onCreated={() => { fetchRoles(); setShowNewRoleModal(false); }} />
      )}
    </div>
  );
}

function SidebarItem({ icon, label, badge, active, color, onClick }: { icon: string; label: string; badge?: number; active?: boolean; color?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 12, 
      padding: '12px 14px', 
      borderRadius: 10, 
      color: color || (active ? '#4F46E5' : '#475569'), 
      background: active ? '#eef2ff' : 'transparent', 
      border: 'none', 
      width: '100%', 
      textAlign: 'left', 
      fontSize: '0.95rem', 
      fontWeight: 500, 
      cursor: 'pointer',
      marginBottom: 4
    }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && <span style={{ background: '#4F46E5', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{badge}</span>}
    </button>
  );
}

function StatCard({ icon, value, label, extra }: { icon: string; value: string; label: string; extra?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: '0.95rem', color: '#64748b' }}>{label}</div>
      {extra && <div style={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 600, marginTop: 4 }}>{extra}</div>}
    </div>
  );
}

function NewRoleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [minExp, setMinExp] = useState(2);
  const [skills, setSkills] = useState('');
  const [locations, setLocations] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          criteria: {
            min_experience_years: minExp,
            required_skills: skills.split(',').map(s => s.trim()).filter(Boolean),
            preferred_skills: [],
            locations: locations.split(',').map(s => s.trim()).filter(Boolean),
          }
        })
      });
      if (res.ok) onCreated();
      else alert('Failed to create role');
    } catch (e) { console.error(e); alert('Failed to create role'); }
    setIsCreating(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 500, overflow: 'hidden' }}>
        <div style={{ padding: 28, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>Create New Role</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>Define your ideal candidate</p>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Role Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Developer" style={{ width: '100%', padding: 14, border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Min. Experience</label>
            <select value={minExp} onChange={e => setMinExp(parseInt(e.target.value))} style={{ width: '100%', padding: 14, border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem', background: 'white' }}>
              <option value={0}>No minimum</option>
              <option value={1}>1+ years</option>
              <option value={2}>2+ years</option>
              <option value={3}>3+ years</option>
              <option value={5}>5+ years</option>
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Required Skills</label>
            <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, TypeScript, Node.js" style={{ width: '100%', padding: 14, border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem' }} />
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>Separate with commas</div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Locations</label>
            <input type="text" value={locations} onChange={e => setLocations(e.target.value)} placeholder="e.g. Johannesburg, Remote" style={{ width: '100%', padding: 14, border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 14, background: 'white', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreate} disabled={isCreating || !title} style={{ flex: 1, padding: 14, background: '#059669', color: 'white', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: isCreating || !title ? 0.5 : 1 }}>
              {isCreating ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

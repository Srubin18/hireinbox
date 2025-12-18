'use client';

import { useState, useEffect } from 'react';

/* ===========================================
   HIREINBOX - WORLD CLASS UI
   All 3 fixes applied:
   1. DetailRow shows "Not specified" for missing location
   2. Max 2 highlights locked with comment
   3. Conservative tone rule in prompt (backend)
   =========================================== */

// Types
interface EvidenceHighlight {
  claim: string;
  evidence: string;
}

interface RiskItem {
  risk: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: string;
  interview_question: string;
}

interface Confidence {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
}

interface AltRoleSuggestion {
  role: string;
  why: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface StrengthItem {
  label: string;
  evidence: string;
}

interface WeaknessItem {
  label: string;
  evidence: string;
}

interface HardRequirements {
  met: string[];
  not_met: string[];
  partial: string[];
  unclear: string[];
}

interface ScreeningResult {
  overall_score: number;
  recommendation: string;
  recommendation_reason: string;
  confidence?: Confidence;
  evidence_highlights?: EvidenceHighlight[];
  risk_register?: RiskItem[];
  hard_requirements?: HardRequirements;
  interview_focus?: string[];
  alt_role_suggestions?: AltRoleSuggestion[];
  location_summary?: string;
  work_mode?: string;
  current_title?: string;
  current_company?: string;
  years_experience?: number;
  summary?: {
    strengths?: StrengthItem[] | string[];
    weaknesses?: WeaknessItem[] | string[];
    fit_assessment?: string;
  };
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
  location: string | null;
  screening_result?: ScreeningResult;
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

// Brand Logo
const Logo = ({ size = 36, showText = true, darkBg = false }: { size?: number; showText?: boolean; darkBg?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {showText && (
      <span style={{ fontSize: size > 30 ? '1.25rem' : '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
        <span style={{ color: darkBg ? 'white' : '#0f172a' }}>Hire</span>
        <span style={{ color: darkBg ? '#A5B4FC' : '#4F46E5' }}>Inbox</span>
      </span>
    )}
  </div>
);

export default function Home() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('dashboard') || window.location.pathname.includes('dashboard')) {
        setView('dashboard');
      }
    }
  }, []);

  if (view === 'dashboard') {
    return <Dashboard onLogout={() => setView('landing')} />;
  }

  return <LandingPage onLogin={() => setView('dashboard')} />;
}

/* ===========================================
   LANDING PAGE - WORLD-CLASS SAAS DESIGN
   =========================================== */
function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: '#ffffff', color: '#0f172a', lineHeight: 1.6, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { overflow-x: hidden; }
        
        /* Mobile First */
        .nav-links { display: none !important; }
        .nav-cta-desktop { display: none !important; }
        .nav-cta-mobile { display: flex !important; }
        .hero-buttons { flex-direction: column !important; width: 100% !important; }
        .hero-buttons button { width: 100% !important; }
        .hero-visual { display: none !important; }
        .stats-row { flex-direction: column !important; gap: 20px !important; }
        .stats-divider { display: none !important; }
        .how-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        .features-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        .pricing-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        .candidates-checks { flex-direction: column !important; align-items: center !important; gap: 10px !important; }
        .footer-inner { flex-direction: column !important; gap: 20px !important; text-align: center !important; }
        .footer-links { justify-content: center !important; }
        
        /* Desktop */
        @media (min-width: 768px) {
          .nav-links { display: flex !important; }
          .nav-cta-desktop { display: flex !important; }
          .nav-cta-mobile { display: none !important; }
          .hero-buttons { flex-direction: row !important; width: auto !important; }
          .hero-buttons button { width: auto !important; }
          .hero-visual { display: block !important; }
          .stats-row { flex-direction: row !important; gap: 64px !important; }
          .stats-divider { display: block !important; }
          .how-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 24px !important; }
          .features-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 24px !important; }
          .pricing-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 24px !important; }
          .candidates-checks { flex-direction: row !important; gap: 24px !important; }
          .footer-inner { flex-direction: row !important; text-align: left !important; }
          .footer-links { justify-content: flex-start !important; }
        }
      `}</style>

      {/* NAVIGATION */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64, padding: '0 16px' }}>
          <div style={{ flexShrink: 0 }}>
            <Logo size={28} />
            <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 500, marginTop: 1, marginLeft: 38 }}>Less noise. Better hires.</div>
          </div>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#how" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>How it works</a>
            <a href="#pricing" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>Pricing</a>
            <a href="#candidates" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>For candidates</a>
          </div>
          <div className="nav-cta-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onLogin} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', padding: '8px 14px' }}>Log in</button>
            <button onClick={onLogin} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Start free</button>
          </div>
          <div className="nav-cta-mobile" style={{ flexShrink: 0 }}>
            <button onClick={onLogin} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Try free</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '84px 16px 40px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 7vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 12, color: '#0f172a' }}>
            You got 47 CVs.<br />3 are worth calling.
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)', color: '#64748b', maxWidth: 560, margin: '0 auto 24px', lineHeight: 1.5, padding: '0 8px' }}>
            AI screens every CV and explains who's qualified.
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16, padding: '0 8px' }}>
            <button onClick={onLogin} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '14px 24px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>Try it free</button>
            <button onClick={onLogin} style={{ background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', padding: '14px 24px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>Watch demo</button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Free for your first role · POPIA compliant</p>
        </div>

        {/* Hero Visual - Desktop only */}
        <div className="hero-visual" style={{ marginTop: 64, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, maxWidth: 800, margin: '64px auto 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></div>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div>
            <span style={{ marginLeft: 12, fontSize: '0.8rem', color: '#64748b' }}>yourcompany@hireinbox.co.za</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'white', borderRadius: 10, border: '2px solid #dcfce7' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>TM</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>Thabo Molefe</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Senior Developer · 4 years · Johannesburg</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#166534' }}>92/100</div>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Meets all criteria</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2ff', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>LN</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>Lerato Nkosi</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Product Manager · 5 years · Cape Town</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4F46E5' }}>78/100</div>
                <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600 }}>Strong, wrong role</div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>+ 44 more screened automatically</div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ padding: '32px 16px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
        <div className="stats-row" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 64 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: '#0f172a' }}>6 from 50</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Average shortlist</div>
          </div>
          <div className="stats-divider" style={{ width: 1, height: 40, background: '#e2e8f0' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: '#0f172a' }}>2 min</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>To first decision</div>
          </div>
          <div className="stats-divider" style={{ width: 1, height: 40, background: '#e2e8f0' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: '#0f172a' }}>100%</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Candidates notified</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: '48px 16px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 800, color: '#0f172a' }}>Set up in 5 minutes</h2>
        </div>
        <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <div style={{ textAlign: 'center', padding: '20px 12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2ff', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, margin: '0 auto 12px' }}>1</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Forward your job inbox</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>Works with Gmail, Outlook, any email.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2ff', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, margin: '0 auto 12px' }}>2</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tell us what you need</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>Experience, skills, location. Plain English.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2ff', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, margin: '0 auto 12px' }}>3</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Call your shortlist</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>Every CV scored. Every decision explained.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '48px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 800, color: 'white', marginBottom: 8 }}>Built for how SMEs actually hire</h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: 500, margin: '0 auto' }}>No new software to learn. Just clarity.</p>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: '20px 16px' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: 10 }}>📋</div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>Plain-English reasoning</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>"4 years React, based in JHB, missing AWS" — not just a number.</p>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: '20px 16px' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: 10 }}>🎯</div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>Wrong-role detection</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>We save mismatched candidates for future roles.</p>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: '20px 16px' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: 10 }}>🧠</div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>Talent memory</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>Every CV indexed. Find them when you need them.</p>
            </div>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>You can override any decision. <span style={{ color: 'white', fontWeight: 600 }}>AI assists, you decide.</span></p>
          </div>
        </div>
      </section>

      {/* FOR CANDIDATES */}
      <section id="candidates" style={{ padding: '48px 16px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4F46E5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>For candidates</div>
          <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', fontWeight: 800, color: '#0f172a', marginBottom: 12, padding: '0 8px' }}>Every application reviewed. Every candidate informed.</h2>
          <p style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)', color: '#64748b', marginBottom: 24, lineHeight: 1.6, padding: '0 8px' }}>
            Candidates receive acknowledgement within minutes and outcome emails within days — not silence.
          </p>
          <div className="candidates-checks" style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#059669', fontSize: '1rem' }}>✓</span>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>Instant acknowledgement</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#059669', fontSize: '1rem' }}>✓</span>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>Clear outcomes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#059669', fontSize: '1rem' }}>✓</span>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>Data protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '48px 16px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Costs less than one bad interview</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Free to try. Cancel anytime.</p>
        </div>
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 960, margin: '0 auto' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Starter</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12 }}>Hiring 1-2x a year</p>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>R399</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/mo</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
              <li style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#059669' }}>✓</span> 20 CVs/month</li>
              <li style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#059669' }}>✓</span> 1 active role</li>
            </ul>
            <button onClick={onLogin} style={{ width: '100%', padding: '10px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Try free</button>
          </div>
          <div style={{ background: '#0f172a', border: '1px solid #0f172a', borderRadius: 12, padding: '20px 16px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#4F46E5', color: 'white', padding: '3px 8px', borderRadius: 100, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Popular</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Growth</h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 12 }}>Regular hiring</p>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>R799</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/mo</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
              <li style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#4ade80' }}>✓</span> 50 CVs/month</li>
              <li style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#4ade80' }}>✓</span> 3 roles + Pool</li>
            </ul>
            <button onClick={onLogin} style={{ width: '100%', padding: '10px', background: 'white', color: '#0f172a', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Try free</button>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Business</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12 }}>Always hiring</p>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>R1,499</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/mo</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
              <li style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#059669' }}>✓</span> 100 CVs/month</li>
              <li style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#059669' }}>✓</span> Unlimited + Team</li>
            </ul>
            <button onClick={onLogin} style={{ width: '100%', padding: '10px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Try free</button>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: 20 }}>No contracts. POPIA compliant.</p>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '48px 16px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', fontWeight: 800, color: '#0f172a', marginBottom: 10, padding: '0 8px' }}>Your next hire is already in your inbox.</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 20 }}>Let's find them together.</p>
          <button onClick={onLogin} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', width: '100%', maxWidth: 280 }}>Try HireInbox free</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 16px', borderTop: '1px solid #e2e8f0' }}>
        <div className="footer-inner" style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Logo size={24} />
            <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: 2, marginLeft: 34 }}>Less noise. Better hires.</div>
          </div>
          <div className="footer-links" style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem' }}>Privacy</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem' }}>Terms</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem' }}>POPIA</a>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>© 2025 HireInbox 🇿🇦</div>
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

  useEffect(() => { fetchRoles(); fetchCandidates(); }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) { const d = await res.json(); setRoles(d.roles || []); if (d.roles?.length > 0 && !selectedRole) setSelectedRole(d.roles[0].id); }
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
      if (res.ok) { fetchCandidates(); }
    } catch (e) { console.error(e); }
    setIsFetchingEmails(false);
  };

  const filteredCandidates = candidates.filter(c => activeTab === 'all' ? true : c.status === activeTab);
  const getInitials = (n: string | null) => n ? n.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase() : '??';
  const getTimeAgo = (d: string) => { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return 'Just now'; if (s < 3600) return Math.floor(s/60) + 'm ago'; if (s < 86400) return Math.floor(s/3600) + 'h ago'; return Math.floor(s/86400) + 'd ago'; };
  const formatWhatsApp = (p: string) => p.replace(/[^0-9]/g, '').replace(/^0/, '27');

  const shortlistCount = candidates.filter(c => c.status === 'shortlist').length;
  const poolCount = candidates.filter(c => c.status === 'talent_pool').length;
  const rejectCount = candidates.filter(c => c.status === 'reject').length;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
      <style>{'@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"); * { margin: 0; padding: 0; box-sizing: border-box; } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } @media (max-width: 767px) { .dashboard-sidebar { display: none !important; } .dashboard-main { margin-left: 0 !important; } }'}</style>

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar" style={{ width: 260, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={onLogout}>
          <Logo size={36} />
        </div>
        
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Overview</div>
            <NavItem icon="📊" label="Dashboard" active />
            <NavItem icon="📧" label="Live Inbox" badge={candidates.filter(c => !c.score).length || undefined} badgeColor="#f97316" onClick={handleFetchEmails} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Candidates</div>
            <NavItem icon="✓" label="Shortlisted" badge={shortlistCount || undefined} onClick={() => setActiveTab('shortlist')} />
            <NavItem icon="🧠" label="Talent Pool" badge={poolCount || undefined} onClick={() => setActiveTab('talent_pool')} />
            <NavItem icon="✗" label="Rejected" onClick={() => setActiveTab('reject')} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Roles</div>
            {roles.map(r => (
              <NavItem key={r.id} icon="💼" label={r.title} active={selectedRole === r.id} onClick={() => setSelectedRole(r.id)} />
            ))}
            <NavItem icon="+" label="Add New Role" color="#4F46E5" onClick={() => setShowNewRoleModal(true)} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Settings</div>
            <NavItem icon="⚙️" label="Company Settings" />
            <NavItem icon="👥" label="Team" />
            <NavItem icon="💳" label="Billing" />
          </div>
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#f8fafc' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>SM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Simon M.</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>simon@acme.co.za</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main" style={{ flex: 1, marginLeft: 260 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div onClick={onLogout} style={{ cursor: 'pointer' }}><Logo size={28} /></div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={handleFetchEmails} disabled={isFetchingEmails} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              📄 {isFetchingEmails ? 'Checking...' : 'Check Emails'}
            </button>
            <button onClick={() => setShowNewRoleModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              + New Role
            </button>
          </div>
        </header>

        <div style={{ padding: 32 }}>
          {/* TODAY CARD */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>📋 Today</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {shortlistCount > 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#ecfdf5', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.9rem', color: '#166534' }}><strong>{shortlistCount}</strong> {shortlistCount === 1 ? 'candidate' : 'candidates'} ready to call</span>
                  <button onClick={() => setActiveTab('shortlist')} style={{ background: '#166534', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>View</button>
                </div>
              )}
              {shortlistCount === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>All caught up! Check back later or add a new role.</span>
                </div>
              )}
            </div>
          </div>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            <StatCard icon="📧" iconBg="#eef2ff" value={candidates.length.toString()} label="CVs this month" trend="+12%" />
            <StatCard icon="✓" iconBg="#ecfdf5" value={shortlistCount.toString()} label="Shortlisted" trend="+8%" />
            <StatCard icon="🧠" iconBg="#fffbeb" value={poolCount.toString()} label="In Talent Pool" />
            <StatCard icon="⏱️" iconBg="#fff7ed" value={(candidates.length * 4.5 / 60).toFixed(1) + 'h'} label="Time saved" gradient extra={'≈ R' + (candidates.length * 150).toLocaleString() + ' in admin costs'} />
          </div>

          {/* MAIN CONTENT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
            {/* CANDIDATES LIST */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 4, padding: '0 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {[
                  { id: 'all', label: 'All', count: candidates.length },
                  { id: 'shortlist', label: 'Shortlisted', count: shortlistCount },
                  { id: 'talent_pool', label: 'Talent Pool', count: poolCount },
                  { id: 'reject', label: 'Rejected', count: rejectCount },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: activeTab === tab.id ? '#4F46E5' : '#64748b', background: activeTab === tab.id ? 'white' : 'transparent', border: 'none', borderBottom: '2px solid ' + (activeTab === tab.id ? '#4F46E5' : 'transparent'), marginBottom: -1, cursor: 'pointer' }}>
                    {tab.label} <span style={{ marginLeft: 6, padding: '2px 8px', background: activeTab === tab.id ? '#eef2ff' : '#f1f5f9', borderRadius: 100, fontSize: '0.75rem', color: activeTab === tab.id ? '#4F46E5' : '#64748b' }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#ecfdf5', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, color: '#059669', marginBottom: 16 }}>
                  <span style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                  Live — updates as CVs arrive
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredCandidates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <div style={{ width: 64, height: 64, background: '#f8fafc', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 16px' }}>📭</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>No candidates yet</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Click "Check Emails" to fetch new CVs</div>
                    </div>
                  ) : filteredCandidates.map(c => (
                    <CandidateCard key={c.id} candidate={c} onClick={() => setSelectedCandidate(c)} getInitials={getInitials} getTimeAgo={getTimeAgo} formatWhatsApp={formatWhatsApp} />
                  ))}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {roles.find(r => r.id === selectedRole) && (
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{roles.find(r => r.id === selectedRole)?.title}</h3>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', background: '#ecfdf5', color: '#059669' }}>
                    <span style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%' }}></span>
                    Active
                  </span>
                  {roles.find(r => r.id === selectedRole)?.criteria && (
                    <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ padding: '5px 10px', background: '#eef2ff', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, color: '#4F46E5' }}>{roles.find(r => r.id === selectedRole)?.criteria.min_experience_years}+ years</span>
                      {roles.find(r => r.id === selectedRole)?.criteria.required_skills?.map((s, i) => (
                        <span key={i} style={{ padding: '5px 10px', background: '#eef2ff', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, color: '#4F46E5' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {selectedCandidate && <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} getInitials={getInitials} formatWhatsApp={formatWhatsApp} />}
      {showNewRoleModal && <NewRoleModal onClose={() => setShowNewRoleModal(false)} onCreated={() => { fetchRoles(); setShowNewRoleModal(false); }} />}
    </div>
  );
}

function NavItem({ icon, label, badge, badgeColor, active, color, onClick }: { icon: string; label: string; badge?: number; badgeColor?: string; active?: boolean; color?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, color: color || (active ? '#4F46E5' : '#475569'), background: active ? '#eef2ff' : 'transparent', border: 'none', width: '100%', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', marginBottom: 2 }}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{icon}</span>
      {label}
      {badge !== undefined && <span style={{ marginLeft: 'auto', background: badgeColor || '#4F46E5', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{badge}</span>}
    </button>
  );
}

function StatCard({ icon, iconBg, value, label, trend, gradient, extra }: { icon: string; iconBg: string; value: string; label: string; trend?: string; gradient?: boolean; extra?: string }) {
  return (
    <div style={{ background: gradient ? 'linear-gradient(135deg, #eef2ff, #fff7ed)' : 'white', border: '1px solid ' + (gradient ? 'rgba(79,70,229,0.2)' : '#e2e8f0'), borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{icon}</div>
        {trend && <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: 100, background: '#ecfdf5', color: '#059669' }}>{trend}</span>}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: gradient ? '#4F46E5' : '#0f172a', letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{label}</div>
      {extra && <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600, marginTop: 4 }}>{extra}</div>}
    </div>
  );
}

// Helper to check evidence-based strength
function hasEvidence(s: unknown): s is StrengthItem {
  if (typeof s === 'object' && s !== null && 'label' in s && 'evidence' in s) {
    const item = s as StrengthItem;
    return item.evidence && item.evidence.length > 0 && item.evidence !== 'not mentioned';
  }
  return false;
}

function CandidateCard({ candidate, onClick, getInitials, getTimeAgo, formatWhatsApp }: { candidate: Candidate; onClick: () => void; getInitials: (n: string | null) => string; getTimeAgo: (d: string) => string; formatWhatsApp: (p: string) => string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    shortlist: { bg: '#dcfce7', text: '#166534' },
    talent_pool: { bg: '#eef2ff', text: '#4F46E5' },
    reject: { bg: '#fee2e2', text: '#991b1b' },
  };
  const c = colors[candidate.status] || colors.reject;
  const screening = candidate.screening_result;
  const confidence = screening?.confidence;

  // FIX #2: DESIGN RULE - Max 2 highlights in list view (prevents AI vomit as models improve)
  // LOCKED: Do not increase this limit
  const highlights = (screening?.evidence_highlights || [])
    .filter(h => h.evidence && h.evidence !== 'not mentioned')
    .slice(0, 2);

  // Get top risk
  const risks = screening?.risk_register || [];
  const topRisk = risks.length > 0 ? [...risks].sort((a, b) => {
    const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (order[a.severity] || 2) - (order[b.severity] || 2);
  })[0] : null;

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', opacity: candidate.status === 'reject' ? 0.7 : 1 }}>
      <div onClick={onClick} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16, cursor: 'pointer' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{getInitials(candidate.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{candidate.name || 'Unknown'}</div>
            {candidate.score !== null && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: c.text, background: c.bg, padding: '2px 8px', borderRadius: 6 }}>{candidate.score}</div>}
            {confidence && <div style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: confidence.level === 'HIGH' ? '#dcfce7' : confidence.level === 'MEDIUM' ? '#fef3c7' : '#fee2e2', color: confidence.level === 'HIGH' ? '#166534' : confidence.level === 'MEDIUM' ? '#92400e' : '#991b1b' }}>{confidence.level}</div>}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>{candidate.ai_reasoning || 'Processing...'}</div>

          {/* Evidence Highlights */}
          {highlights.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              {highlights.map((h, i) => (
                <div key={i} style={{ fontSize: '0.75rem', color: '#166534', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>✓ {h.claim}</span> — <span style={{ fontStyle: 'italic' }}>"{h.evidence}"</span>
                </div>
              ))}
            </div>
          )}

          {/* Top Risk */}
          {topRisk && (
            <div style={{ fontSize: '0.7rem', padding: '4px 8px', background: topRisk.severity === 'HIGH' ? '#fee2e2' : '#fffbeb', borderRadius: 4, color: topRisk.severity === 'HIGH' ? '#991b1b' : '#92400e', marginBottom: 6 }}>
              ⚠ {topRisk.risk} ({topRisk.severity})
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, background: c.bg, color: c.text }}>
              {candidate.status === 'shortlist' ? '✓ Shortlisted' : candidate.status === 'talent_pool' ? '→ Consider' : '✗ Rejected'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{getTimeAgo(candidate.created_at)}</span>
          </div>
        </div>
      </div>

      {candidate.status === 'shortlist' && candidate.phone && (
        <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0' }}>
          <a href={'https://wa.me/' + formatWhatsApp(candidate.phone)} target="_blank" onClick={e => e.stopPropagation()} style={{ flex: 1, padding: 10, background: '#25D366', color: 'white', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>💬 WhatsApp</a>
          <a href={'tel:' + candidate.phone} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: 10, background: '#4F46E5', color: 'white', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>📞 Call</a>
        </div>
      )}
    </div>
  );
}

/* ===========================================
   WORLD-CLASS CANDIDATE MODAL
   Two-panel layout, evidence-based, decision-ready
   =========================================== */
function CandidateModal({ candidate, onClose, getInitials, formatWhatsApp }: { candidate: Candidate; onClose: () => void; getInitials: (n: string | null) => string; formatWhatsApp: (p: string) => string }) {
  const [showFullReport, setShowFullReport] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ why: true, evidence: true, risks: true, fit: false, interview: false, alt: false });

  const colors: Record<string, { bg: string; text: string; border: string }> = {
    shortlist: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    talent_pool: { bg: '#eef2ff', text: '#4F46E5', border: '#a5b4fc' },
    reject: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  };
  const c = colors[candidate.status] || colors.reject;
  const screening = candidate.screening_result;
  const confidence = screening?.confidence;

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const risks = screening?.risk_register || [];
  const highlights = screening?.evidence_highlights || [];
  const interviewFocus = screening?.interview_focus || [];
  const altRoles = screening?.alt_role_suggestions || [];
  const hardReqs = screening?.hard_requirements;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 1000, maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{getInitials(candidate.name)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{candidate.name || 'Unknown'}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{candidate.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setShowFullReport(!showFullReport)} style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
              {showFullReport ? 'Hide' : 'View'} Full Report
            </button>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>
        </div>

        {/* BODY - Two Panel Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* LEFT PANEL - Decision + Identity */}
          <div style={{ width: 320, borderRight: '1px solid #e2e8f0', padding: 24, overflowY: 'auto', flexShrink: 0, background: '#fafafa' }}>
            
            {/* Score + Recommendation */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '4rem', fontWeight: 800, color: c.text, lineHeight: 1 }}>{candidate.score || '--'}</div>
              <div style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 700, background: c.bg, color: c.text, marginTop: 8, border: `2px solid ${c.border}` }}>
                {candidate.status === 'shortlist' ? '✓ SHORTLIST' : candidate.status === 'talent_pool' ? '◐ CONSIDER' : '✗ REJECT'}
              </div>
              
              {/* Confidence */}
              {confidence && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>CONFIDENCE</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {['HIGH', 'MEDIUM', 'LOW'].map(level => (
                      <div key={level} style={{ 
                        width: 24, height: 8, borderRadius: 4, 
                        background: confidence.level === level ? (level === 'HIGH' ? '#22c55e' : level === 'MEDIUM' ? '#f59e0b' : '#ef4444') : '#e2e8f0'
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>{confidence.level}</div>
                </div>
              )}
            </div>

            {/* Identity Details - FIX #1: Location shows "Not specified" when missing */}
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <DetailRow label="Email" value={candidate.email} />
              <DetailRow label="Phone" value={candidate.phone} />
              <DetailRow label="Location" value={screening?.location_summary || candidate.location} showEmpty />
              <DetailRow label="Work Mode" value={screening?.work_mode} showEmpty />
              <DetailRow label="Current Title" value={screening?.current_title} />
              <DetailRow label="Company" value={screening?.current_company} />
              <DetailRow label="Experience" value={screening?.years_experience ? `${screening.years_experience} years` : null} />
            </div>

            {/* Action Buttons */}
            {candidate.phone && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href={'https://wa.me/' + formatWhatsApp(candidate.phone)} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#25D366', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>💬 WhatsApp</a>
                <a href={'tel:' + candidate.phone} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#4F46E5', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>📞 Call Now</a>
                <a href={'mailto:' + candidate.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#f97316', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>📧 Email</a>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Evidence + Risks + Interview */}
          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
            
            {showFullReport ? (
              <div style={{ background: '#1e293b', borderRadius: 8, padding: 16, color: '#e2e8f0', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '100%', overflow: 'auto' }}>
                {JSON.stringify(screening, null, 2)}
              </div>
            ) : (
              <>
                {/* WHY */}
                <CollapsibleSection title="Why" icon="💡" expanded={expandedSections.why} onToggle={() => toggleSection('why')}>
                  <p style={{ fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.6 }}>{screening?.recommendation_reason || candidate.ai_reasoning || 'No reasoning provided.'}</p>
                </CollapsibleSection>

                {/* EVIDENCE HIGHLIGHTS */}
                <CollapsibleSection title="Evidence Highlights" icon="📊" expanded={expandedSections.evidence} onToggle={() => toggleSection('evidence')} count={highlights.length}>
                  {highlights.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>Limited measurable evidence provided</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {highlights.map((h, i) => (
                        <div key={i} style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, borderLeft: '3px solid #22c55e' }}>
                          <div style={{ fontWeight: 600, color: '#166534', marginBottom: 4 }}>{h.claim}</div>
                          <div style={{ fontSize: '0.85rem', color: '#15803d', fontStyle: 'italic' }}>"{h.evidence}"</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* RED FLAGS & RISKS */}
                <CollapsibleSection title="Red Flags & Risks" icon="🚨" expanded={expandedSections.risks} onToggle={() => toggleSection('risks')} count={risks.length} highlight={risks.some(r => r.severity === 'HIGH')}>
                  {risks.length === 0 ? (
                    <p style={{ color: '#166534' }}>✓ No significant risks identified</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {risks.map((r, i) => (
                        <div key={i} style={{ padding: 12, background: r.severity === 'HIGH' ? '#fef2f2' : r.severity === 'MEDIUM' ? '#fffbeb' : '#f8fafc', borderRadius: 8, borderLeft: `3px solid ${r.severity === 'HIGH' ? '#ef4444' : r.severity === 'MEDIUM' ? '#f59e0b' : '#94a3b8'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: r.severity === 'HIGH' ? '#dc2626' : r.severity === 'MEDIUM' ? '#d97706' : '#475569' }}>{r.risk}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: r.severity === 'HIGH' ? '#fee2e2' : r.severity === 'MEDIUM' ? '#fef3c7' : '#f1f5f9', color: r.severity === 'HIGH' ? '#dc2626' : r.severity === 'MEDIUM' ? '#d97706' : '#64748b' }}>{r.severity}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Evidence: {r.evidence}</div>
                          <div style={{ fontSize: '0.8rem', color: '#4F46E5', fontStyle: 'italic' }}>→ {r.interview_question}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* ROLE FIT BREAKDOWN */}
                {hardReqs && (
                  <CollapsibleSection title="Role Fit Breakdown" icon="📋" expanded={expandedSections.fit} onToggle={() => toggleSection('fit')}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {hardReqs.met?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: 6 }}>✓ Met</div>
                          {hardReqs.met.map((r, i) => <div key={i} style={{ fontSize: '0.8rem', color: '#166534', marginBottom: 4 }}>{r}</div>)}
                        </div>
                      )}
                      {hardReqs.partial?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', marginBottom: 6 }}>◐ Partial</div>
                          {hardReqs.partial.map((r, i) => <div key={i} style={{ fontSize: '0.8rem', color: '#d97706', marginBottom: 4 }}>{r}</div>)}
                        </div>
                      )}
                      {hardReqs.not_met?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>✗ Not Met</div>
                          {hardReqs.not_met.map((r, i) => <div key={i} style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: 4 }}>{r}</div>)}
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* INTERVIEW FOCUS */}
                <CollapsibleSection title="Interview Focus" icon="🎯" expanded={expandedSections.interview} onToggle={() => toggleSection('interview')} count={interviewFocus.length}>
                  {interviewFocus.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No specific interview questions suggested</p>
                  ) : (
                    <ol style={{ paddingLeft: 20, color: '#475569', fontSize: '0.9rem' }}>
                      {interviewFocus.slice(0, 5).map((q, i) => <li key={i} style={{ marginBottom: 8 }}>{q}</li>)}
                    </ol>
                  )}
                </CollapsibleSection>

                {/* ALTERNATIVE ROLES */}
                {altRoles.length > 0 && (
                  <CollapsibleSection title="Alternative Roles" icon="🔄" expanded={expandedSections.alt} onToggle={() => toggleSection('alt')} count={altRoles.length}>
                    {altRoles.map((r, i) => (
                      <div key={i} style={{ padding: 12, background: '#eef2ff', borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, color: '#4F46E5' }}>{r.role}</div>
                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>{r.why}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>Confidence: {r.confidence}</div>
                      </div>
                    ))}
                  </CollapsibleSection>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// FIX #1: DetailRow now shows "Not specified" for missing values when showEmpty is true
function DetailRow({ label, value, showEmpty }: { label: string; value: string | number | null | undefined; showEmpty?: boolean }) {
  if (!value && !showEmpty) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', color: value ? '#0f172a' : '#94a3b8', fontStyle: value ? 'normal' : 'italic' }}>{value || 'Not specified'}</div>
    </div>
  );
}

function CollapsibleSection({ title, icon, expanded, onToggle, count, highlight, children }: { title: string; icon: string; expanded: boolean; onToggle: () => void; count?: number; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, border: `1px solid ${highlight ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden', background: highlight ? '#fef2f2' : 'white' }}>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>{title}</span>
        {count !== undefined && <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: '#f1f5f9', color: '#64748b' }}>{count}</span>}
        <span style={{ color: '#94a3b8' }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && <div style={{ padding: '0 16px 16px' }}>{children}</div>}
    </div>
  );
}

function NewRoleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [minExp, setMinExp] = useState(2);
  const [skills, setSkills] = useState('');
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
            locations: [],
          }
        })
      });
      if (res.ok) onCreated();
    } catch (e) { console.error(e); alert('Failed to create role'); }
    setIsCreating(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 25px 80px rgba(0,0,0,0.25)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Create New Role</h2>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Role Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Developer" style={{ width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem' }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Min. Experience</label>
          <select value={minExp} onChange={e => setMinExp(parseInt(e.target.value))} style={{ width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem', background: 'white' }}>
            <option value={0}>No minimum</option>
            <option value={1}>1+ years</option>
            <option value={2}>2+ years</option>
            <option value={3}>3+ years</option>
            <option value={5}>5+ years</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Required Skills</label>
          <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Python, Django, PostgreSQL" style={{ width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem' }} />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>Separate with commas</div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', background: 'white', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
          <button onClick={handleCreate} disabled={isCreating || !title} style={{ flex: 1, padding: '14px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: isCreating || !title ? 0.5 : 1 }}>
            {isCreating ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

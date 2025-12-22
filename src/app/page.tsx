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
  exception_applied?: boolean;
  exception_reason?: string;
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

// Brand Logo with tagline
const Logo = ({ size = 36, showText = true, showTagline = false, darkBg = false }: { size?: number; showText?: boolean; showTagline?: boolean; darkBg?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {showText && (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: size > 30 ? '1.25rem' : '1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          <span style={{ color: darkBg ? 'white' : '#0f172a' }}>Hire</span>
          <span style={{ color: darkBg ? '#A5B4FC' : '#4F46E5' }}>Inbox</span>
        </span>
        {showTagline && (
          <span style={{ fontSize: '0.65rem', color: darkBg ? '#94a3b8' : '#64748b', fontWeight: 500, letterSpacing: '0.01em' }}>
            Less noise. Better hires.
          </span>
        )}
      </div>
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
            <a href="/upload" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>For candidates</a>
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
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>Example</span>
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
            <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: '#0f172a' }}>Instant</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>CV screening</div>
          </div>
          <div className="stats-divider" style={{ width: 1, height: 40, background: '#e2e8f0' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: '#0f172a' }}>Evidence</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Every decision explained</div>
          </div>
          <div className="stats-divider" style={{ width: 1, height: 40, background: '#e2e8f0' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: '#0f172a' }}>SA-built</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>POPIA compliant</div>
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
          <div className="candidates-checks" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
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
          <a href="/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#4F46E5', color: 'white', padding: '12px 24px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
            Get free CV feedback <span>→</span>
          </a>
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
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Built by Simon Rubin, Cape Town</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>Questions? simon@hireinbox.co.za</div>
          </div>
          <div className="footer-links" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem' }}>Privacy</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem' }}>Terms</a>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>© 2025 🇿🇦</span>
          </div>
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
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
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
    finally { setIsLoadingCandidates(false); }
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
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .dashboard-sidebar { width: 200px !important; }
        }
        @media (max-width: 767px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-main { margin-left: 0 !important; padding: 16px !important; }
          .dashboard-header { flex-direction: column !important; gap: 12px !important; }
          .dashboard-stats { flex-wrap: wrap !important; }
          .candidate-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar" style={{ width: 260, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={onLogout}>
          <Logo size={36} showTagline={true} />
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
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Creators <span style={{ marginLeft: 6, background: '#8B5CF6', color: 'white', padding: '2px 6px', borderRadius: 8, fontSize: '0.55rem', fontWeight: 700 }}>NEW</span></div>
            <NavItem icon="🎬" label="Creator Passport" color="#8B5CF6" onClick={() => setActiveTab('creators')} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Pro Tools</div>
            <NavItem icon="🔍" label="Headhunter Search" color="#8B5CF6" onClick={() => setActiveTab('headhunter')} />
            <NavItem icon="⭐" label="Elite Talent" color="#F59E0B" onClick={() => setActiveTab('elite')} />
            <NavItem icon="📋" label="Reference Check" color="#10B981" onClick={() => setActiveTab('references')} />
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
            <NavItem icon="⚙️" label="Company Settings" onClick={() => alert('Company Settings — Coming soon')} />
            <NavItem icon="👥" label="Team" onClick={() => alert('Team Management — Coming soon')} />
            <NavItem icon="💳" label="Billing" onClick={() => alert('Billing — Coming soon')} />
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
          {activeTab === 'creators' ? (
            <CreatorPassportHub />
          ) : activeTab === 'headhunter' ? (
            <HeadhunterSearch candidates={candidates} onSelectCandidate={setSelectedCandidate} />
          ) : activeTab === 'elite' ? (
            <EliteTalentHub candidates={candidates.filter(c => (c.screening_result?.overall_score || c.score || 0) >= 80)} onSelectCandidate={setSelectedCandidate} />
          ) : activeTab === 'references' ? (
            <ReferenceCheckHub candidates={candidates} />
          ) : (
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
                  {isLoadingCandidates ? (
                    /* LOADING STATE */
                    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                      <div style={{ width: 48, height: 48, margin: '0 auto 20px', position: 'relative' }}>
                        <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#4F46E5" strokeWidth="4" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Loading candidates...</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Fetching from database</div>
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    /* EMPTY STATE */
                    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                      <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)' }}>
                        {activeTab === 'all' ? '📬' : activeTab === 'shortlist' ? '⭐' : activeTab === 'talent_pool' ? '💎' : '📭'}
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                        {activeTab === 'all' ? 'No candidates yet' : `No ${activeTab.replace('_', ' ')} candidates`}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>
                        {activeTab === 'all'
                          ? 'CVs sent to your inbox will appear here automatically after AI screening.'
                          : 'Candidates will appear here as they are screened and categorized.'}
                      </div>
                      <button
                        onClick={handleFetchEmails}
                        disabled={isFetchingEmails}
                        style={{
                          background: '#4F46E5',
                          color: 'white',
                          padding: '12px 24px',
                          borderRadius: 10,
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: isFetchingEmails ? 'wait' : 'pointer',
                          opacity: isFetchingEmails ? 0.7 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        {isFetchingEmails ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeLinecap="round" />
                            </svg>
                            Checking inbox...
                          </>
                        ) : (
                          <>📧 Check for new CVs</>
                        )}
                      </button>
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
          )}
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
    return Boolean(item.evidence && item.evidence.length > 0 && item.evidence !== 'not mentioned');
  }
  return false;
}

/* ===========================================
   CANDIDATE CARD - DECISION INSTRUMENT
   "This is what a thoughtful, fair, evidence-based
   hiring decision looks like — compressed into a screen."
   =========================================== */
function CandidateCard({ candidate, onClick, getInitials, getTimeAgo, formatWhatsApp }: { candidate: Candidate; onClick: () => void; getInitials: (n: string | null) => string; getTimeAgo: (d: string) => string; formatWhatsApp: (p: string) => string }) {
  const colors: Record<string, { bg: string; text: string; border: string; dominant: string }> = {
    shortlist: { bg: '#dcfce7', text: '#166534', border: '#86efac', dominant: '#15803d' },
    talent_pool: { bg: '#eef2ff', text: '#4F46E5', border: '#a5b4fc', dominant: '#4338ca' },
    reject: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', dominant: '#b91c1c' },
  };
  const c = colors[candidate.status] || colors.reject;
  const screening = candidate.screening_result;
  const confidence = screening?.confidence;

  // Evidence highlights - max 3 with real evidence only
  const highlights = (screening?.evidence_highlights || [])
    .filter(h => h.evidence && h.evidence !== 'not mentioned' && h.evidence.length > 5)
    .slice(0, 3);

  // Top 2 risks, sorted by severity
  const risks = screening?.risk_register || [];
  const topRisks = [...risks]
    .sort((a, b) => {
      const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (order[a.severity] || 2) - (order[b.severity] || 2);
    })
    .slice(0, 2);

  // Context info
  const location = screening?.location_summary || candidate.location;
  const workMode = screening?.work_mode;
  const currentTitle = screening?.current_title;
  const currentCompany = screening?.current_company;
  const yearsExp = screening?.years_experience;
  const exceptionApplied = screening?.exception_applied;

  // Build context line
  const contextParts: string[] = [];
  if (currentTitle) contextParts.push(currentTitle);
  if (currentCompany) contextParts.push(`@ ${currentCompany}`);
  if (yearsExp) contextParts.push(`${yearsExp}y exp`);
  const contextLine = contextParts.join(' · ');

  const locationLine = [location, workMode && workMode !== 'unknown' ? workMode : null].filter(Boolean).join(' · ');

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: `1px solid ${candidate.status === 'shortlist' ? c.border : '#e2e8f0'}`,
      overflow: 'hidden',
      opacity: candidate.status === 'reject' ? 0.75 : 1,
      boxShadow: candidate.status === 'shortlist' ? '0 2px 8px rgba(22, 101, 52, 0.1)' : 'none'
    }}>
      {/* DECISION HEADER - Dominant visual element */}
      <div style={{
        background: c.bg,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${c.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: c.dominant,
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            {candidate.status === 'shortlist' ? '✓ SHORTLIST' : candidate.status === 'talent_pool' ? '◐ CONSIDER' : '✗ REJECT'}
          </span>
          {exceptionApplied && (
            <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#92400e' }}>
              Exception
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: c.dominant }}>{candidate.score ?? '--'}</span>
          {confidence && (
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 600,
              padding: '2px 5px',
              borderRadius: 4,
              background: confidence.level === 'HIGH' ? '#dcfce7' : confidence.level === 'MEDIUM' ? '#fef3c7' : '#fee2e2',
              color: confidence.level === 'HIGH' ? '#166534' : confidence.level === 'MEDIUM' ? '#92400e' : '#991b1b'
            }}>
              {confidence.level}
            </span>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div onClick={onClick} style={{ padding: 16, cursor: 'pointer' }}>
        {/* IDENTITY & CONTEXT */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: '#f1f5f9', color: '#475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
          }}>
            {getInitials(candidate.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: 2 }}>
              {candidate.name || 'Unknown Candidate'}
            </div>
            {contextLine && (
              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 1 }}>{contextLine}</div>
            )}
            {locationLine && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{locationLine}</div>
            )}
          </div>
        </div>

        {/* REASONING - Why this decision */}
        <div style={{
          fontSize: '0.85rem',
          color: '#334155',
          lineHeight: 1.5,
          marginBottom: 12,
          padding: '10px 12px',
          background: '#f8fafc',
          borderRadius: 8,
          borderLeft: `3px solid ${c.border}`
        }}>
          {candidate.ai_reasoning || screening?.recommendation_reason || 'Processing...'}
        </div>

        {/* EVIDENCE HIGHLIGHTS - The Trust Engine */}
        {highlights.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Evidence</div>
            {highlights.map((h, i) => (
              <div key={i} style={{
                fontSize: '0.8rem',
                color: '#166534',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6
              }}>
                <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
                <span>
                  <strong>{h.claim}</strong>
                  <span style={{ color: '#15803d', fontStyle: 'italic' }}> — "{h.evidence}"</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* RISK REGISTER - Compact, Honest */}
        {topRisks.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {topRisks.map((risk, i) => (
              <div key={i} style={{
                fontSize: '0.75rem',
                padding: '6px 10px',
                marginBottom: 4,
                background: risk.severity === 'HIGH' ? '#fef2f2' : risk.severity === 'MEDIUM' ? '#fffbeb' : '#f8fafc',
                borderRadius: 6,
                color: risk.severity === 'HIGH' ? '#991b1b' : risk.severity === 'MEDIUM' ? '#92400e' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ fontSize: '0.85rem' }}>⚠</span>
                <span><strong>{risk.risk}</strong> ({risk.severity})</span>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER - Time */}
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'right' }}>
          {getTimeAgo(candidate.created_at)}
        </div>
      </div>

      {/* ACTION BAR - Only for actionable candidates */}
      {(candidate.status === 'shortlist' || candidate.status === 'talent_pool') && candidate.phone && (
        <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0' }}>
          <a
            href={'https://wa.me/' + formatWhatsApp(candidate.phone)}
            target="_blank"
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, padding: 10,
              background: candidate.status === 'shortlist' ? '#25D366' : '#f1f5f9',
              color: candidate.status === 'shortlist' ? 'white' : '#475569',
              textAlign: 'center', textDecoration: 'none',
              fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            💬 WhatsApp
          </a>
          <a
            href={'tel:' + candidate.phone}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, padding: 10,
              background: candidate.status === 'shortlist' ? '#4F46E5' : '#f1f5f9',
              color: candidate.status === 'shortlist' ? 'white' : '#475569',
              textAlign: 'center', textDecoration: 'none',
              fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            📞 Call
          </a>
          <a
            href={'mailto:' + candidate.email}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, padding: 10,
              background: '#f1f5f9',
              color: '#475569',
              textAlign: 'center', textDecoration: 'none',
              fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            ✉ Email
          </a>
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ why: true, strengths: true, weaknesses: true, evidence: true, risks: true, fit: false, interview: false, alt: false });

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

  // Strengths with evidence - from summary
  const summaryStrengths = (screening?.summary?.strengths || [])
    .filter((s): s is StrengthItem => {
      if (typeof s !== 'object' || s === null) return false;
      const item = s as StrengthItem;
      return Boolean(item.label && item.evidence && item.evidence !== 'not mentioned' && item.evidence.length > 3);
    });
  const summaryWeaknesses = (screening?.summary?.weaknesses || [])
    .filter((w): w is WeaknessItem => {
      if (typeof w !== 'object' || w === null) return false;
      const item = w as WeaknessItem;
      return Boolean(item.label);
    });

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
              
              {/* Exception Applied Badge */}
              {screening?.exception_applied && (
                <div style={{
                  marginTop: 12,
                  padding: '6px 12px',
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: '1rem' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e' }}>EXCEPTION APPLIED</div>
                    <div style={{ fontSize: '0.65rem', color: '#a16207' }}>{screening.exception_reason || 'Near-miss with exceptional indicators'}</div>
                  </div>
                </div>
              )}

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

            {/* Action Buttons - ONLY for actionable candidates (not REJECT) */}
            {candidate.status !== 'reject' && candidate.phone && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href={'https://wa.me/' + formatWhatsApp(candidate.phone)} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#25D366', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>💬 WhatsApp</a>
                <a href={'tel:' + candidate.phone} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#4F46E5', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>📞 Call Now</a>
                <a href={'mailto:' + candidate.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#f97316', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>📧 Email</a>
              </div>
            )}

            {/* For REJECT - show muted email only option */}
            {candidate.status === 'reject' && candidate.email && (
              <div style={{ marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8, textAlign: 'center' }}>Send outcome notification</div>
                <a href={'mailto:' + candidate.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, background: '#e2e8f0', color: '#475569', borderRadius: 6, textDecoration: 'none', fontWeight: 500, fontSize: '0.85rem' }}>✉ Email Candidate</a>
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

                {/* STRENGTHS - With CV Evidence */}
                <CollapsibleSection title="Strengths" icon="✓" expanded={expandedSections.strengths} onToggle={() => toggleSection('strengths')} count={summaryStrengths.length}>
                  {summaryStrengths.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No evidence-based strengths identified</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {summaryStrengths.map((s, i) => (
                        <div key={i} style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, borderLeft: '3px solid #22c55e' }}>
                          <div style={{ fontWeight: 600, color: '#166534', marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: '0.85rem', color: '#15803d', fontStyle: 'italic' }}>&ldquo;{s.evidence}&rdquo;</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* WEAKNESSES / GAPS */}
                <CollapsibleSection title="Gaps &amp; Missing" icon="⚠" expanded={expandedSections.weaknesses} onToggle={() => toggleSection('weaknesses')} count={summaryWeaknesses.length}>
                  {summaryWeaknesses.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No significant gaps identified</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {summaryWeaknesses.map((w, i) => (
                        <div key={i} style={{ padding: 10, background: '#fef2f2', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
                          <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 2 }}>{w.label}</div>
                          {w.evidence && w.evidence !== 'not mentioned' && (
                            <div style={{ fontSize: '0.8rem', color: '#b45309', fontStyle: 'italic' }}>{w.evidence}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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

/* ===========================================
   HEADHUNTER SEARCH - Pro talent search
   Find the best candidates across your pool
   =========================================== */
function HeadhunterSearch({ candidates, onSelectCandidate }: { candidates: Candidate[]; onSelectCandidate: (c: Candidate) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'newest'>('score');
  const [eliteOnly, setEliteOnly] = useState(false);

  // Filter and sort candidates
  const filteredCandidates = candidates
    .filter(c => {
      const screening = c.screening_result;
      const score = screening?.overall_score || c.score || 0;
      const experience = screening?.years_experience || 0;
      const name = c.name || '';
      const skills = (screening?.hard_requirements?.met || []).join(' ').toLowerCase();

      // Elite filter (80+)
      if (eliteOnly && score < 80) return false;

      // Min score filter
      if (score < minScore) return false;

      // Min experience filter
      if (experience < minExperience) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = name.toLowerCase().includes(query);
        const matchesSkills = skills.includes(query);
        const matchesEmail = (c.email || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSkills && !matchesEmail) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const aScreening = a.screening_result;
      const bScreening = b.screening_result;

      if (sortBy === 'score') {
        return (bScreening?.overall_score || b.score || 0) - (aScreening?.overall_score || a.score || 0);
      } else if (sortBy === 'experience') {
        return (bScreening?.years_experience || 0) - (aScreening?.years_experience || 0);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const eliteCount = candidates.filter(c => (c.screening_result?.overall_score || c.score || 0) >= 80).length;

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', padding: 24, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔍</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Headhunter Search</h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>Find the best talent in your pool</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{candidates.length}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total candidates</div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, skill, or email..."
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              borderRadius: 10,
              border: 'none',
              fontSize: '0.9375rem',
              background: 'rgba(255,255,255,0.95)',
              color: '#0f172a',
              outline: 'none'
            }}
          />
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Elite Toggle */}
        <button
          onClick={() => setEliteOnly(!eliteOnly)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 100,
            border: eliteOnly ? '2px solid #8B5CF6' : '2px solid #e2e8f0',
            background: eliteOnly ? '#F5F3FF' : 'white',
            color: eliteOnly ? '#7C3AED' : '#64748b',
            fontWeight: 600,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          <span>⭐</span> Elite Only (80+)
          <span style={{ background: eliteOnly ? '#8B5CF6' : '#e2e8f0', color: eliteOnly ? 'white' : '#64748b', padding: '2px 8px', borderRadius: 100, fontSize: '0.75rem' }}>{eliteCount}</span>
        </button>

        {/* Min Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Min Score:</span>
          <select value={minScore} onChange={e => setMinScore(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8125rem', background: 'white' }}>
            <option value={0}>Any</option>
            <option value={50}>50+</option>
            <option value={60}>60+</option>
            <option value={70}>70+</option>
            <option value={80}>80+</option>
            <option value={90}>90+</option>
          </select>
        </div>

        {/* Min Experience */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Experience:</span>
          <select value={minExperience} onChange={e => setMinExperience(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8125rem', background: 'white' }}>
            <option value={0}>Any</option>
            <option value={1}>1+ years</option>
            <option value={2}>2+ years</option>
            <option value={3}>3+ years</option>
            <option value={5}>5+ years</option>
            <option value={10}>10+ years</option>
          </select>
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Sort:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'score' | 'experience' | 'newest')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8125rem', background: 'white' }}>
            <option value="score">Highest Score</option>
            <option value="experience">Most Experience</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: 16 }}>
          Showing <strong style={{ color: '#0f172a' }}>{filteredCandidates.length}</strong> of {candidates.length} candidates
        </div>

        {filteredCandidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>No candidates match your filters</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Try adjusting your search criteria</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredCandidates.slice(0, 20).map(candidate => {
              const screening = candidate.screening_result;
              const score = screening?.overall_score || candidate.score || 0;
              const experience = screening?.years_experience || 0;
              const skills = (screening?.hard_requirements?.met || []).slice(0, 4);

              return (
                <div
                  key={candidate.id}
                  onClick={() => onSelectCandidate(candidate)}
                  style={{
                    background: 'white',
                    border: score >= 80 ? '2px solid #8B5CF6' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {score >= 80 && (
                    <div style={{ position: 'absolute', top: -8, right: 12, background: '#8B5CF6', color: 'white', fontSize: '0.6875rem', fontWeight: 700, padding: '3px 8px', borderRadius: 100 }}>
                      ⭐ ELITE
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    {/* Score Circle */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: score >= 80 ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : score >= 60 ? '#10B981' : '#F59E0B',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem'
                    }}>
                      {score}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem', marginBottom: 2 }}>
                        {candidate.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {experience > 0 ? `${experience} years exp` : 'Experience not specified'}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {skills.map((skill, i) => (
                        <span key={i} style={{ fontSize: '0.6875rem', padding: '3px 8px', background: '#f1f5f9', borderRadius: 4, color: '#475569' }}>
                          {skill}
                        </span>
                      ))}
                      {(screening?.hard_requirements?.met?.length || 0) > 4 && (
                        <span style={{ fontSize: '0.6875rem', padding: '3px 8px', color: '#94a3b8' }}>
                          +{(screening?.hard_requirements?.met?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filteredCandidates.length > 20 && (
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: '#64748b' }}>
            Showing top 20 results. Refine your search to see more specific matches.
          </div>
        )}
      </div>
    </div>
  );
}

/* ===========================================
   ELITE TALENT HUB - Premium 80+ candidates
   Special features for top performers
   =========================================== */
function EliteTalentHub({ candidates, onSelectCandidate }: { candidates: Candidate[]; onSelectCandidate: (c: Candidate) => void }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
      {/* Premium Header */}
      <div style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', padding: 32, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 100, height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>⭐</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, marginBottom: 4 }}>Elite Talent Hub</h2>
            <p style={{ fontSize: '0.9375rem', opacity: 0.9, margin: 0 }}>Your top 80+ score candidates with premium features</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{candidates.length}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Elite candidates</div>
          </div>
        </div>
      </div>

      {/* Elite Features Overview */}
      <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0', background: '#FFFBEB' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Elite Candidate Features
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { icon: '🎥', title: 'Video Intro', desc: 'See their personality', status: 'available' },
            { icon: '✓', title: 'Verified Profile', desc: 'ID & credentials checked', status: 'coming' },
            { icon: '📞', title: 'Direct Contact', desc: 'Skip the queue', status: 'available' },
            { icon: '📋', title: 'Pre-checked Refs', desc: 'References verified', status: 'coming' },
          ].map((feature, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #FDE68A', position: 'relative' }}>
              {feature.status === 'coming' && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.625rem', fontWeight: 600, color: '#92400E', background: '#FEF3C7', padding: '2px 6px', borderRadius: 4 }}>SOON</div>
              )}
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{feature.icon}</div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem', marginBottom: 2 }}>{feature.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Elite Candidates Grid */}
      <div style={{ padding: 24 }}>
        {candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>⭐</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No elite candidates yet</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: 400, margin: '0 auto' }}>
              Candidates scoring 80+ will appear here with access to premium features like video intros and verified profiles.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {candidates.map(candidate => {
              const screening = candidate.screening_result;
              const score = screening?.overall_score || candidate.score || 0;

              return (
                <div
                  key={candidate.id}
                  onClick={() => onSelectCandidate(candidate)}
                  style={{
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                    border: '2px solid #F59E0B',
                    borderRadius: 16,
                    padding: 20,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {/* Elite Badge */}
                  <div style={{ position: 'absolute', top: -10, right: 16, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', fontSize: '0.6875rem', fontWeight: 700, padding: '4px 12px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⭐ ELITE
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    {/* Score */}
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                    }}>
                      {score}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: 4 }}>
                        {candidate.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {screening?.years_experience ? `${screening.years_experience} years exp` : 'Experience N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, padding: '8px 12px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      🎥 Video
                    </button>
                    <button style={{ flex: 1, padding: '8px 12px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      📞 Contact
                    </button>
                    <button style={{ flex: 1, padding: '8px 12px', background: '#F59E0B', border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}>
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===========================================
   REFERENCE CHECK HUB - Smart reference verification
   AI-powered reference checking system
   =========================================== */
function ReferenceCheckHub({ candidates }: { candidates: Candidate[] }) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  // Mock reference data for demo
  const referenceRequests = [
    { id: '1', candidateName: 'Thabo Molefe', status: 'pending', refs: 2, sent: '2 days ago' },
    { id: '2', candidateName: 'Sarah Johnson', status: 'complete', refs: 3, sent: '5 days ago', score: 92 },
  ];

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: 32, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📋</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, marginBottom: 4 }}>Smart Reference Check</h2>
            <p style={{ fontSize: '0.9375rem', opacity: 0.9, margin: 0 }}>AI-powered reference verification with fraud detection</p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0', background: '#F0FDF4' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          How it works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { num: 1, title: 'Request', desc: 'Candidate provides 2-3 references' },
            { num: 2, title: 'Verify', desc: 'We verify referee identity & role' },
            { num: 3, title: 'Survey', desc: 'Smart questionnaire sent via email' },
            { num: 4, title: 'AI Analysis', desc: 'Red flags & insights surfaced' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{step.num}</div>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem', marginBottom: 2 }}>{step.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          🤖 AI-Powered Analysis
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '🚩', title: 'Red Flag Detection', desc: 'Spots hesitation, vague answers, inconsistencies' },
            { icon: '✓', title: 'Claim Verification', desc: 'Cross-checks achievements mentioned in CV' },
            { icon: '📊', title: 'Reference Score', desc: 'Quantified endorsement strength (0-100)' },
          ].map((feature, i) => (
            <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>{feature.icon}</div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem', marginBottom: 4 }}>{feature.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reference Requests */}
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference Requests</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Track and manage reference checks</div>
          </div>
          <button style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            + New Request
          </button>
        </div>

        {/* Requests List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {referenceRequests.map(req => (
            <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: req.status === 'complete' ? '#D1FAE5' : '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                {req.status === 'complete' ? '✓' : '⏳'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{req.candidateName}</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{req.refs} references • Sent {req.sent}</div>
              </div>
              {req.status === 'complete' && req.score && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{req.score}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Ref Score</div>
                </div>
              )}
              <span style={{
                padding: '6px 12px',
                borderRadius: 100,
                fontSize: '0.75rem',
                fontWeight: 600,
                background: req.status === 'complete' ? '#D1FAE5' : '#FEF3C7',
                color: req.status === 'complete' ? '#166534' : '#92400E'
              }}>
                {req.status === 'complete' ? 'Complete' : 'Pending'}
              </span>
              <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
                View
              </button>
            </div>
          ))}
        </div>

        {/* Sample Report Preview */}
        <div style={{ marginTop: 32, background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)', borderRadius: 16, padding: 24, border: '1px solid #A7F3D0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Sample Reference Report
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.125rem' }}>Sarah Johnson</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>3 references verified</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem' }}>92</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 4 }}>Reference Score</div>
              </div>
            </div>

            {/* Key Findings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#F0FDF4', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#166534', marginBottom: 4 }}>✓ VERIFIED CLAIMS</div>
                <div style={{ fontSize: '0.8125rem', color: '#0f172a' }}>"Exceeded quota by 150%" confirmed by 2/3 refs</div>
              </div>
              <div style={{ background: '#F0FDF4', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#166534', marginBottom: 4 }}>✓ STRONG ENDORSEMENT</div>
                <div style={{ fontSize: '0.8125rem', color: '#0f172a' }}>"Would rehire immediately" - Former Manager</div>
              </div>
            </div>

            {/* AI Insights */}
            <div style={{ background: '#EEF2FF', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#4338CA', marginBottom: 4 }}>🤖 AI INSIGHT</div>
              <div style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                All 3 references showed consistent enthusiasm. No hesitation detected. Strong pattern of leadership praise.
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button style={{ background: '#10B981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Start Your First Reference Check →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================
   CREATOR PASSPORT HUB - THE MONEY MAKER
   =========================================== */
function CreatorPassportHub() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header - Dark & Bold */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)', padding: 32, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0 }}>🎬</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Creator Passport</h2>
              <span style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '4px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.03em' }}>NEW</span>
            </div>
            <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0, maxWidth: 500 }}>
              Stop looking like a bot. Prove you're real. Land brand deals.
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>R49</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>one-time</div>
          </div>
        </div>
      </div>

      {/* Stats Bar - The Pain */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #e2e8f0' }}>
        {[
          { value: 'R2B', label: 'Lost to fraud yearly', color: '#ef4444' },
          { value: '79%', label: 'Creator burnout rate', color: '#f59e0b' },
          { value: '1 in 4', label: 'Buy fake followers', color: '#ef4444' },
          { value: '55%', label: 'Engagement is fake', color: '#f59e0b' },
        ].map((stat, i) => (
          <div key={i} style={{ padding: '20px 24px', textAlign: 'center', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* The Problem - Raw & Honest */}
      <div style={{ padding: 24, background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '1.25rem' }}>🚫</span>
          <span style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.9rem' }}>Why brands ghost you</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            "They can't tell real creators from fakes",
            "Your media kit is just numbers anyone can buy",
            "They've been burned before — trust no one now",
            "You look exactly like the frauds. Same PDFs. Same claims."
          ].map((problem, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#7f1d1d' }}>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>×</span>
              <span>{problem}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The Solution - What We Do */}
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
          What Creator Passport Does
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { icon: '🎥', title: 'Video Authenticity', desc: 'AI analyzes your pitch video — eye contact, confidence, energy. Stuff bots can\'t fake.' },
            { icon: '✓', title: 'Verified Badge', desc: 'One link to share with brands. They see you\'re real. No more PDFs that never get opened.' },
            { icon: '🎯', title: 'Coaching Tips', desc: 'Specific feedback with timestamps. "At 0:23 you looked away — here\'s how to fix it."' },
            { icon: '🇿🇦', title: 'SA Context', desc: 'Understands local brands, accents, culture. Global tools don\'t get our market.' },
          ].map((feature, i) => (
            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{feature.icon}</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: 6 }}>{feature.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Passport Preview */}
      <div style={{ margin: '0 24px 24px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: 16, padding: 24, color: 'white' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: 16 }}>Example Creator Passport</div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>👤</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Thandi M.</span>
              <span style={{ background: '#10B981', padding: '3px 8px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700 }}>✓ VERIFIED</span>
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 12 }}>Lifestyle Creator • Cape Town • 45K followers</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Authenticity', score: 87 },
                { label: 'Confidence', score: 82 },
                { label: 'Energy', score: 91 },
              ].map((score, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 100, fontSize: '0.75rem' }}>
                  {score.label}: <strong>{score.score}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ margin: '0 24px 24px', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #a7f3d0', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#166534', fontSize: '1.1rem', marginBottom: 4 }}>Get your Creator Passport</div>
          <div style={{ fontSize: '0.9rem', color: '#15803d' }}>2 minutes. One video. Start getting deals.</div>
        </div>
        <button
          onClick={() => window.location.href = '/upload?mode=creator'}
          style={{ background: '#166534', color: 'white', border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          Start Verification →
        </button>
      </div>

      {/* How It Works */}
      <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>How it works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { num: 1, title: 'Record', desc: '60-second pitch video' },
            { num: 2, title: 'Analyze', desc: 'AI checks authenticity' },
            { num: 3, title: 'Get Badge', desc: 'Verified creator status' },
            { num: 4, title: 'Share', desc: 'One link for brands' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', marginBottom: 10 }}>{step.num}</div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem', marginBottom: 2 }}>{step.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon: Creator Inbox */}
      <div style={{ margin: 24, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fcd34d', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: '1.5rem' }}>📬</span>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '1rem' }}>Coming Soon: Creator Business Inbox</div>
            <div style={{ fontSize: '0.85rem', color: '#a16207' }}>R99/month — Manage brand deals, invoicing, and more</div>
          </div>
          <span style={{ marginLeft: 'auto', background: '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 }}>Q1 2025</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            'AI Deal Scanner — Spot good offers, flag bad ones',
            'Auto invoicing — Get paid faster',
            'Brand CRM — Track all conversations',
          ].map((feature, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#78350f' }}>
              <span style={{ color: '#f59e0b' }}>✓</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewRoleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [employmentType, setEmploymentType] = useState('full-time');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  // Step 2: Requirements
  const [minExp, setMinExp] = useState(2);
  const [requiredSkills, setRequiredSkills] = useState('');
  const [education, setEducation] = useState('any');
  const [hardRequirements, setHardRequirements] = useState('');

  // Step 3: Nice-to-haves
  const [preferredSkills, setPreferredSkills] = useState('');
  const [bonuses, setBonuses] = useState('');

  // Step 4: Full JD
  const [fullJD, setFullJD] = useState('');

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
            required_skills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
            preferred_skills: preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
            education: education,
            hard_requirements: hardRequirements,
            locations: location ? [location] : [],
            is_remote: isRemote,
          },
          facts: {
            employment_type: employmentType,
            salary_min: salaryMin ? parseInt(salaryMin) : null,
            salary_max: salaryMax ? parseInt(salaryMax) : null,
            location: location,
            is_remote: isRemote,
          },
          preferences: {
            bonuses: bonuses,
          },
          ai_guidance: {
            full_job_description: fullJD,
          }
        })
      });
      if (res.ok) onCreated();
    } catch (e) { console.error(e); alert('Failed to create role'); }
    setIsCreating(false);
  };

  const inputStyle = { width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 };
  const hintStyle = { fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Create New Role</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 16 }}>
            {[
              { num: 1, label: 'Basic Info' },
              { num: 2, label: 'Requirements' },
              { num: 3, label: 'Nice-to-haves' },
              { num: 4, label: 'Job Description' }
            ].map(s => (
              <div key={s.num} onClick={() => s.num <= step && setStep(s.num)} style={{ flex: 1, cursor: s.num <= step ? 'pointer' : 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: step >= s.num ? '#4F46E5' : '#e2e8f0', color: step >= s.num ? 'white' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.num}</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step >= s.num ? '#0f172a' : '#94a3b8' }}>{s.label}</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, backgroundColor: step >= s.num ? '#4F46E5' : '#e2e8f0' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Role Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sales Manager, Senior Developer" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Cape Town" style={inputStyle} disabled={isRemote} />
                </div>
                <div>
                  <label style={labelStyle}>Employment Type</label>
                  <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} style={{ ...inputStyle, background: 'white' }}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isRemote} onChange={e => { setIsRemote(e.target.checked); if (e.target.checked) setLocation(''); }} style={{ width: 18, height: 18, accentColor: '#4F46E5' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>This is a remote position</span>
                </label>
              </div>

              <div>
                <label style={labelStyle}>Salary Range (ZAR, optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="Min (e.g. 25000)" style={inputStyle} />
                  <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="Max (e.g. 45000)" style={inputStyle} />
                </div>
                <div style={hintStyle}>Monthly salary range helps filter candidates with mismatched expectations</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Minimum Experience *</label>
                <select value={minExp} onChange={e => setMinExp(parseInt(e.target.value))} style={{ ...inputStyle, background: 'white' }}>
                  <option value={0}>No minimum</option>
                  <option value={1}>1+ years</option>
                  <option value={2}>2+ years</option>
                  <option value={3}>3+ years</option>
                  <option value={5}>5+ years</option>
                  <option value={7}>7+ years</option>
                  <option value={10}>10+ years</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Required Skills *</label>
                <input type="text" value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="e.g. Sales, CRM, Cold calling, Negotiation" style={inputStyle} />
                <div style={hintStyle}>Comma-separated. Candidates without these will be marked as gaps.</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Education Requirement</label>
                <select value={education} onChange={e => setEducation(e.target.value)} style={{ ...inputStyle, background: 'white' }}>
                  <option value="any">Any / Not required</option>
                  <option value="matric">Matric / Grade 12</option>
                  <option value="diploma">Diploma / Certificate</option>
                  <option value="degree">Bachelor's Degree</option>
                  <option value="honours">Honours / Postgrad</option>
                  <option value="masters">Master's Degree</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Hard Requirements (Non-negotiables)</label>
                <textarea value={hardRequirements} onChange={e => setHardRequirements(e.target.value)} placeholder="e.g. Must have driver's license, Must be willing to travel 50%, Must have own transport" style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
                <div style={hintStyle}>One per line. These are dealbreakers — AI will flag candidates missing any of these.</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1rem' }}>💡</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>Nice-to-haves help, but don't disqualify</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#15803D', margin: 0, lineHeight: 1.5 }}>
                  Candidates with these get bonus points, but won't be rejected if missing.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Preferred Skills</label>
                <input type="text" value={preferredSkills} onChange={e => setPreferredSkills(e.target.value)} placeholder="e.g. HubSpot, Salesforce, LinkedIn Sales Navigator" style={inputStyle} />
                <div style={hintStyle}>Comma-separated. Nice to have, not required.</div>
              </div>

              <div>
                <label style={labelStyle}>Bonus Points / Other Preferences</label>
                <textarea value={bonuses} onChange={e => setBonuses(e.target.value)} placeholder="e.g. Experience in SaaS, Bilingual (English/Afrikaans), Existing book of business, Industry connections" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
                <div style={hintStyle}>Anything else that would make a candidate stand out</div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #C7D2FE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1rem' }}>🤖</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4338CA' }}>AI-powered matching</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#4F46E5', margin: 0, lineHeight: 1.5 }}>
                  Paste your full job description. Our AI will extract additional context to better match candidates.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Full Job Description (optional)</label>
                <textarea value={fullJD} onChange={e => setFullJD(e.target.value)} placeholder="Paste your complete job description here...

Example:
We are looking for a dynamic Sales Manager to join our growing team in Cape Town. You will be responsible for...

Responsibilities:
- Lead a team of 5 sales reps
- Achieve monthly targets of R500k
- Build relationships with key accounts
..." style={{ ...inputStyle, minHeight: 250, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                <div style={hintStyle}>The more detail you provide, the better the AI can match candidates</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{ padding: '12px 20px', background: 'white', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 1 && !title} style={{ padding: '12px 24px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', opacity: step === 1 && !title ? 0.5 : 1 }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={isCreating || !title} style={{ padding: '12px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', opacity: isCreating || !title ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              {isCreating ? 'Creating...' : '✓ Create Role'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

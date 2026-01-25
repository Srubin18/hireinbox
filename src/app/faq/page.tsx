'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';

// ============================================
// HIREINBOX - FAQ PAGE
// Simple, professional, comprehensive
// ============================================

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is HireInbox?',
    answer: 'HireInbox is an AI-powered recruitment platform built specifically for the South African market. We help employers screen CVs faster using explainable AI that shows its reasoning, and we help job seekers improve their CVs and interview skills. Our AI understands local qualifications like CA(SA), BCom degrees, and recognises South African companies and institutions.'
  },
  {
    question: 'How does CV screening work for employers?',
    answer: 'When candidates apply for your roles, their CVs flow into your HireInbox dashboard where our AI automatically screens them against your job requirements. Each candidate receives a score from 0-100 with detailed reasoning that explains exactly why they scored that way. You\'ll see a ranked shortlist with the AI\'s analysis of each candidate\'s strengths, potential gaps, and suggested interview focus areas - all backed by direct evidence quoted from the CV itself.'
  },
  {
    question: 'Can I use HireInbox with external job boards?',
    answer: 'Yes. When you post jobs on external job boards, you can direct applications to flow into HireInbox. CVs submitted through these channels will automatically appear in your dashboard for AI screening. This means you can advertise widely while keeping all your applications organised and screened in one central place.'
  },
  {
    question: 'What if I\'m hiring for multiple roles at once?',
    answer: 'HireInbox handles multiple concurrent roles seamlessly. Our AI intelligently routes applications to the correct role based on context. If it\'s ever unclear which role an application is for, it goes to an "Unassigned" queue where you can manually assign it. This works smoothly even if you have 10 or more positions open simultaneously.'
  },
  {
    question: 'What are AI Interviews and how do they work?',
    answer: 'AI Interviews are automated video interviews that candidates complete at their convenience. You set the questions, and candidates record their responses. Our AI then analyses each response for content quality, communication skills, confidence, and relevance to the role. You receive a detailed report with timestamps, key moments, and suggested follow-up questions for the live interview. This helps you pre-screen candidates before investing time in face-to-face meetings.'
  },
  {
    question: 'What is the Talent Pool?',
    answer: 'The Talent Pool is our opt-in marketplace where pre-screened candidates can be discovered by employers actively hiring. Job seekers complete their profile with a CV and optional video introduction, then choose to join the pool. Our AI matches them to relevant roles posted by employers. Candidate contact details remain private until they accept a connection request, giving them full control over who can reach them.'
  },
  {
    question: 'What verification services do you offer?',
    answer: 'We offer comprehensive candidate verification including ID verification to confirm identity, criminal record checks through official channels, and reference verification where we contact previous employers on your behalf. All verification results are documented and stored in your dashboard alongside the candidate\'s screening results, giving you a complete picture before making hiring decisions.'
  },
  {
    question: 'Is the CV scan free for job seekers?',
    answer: 'Yes. Every job seeker gets one free CV scan with detailed, actionable feedback on structure, clarity, presentation, and content. We show you exactly what\'s working well and what specific improvements would make the biggest difference. If you want to go further, premium services like personalised video analysis and professional CV rewriting are available.'
  },
  {
    question: 'How much does HireInbox cost for employers?',
    answer: 'We charge per role, not per CV, so you get predictable costs regardless of how many applications you receive. AI CV Screening is R1,750 per role and includes screening for up to 200 CVs. You can add AI Interviews for R1,250 per role, or add Verification services (ID, criminal checks, references) for R800 per role. The complete package with everything included is R3,800 per role.'
  },
  {
    question: 'Why do you charge per role instead of per CV?',
    answer: 'Because employers cannot control how many CVs they receive for a position. Per-CV pricing would penalise you for posting popular jobs or advertising effectively. Our per-role pricing gives you complete cost certainty - you know exactly what you\'ll pay before you start, whether you receive 10 applications or 200.'
  },
  {
    question: 'How much does it cost to use the Talent Pool?',
    answer: 'For job seekers, joining the Talent Pool is completely free. You create your profile, upload your CV, and get matched to relevant opportunities at no cost. For employers, posting a job to the Talent Pool costs R2,500 per listing. This gives you access to pre-screened candidates who have already been evaluated by our AI, saving you significant time in the initial screening process.'
  },
  {
    question: 'Is my data safe? Are you POPIA compliant?',
    answer: 'Yes. We take data protection seriously and are fully compliant with South Africa\'s Protection of Personal Information Act (POPIA). All data is stored securely with encryption. We maintain complete audit trails of all AI decisions, which is essential for POPIA compliance and allows you to explain any hiring decision if challenged. Candidate data is retained for 365 days and then automatically deleted. You or any candidate can request immediate data deletion at any time.'
  },
  {
    question: 'How does the AI make decisions? Can you explain them?',
    answer: 'Explainability is fundamental to how HireInbox works. Every AI recommendation includes the specific evidence it used to reach that conclusion: direct quotes from the CV, qualifications that were matched or missing, experience that aligned or fell short. This is not a black box. You can see exactly why each candidate scored the way they did, understand the reasoning, and confidently defend that decision to anyone who asks.'
  }
];

export default function FAQPage() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#4F46E5"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>
            <span style={{ color: '#0f172a' }}>Hire</span>
            <span style={{ color: '#4F46E5' }}>Inbox</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#475569',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Log in
          </button>
          <button
            onClick={() => router.push('/signup')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px' }}>
        <Breadcrumbs items={[{ label: 'FAQ' }]} />
      </div>

      {/* Hero */}
      <section style={{
        padding: '48px 32px 48px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '16px',
          letterSpacing: '-0.02em'
        }}>
          Frequently Asked Questions
        </h1>
        <p style={{
          fontSize: '17px',
          color: '#64748b',
          lineHeight: 1.6
        }}>
          Everything you need to know about HireInbox. Can&apos;t find what you&apos;re looking for?{' '}
          <a href="mailto:hello@hireinbox.co.za" style={{ color: '#4F46E5', textDecoration: 'none' }}>Get in touch</a>.
        </p>
      </section>

      {/* FAQ List */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 32px 80px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.2s'
              }}
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  backgroundColor: expandedIndex === index ? '#f8fafc' : '#ffffff',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <span style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0f172a',
                  lineHeight: 1.4
                }}>
                  {faq.question}
                </span>
                <span style={{
                  fontSize: '20px',
                  color: '#94a3b8',
                  transform: expandedIndex === index ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.2s',
                  flexShrink: 0
                }}>
                  +
                </span>
              </button>
              {expandedIndex === index && (
                <div style={{
                  padding: '0 24px 20px',
                  backgroundColor: '#f8fafc'
                }}>
                  <p style={{
                    fontSize: '15px',
                    color: '#475569',
                    lineHeight: 1.8,
                    margin: 0
                  }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '64px 32px',
        backgroundColor: '#f8fafc',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '16px'
        }}>
          Still have questions?
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          marginBottom: '32px'
        }}>
          Our team is here to help. Get in touch and we&apos;ll respond within 24 hours.
        </p>
        <a
          href="mailto:hello@hireinbox.co.za"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Contact Us
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px',
        borderTop: '1px solid #f1f5f9',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
          HireInbox · 2026 · Built in South Africa
        </p>
      </footer>
    </div>
  );
}

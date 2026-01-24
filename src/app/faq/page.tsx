'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - FAQ PAGE
// Professional, comprehensive, builds trust
// ============================================

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'employers' | 'candidates' | 'pricing' | 'security';
}

const faqs: FAQItem[] = [
  // General
  {
    category: 'general',
    question: 'What is HireInbox?',
    answer: 'HireInbox is an AI-powered recruitment platform built for the South African market. We help employers screen CVs faster with explainable AI, and help job seekers improve their CVs and interview skills. Our AI understands local qualifications like CA(SA), BCom degrees, and South African companies.'
  },
  {
    category: 'general',
    question: 'How is HireInbox different from other recruitment tools?',
    answer: 'Three key differences: First, our AI provides evidence-based reasoning - every recommendation includes quotes from the CV explaining why. Second, we\'re built specifically for South Africa, understanding local qualifications and context. Third, we\'re inbox-native - work where you already work, not in another system to learn.'
  },
  // Employers
  {
    category: 'employers',
    question: 'How does CV screening work?',
    answer: 'When candidates email their CVs to your HireInbox address, our AI automatically screens them against your job requirements. Each candidate receives a score (0-100) with detailed reasoning. You\'ll see a ranked shortlist with the AI\'s analysis of strengths, gaps, and interview focus areas - all backed by evidence from the CV.'
  },
  {
    category: 'employers',
    question: 'Can I use HireInbox with job boards like Careers24 or Gumtree?',
    answer: 'Yes. When posting jobs on Gumtree or Careers24, use your HireInbox email address as the application email. CVs will flow directly into HireInbox for AI screening. Note: LinkedIn and PNet use their own messaging systems, so applications from those platforms would need to be forwarded manually.'
  },
  {
    category: 'employers',
    question: 'What if I\'m hiring for multiple roles at once?',
    answer: 'HireInbox handles this seamlessly. Our AI reads the email subject line to match applications to the correct role. If it\'s unclear which role an application is for, it goes to an "Unassigned" queue where you can manually assign it. This works even if you have 10+ roles open simultaneously.'
  },
  // Candidates
  {
    category: 'candidates',
    question: 'Is the CV scan really free?',
    answer: 'Yes. Every job seeker gets one free CV scan with detailed feedback on structure, clarity, and ATS compatibility. We\'ll show you exactly what\'s working and what to improve. Premium services like video analysis and CV rewriting are available if you want to go further.'
  },
  {
    category: 'candidates',
    question: 'What is the Talent Pool?',
    answer: 'The Talent Pool is our opt-in marketplace where vetted candidates can be discovered by employers. After completing your profile (CV + optional video), you can choose to join the Talent Pool. Our AI matches you to relevant roles posted by employers on HireInbox. Your contact details stay private until you accept a connection.'
  },
  // Pricing
  {
    category: 'pricing',
    question: 'How much does HireInbox cost for employers?',
    answer: 'We charge per role, not per CV - so you\'re never penalised for receiving many applications. AI CV Screening is R1,750 per role (unlimited CVs). Add AI Interviews for R1,250 per role. Add Verification (ID, criminal, references) for R800 per role. The full package is R3,800 per role.'
  },
  {
    category: 'pricing',
    question: 'Why do you charge per role instead of per CV?',
    answer: 'Because employers can\'t control how many CVs they receive. A popular job might get 200 applications - you shouldn\'t be charged more for that. Per-role pricing gives you predictable costs and unlimited screening for each position you\'re filling.'
  },
  // Security
  {
    category: 'security',
    question: 'Is my data safe? Are you POPIA compliant?',
    answer: 'Yes. We take data protection seriously. All data is stored securely in South Africa-accessible servers. We maintain full audit trails of all AI decisions (required for POPIA compliance). Candidate data is retained for 365 days then automatically deleted. You can request data deletion at any time.'
  },
  {
    category: 'security',
    question: 'How does the AI make decisions? Can you explain them?',
    answer: 'Absolutely - explainability is core to HireInbox. Every AI recommendation includes the specific evidence it used: quotes from the CV, qualifications matched, experience gaps identified. This isn\'t a black box. You can see exactly why each candidate scored the way they did, and defend that decision if challenged.'
  }
];

const categories = [
  { id: 'all', label: 'All Questions' },
  { id: 'general', label: 'General' },
  { id: 'employers', label: 'For Employers' },
  { id: 'candidates', label: 'For Job Seekers' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'security', label: 'Security & Privacy' }
];

export default function FAQPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

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
          onClick={() => router.push('/home')}
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

      {/* Hero */}
      <section style={{
        padding: '64px 32px 48px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '16px',
          letterSpacing: '-0.02em'
        }}>
          Frequently Asked Questions
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          lineHeight: 1.6
        }}>
          Everything you need to know about HireInbox. Can't find what you're looking for? <a href="mailto:hello@hireinbox.co.za" style={{ color: '#4F46E5', textDecoration: 'none' }}>Get in touch</a>.
        </p>
      </section>

      {/* Category Filter */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 32px 32px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: activeCategory === cat.id ? '#4F46E5' : '#f1f5f9',
                color: activeCategory === cat.id ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* FAQ List */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 32px 80px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredFaqs.map((faq, index) => (
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
                  transition: 'transform 0.2s'
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
                    lineHeight: 1.7,
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
          Our team is here to help. Get in touch and we'll respond within 24 hours.
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

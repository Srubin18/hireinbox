'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - AI STAFF MEMBER
// A trained AI employee for ANY department
// NOT recruitment - actual business operations
// R15,000/month for 88 hours
// ============================================

export default function AIStaffPage() {
  const router = useRouter();
  const [showContactForm, setShowContactForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const departments = [
    {
      name: 'Credit Control',
      description: 'Chase outstanding invoices, send payment reminders, negotiate payment plans, update accounts receivable.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      )
    },
    {
      name: 'Sales & Lead Generation',
      description: 'Qualify inbound leads, follow up on enquiries, book appointments, nurture prospects through the pipeline.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
      )
    },
    {
      name: 'Customer Service',
      description: 'Handle support tickets, answer FAQs, resolve complaints, escalate complex issues to your team.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    {
      name: 'Finance & Accounts',
      description: 'Process invoices, reconcile statements, answer supplier queries, assist with month-end reporting.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      )
    },
    {
      name: 'Admin & Operations',
      description: 'Schedule meetings, manage calendars, coordinate logistics, handle internal requests.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      )
    },
    {
      name: 'Marketing',
      description: 'Respond to social media comments, manage email campaigns, gather market research, create reports.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      )
    },
    {
      name: 'Procurement',
      description: 'Get quotes from suppliers, compare pricing, track orders, manage vendor relationships.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      )
    },
    {
      name: 'IT Support',
      description: 'Troubleshoot common issues, guide users through solutions, log tickets, manage password resets.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      )
    }
  ];

  const personalities = [
    { name: 'Naledi', gender: 'Female', style: 'Professional & Warm', color: '#ec4899' },
    { name: 'Thabo', gender: 'Male', style: 'Confident & Friendly', color: '#3b82f6' },
    { name: 'Lerato', gender: 'Female', style: 'Energetic & Approachable', color: '#ec4899' },
    { name: 'Sipho', gender: 'Male', style: 'Calm & Authoritative', color: '#3b82f6' },
    { name: 'Nomsa', gender: 'Female', style: 'Patient & Helpful', color: '#ec4899' },
    { name: 'Mandla', gender: 'Male', style: 'Direct & Efficient', color: '#3b82f6' },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Tell Us About Your Business',
      description: 'We learn everything about your company — products, services, processes, systems, and the way you do things. Your AI will sound and act like a real member of your team.'
    },
    {
      step: '02',
      title: 'Train for Your Department',
      description: 'Whether it\'s Credit Control, Sales, Customer Service or Finance — we train your AI specifically for that function. It learns your policies, procedures, pricing, and how to handle every situation.'
    },
    {
      step: '03',
      title: 'Choose Your Personality',
      description: 'Pick from our range of AI personalities — male or female, warm or professional, energetic or calm. Your AI staff member will represent your brand exactly how you want.'
    },
    {
      step: '04',
      title: 'Deploy & Monitor',
      description: 'Your AI starts working immediately — handling calls, emails, chats, and tasks. You get full visibility into every interaction and can adjust as needed.'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 32px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#4F46E5"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              <span style={{ color: '#0f172a' }}>Hire</span>
              <span style={{ color: '#4F46E5' }}>Inbox</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Less noise. More hires.</div>
          </div>
        </div>
        <button
          onClick={() => router.push('/hire/dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </header>

      {/* Hero */}
      <section style={{
        padding: '80px 32px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#10b981',
          color: '#ffffff',
          padding: '8px 20px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '32px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          New from HireInbox
        </div>

        <h1 style={{
          fontSize: '52px',
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: '24px',
          lineHeight: 1.15,
          maxWidth: '900px',
          margin: '0 auto 24px'
        }}>
          Get an AI Staff Member for Any Department
        </h1>

        <p style={{
          fontSize: '20px',
          color: '#475569',
          maxWidth: '700px',
          margin: '0 auto 48px',
          lineHeight: 1.7
        }}>
          A real AI employee trained on <strong>your company</strong> and <strong>your specific department</strong>.
          From Credit Control to Customer Service — your AI handles the work so your team can focus on what matters.
        </p>

        {/* Pricing Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '48px',
          maxWidth: '500px',
          margin: '0 auto',
          boxShadow: '0 25px 80px rgba(79, 70, 229, 0.15)',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '15px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>Monthly Investment</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px', color: '#64748b' }}>R</span>
            <span style={{ fontSize: '64px', fontWeight: 800, color: '#0f172a' }}>15,000</span>
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '32px' }}>excluding VAT</div>

          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#059669' }}>88 hours</div>
                <div style={{ fontSize: '14px', color: '#10b981' }}>of AI work per month</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowContactForm(true)}
            style={{
              width: '100%',
              padding: '18px 32px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Get Your AI Staff Member
          </button>

          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '20px' }}>
            Fully trained on your business. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Departments */}
      <section style={{ padding: '80px 32px', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Any Department. Any Function.
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Your AI staff member can be trained for any area of your business
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {departments.map((dept, i) => (
              <div key={i} style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s'
              }}>
                <div style={{ marginBottom: '16px' }}>{dept.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                  {dept.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  {dept.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personalities */}
      <section style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Choose Your AI Personality
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Pick a male or female avatar with a personality that fits your brand
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '20px'
          }}>
            {personalities.map((p, i) => (
              <div key={i} style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: p.gender === 'Female' ? '#fce7f3' : '#dbeafe',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: p.color, fontWeight: 600, marginBottom: '4px' }}>{p.gender}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{p.style}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 32px', backgroundColor: '#0f172a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '56px'
          }}>
            How It Works
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {howItWorks.map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'flex-start',
                padding: '28px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {step.step}
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '16px'
        }}>
          Ready to Add to Your Team?
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          marginBottom: '32px',
          maxWidth: '500px',
          margin: '0 auto 32px'
        }}>
          Get an AI staff member trained on your business in as little as one week.
        </p>
        <button
          onClick={() => setShowContactForm(true)}
          style={{
            padding: '18px 48px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '17px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Get Started Today
        </button>
      </section>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowContactForm(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {!formSubmitted ? (
              <>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Get Your AI Staff Member
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                  Tell us about your business and which department you need help with.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); setFormSubmitted(true); }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Your Email *
                    </label>
                    <input
                      type="email"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Which department do you need help with? *
                    </label>
                    <select
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="">Select a department</option>
                      <option value="credit-control">Credit Control</option>
                      <option value="sales">Sales & Lead Generation</option>
                      <option value="customer-service">Customer Service</option>
                      <option value="finance">Finance & Accounts</option>
                      <option value="admin">Admin & Operations</option>
                      <option value="marketing">Marketing</option>
                      <option value="procurement">Procurement</option>
                      <option value="it-support">IT Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: '#4F46E5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Request AI Staff Member
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#d1fae5',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                  Request Received!
                </h3>
                <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px' }}>
                  We'll be in touch within 24 hours to discuss your AI staff member.
                </p>
                <button
                  onClick={() => { setShowContactForm(false); setFormSubmitted(false); }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '24px 32px',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '13px'
      }}>
        HireInbox — Less noise. More hires.
      </footer>
    </div>
  );
}

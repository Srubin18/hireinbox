'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2B - BUSINESS ACCOUNT SETUP
// /hire/business
//
// Flow:
// 1. Account setup (company details)
// 2. Generate unique inbox: companyname@hireinbox.co.za
// 3. Role creation (conversational)
// 4. Optional upsells
// 5. Billing
// ============================================

interface CompanyDetails {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  vatNumber: string;
}

interface RoleDetails {
  industry: string;
  title: string;
  location: string;
  employmentType: string;
  salary: string;
  experience: string;
  description: string;
}

type Step = 'account' | 'role' | 'upsells' | 'billing' | 'complete';

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Less noise. More hires.</div>
    </div>
  </div>
);

const generateInboxEmail = (companyName: string): string => {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return `${slug}@hireinbox.co.za`;
};

export default function BusinessSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('account');
  const [company, setCompany] = useState<CompanyDetails>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    vatNumber: ''
  });
  const [role, setRole] = useState<RoleDetails>({
    industry: '',
    title: '',
    location: '',
    employmentType: '',
    salary: '',
    experience: '',
    description: ''
  });
  const [generatedInbox, setGeneratedInbox] = useState('');
  const [upsells, setUpsells] = useState({
    aiInterview: false,
    idVerification: false,
    criminalCheck: false,
    creditCheck: false,
    referenceCheck: false
  });
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'ai' | 'user'; content: string }>>([
    { role: 'ai', content: "Hi! I'm here to help you create a role. Tell me about the position you're hiring for - what kind of person are you looking for?" }
  ]);
  const [userInput, setUserInput] = useState('');

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#ffffff'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px'
  };

  const primaryButtonStyle = {
    padding: '14px 32px',
    backgroundColor: '#4F46E5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const secondaryButtonStyle = {
    padding: '14px 32px',
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inbox = generateInboxEmail(company.companyName);
    setGeneratedInbox(inbox);
    setStep('role');
  };

  const handleAiChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessages = [
      ...aiMessages,
      { role: 'user' as const, content: userInput }
    ];

    // Simulate AI response - in production this would call the API
    const aiResponse = generateAiResponse(userInput, role);
    newMessages.push({ role: 'ai' as const, content: aiResponse.message });

    if (aiResponse.extractedData) {
      setRole(prev => ({ ...prev, ...aiResponse.extractedData }));
    }

    setAiMessages(newMessages);
    setUserInput('');
  };

  const generateAiResponse = (input: string, currentRole: RoleDetails): { message: string; extractedData?: Partial<RoleDetails> } => {
    const inputLower = input.toLowerCase();

    // Simple extraction logic - in production this would be AI-powered
    const extractedData: Partial<RoleDetails> = {};

    // Extract role title
    const rolePatterns = [
      /(?:looking for|need|hiring|seeking)\s+(?:a|an)?\s*([a-z\s]+?)(?:\s+in|\s+for|\s+with|$)/i,
      /([a-z\s]+?)\s+(?:role|position|job)/i
    ];
    for (const pattern of rolePatterns) {
      const match = input.match(pattern);
      if (match && !currentRole.title) {
        extractedData.title = match[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }

    // Extract location
    const locationPatterns = [
      /(?:in|based in|located in|at)\s+([a-z\s,]+?)(?:\.|,|$)/i,
      /(cape town|johannesburg|durban|pretoria|remote|hybrid)/i
    ];
    for (const pattern of locationPatterns) {
      const match = input.match(pattern);
      if (match && !currentRole.location) {
        extractedData.location = match[1].trim();
        break;
      }
    }

    // Extract experience
    const expMatch = input.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (expMatch && !currentRole.experience) {
      extractedData.experience = `${expMatch[1]}+ years`;
    }

    // Store description
    if (!currentRole.description) {
      extractedData.description = input;
    } else {
      extractedData.description = currentRole.description + ' ' + input;
    }

    // Generate contextual response
    let message = '';
    if (!currentRole.title && extractedData.title) {
      message = `Got it - you're looking for a ${extractedData.title}. `;
    }
    if (!currentRole.location && extractedData.location) {
      message += `Based in ${extractedData.location}. `;
    }
    if (!currentRole.experience && extractedData.experience) {
      message += `With ${extractedData.experience} experience. `;
    }

    // Ask follow-up questions
    const missingFields = [];
    if (!currentRole.title && !extractedData.title) missingFields.push('role title');
    if (!currentRole.location && !extractedData.location) missingFields.push('location');
    if (!currentRole.industry && !extractedData.industry) missingFields.push('industry');

    if (missingFields.length > 0 && message) {
      message += `\n\nCould you also tell me about the ${missingFields.slice(0, 2).join(' and ')}?`;
    } else if (missingFields.length > 0) {
      message = `Thanks for that context. Could you tell me about the ${missingFields.slice(0, 2).join(' and ')}?`;
    } else if (message) {
      message += '\n\nThat sounds good! Anything else you want to add, or shall we proceed?';
    } else {
      message = "Thanks - I've noted that. Is there anything else you'd like to add about the ideal candidate, or shall we move forward?";
    }

    return { message, extractedData };
  };

  const renderAccountStep = () => (
    <form onSubmit={handleAccountSubmit} style={{ width: '100%', maxWidth: '500px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
        Set up your account
      </h2>
      <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px' }}>
        We'll create a unique inbox for receiving CVs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Company name *</label>
          <input
            type="text"
            value={company.companyName}
            onChange={(e) => setCompany(prev => ({ ...prev, companyName: e.target.value }))}
            style={inputStyle}
            placeholder="Acme Corporation"
            required
          />
          {company.companyName && (
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#4F46E5' }}>
              Your inbox: {generateInboxEmail(company.companyName)}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Contact person *</label>
          <input
            type="text"
            value={company.contactPerson}
            onChange={(e) => setCompany(prev => ({ ...prev, contactPerson: e.target.value }))}
            style={inputStyle}
            placeholder="John Smith"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Email address *</label>
          <input
            type="email"
            value={company.email}
            onChange={(e) => setCompany(prev => ({ ...prev, email: e.target.value }))}
            style={inputStyle}
            placeholder="john@acme.com"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Phone number *</label>
          <input
            type="tel"
            value={company.phone}
            onChange={(e) => setCompany(prev => ({ ...prev, phone: e.target.value }))}
            style={inputStyle}
            placeholder="+27 82 123 4567"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>VAT number (optional)</label>
          <input
            type="text"
            value={company.vatNumber}
            onChange={(e) => setCompany(prev => ({ ...prev, vatNumber: e.target.value }))}
            style={inputStyle}
            placeholder="4123456789"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        <button
          type="button"
          onClick={() => router.push('/hire')}
          style={secondaryButtonStyle}
        >
          Back
        </button>
        <button type="submit" style={{ ...primaryButtonStyle, flex: 1 }}>
          Continue
        </button>
      </div>
    </form>
  );

  const renderRoleStep = () => (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '20px' }}>📧</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>Your CV inbox is ready</div>
          <div style={{ fontSize: '15px', color: '#166534', fontFamily: 'monospace' }}>{generatedInbox}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
        Tell us about the role
      </h2>
      <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px' }}>
        Describe the person you're looking for in your own words.
      </p>

      {/* AI Chat Interface */}
      <div style={{
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        {/* Messages */}
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#f8fafc'
        }}>
          {aiMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px'
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? '#4F46E5' : '#ffffff',
                color: msg.role === 'user' ? '#ffffff' : '#0f172a',
                fontSize: '14px',
                lineHeight: 1.5,
                boxShadow: msg.role === 'ai' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'pre-line'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleAiChat} style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe the ideal candidate..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 20px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Extracted role details */}
      {(role.title || role.location || role.experience) && (
        <div style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #e9d5ff',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed', marginBottom: '12px' }}>
            Role details captured:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {role.title && (
              <span style={{ backgroundColor: '#ede9fe', color: '#5b21b6', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                {role.title}
              </span>
            )}
            {role.location && (
              <span style={{ backgroundColor: '#ede9fe', color: '#5b21b6', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                {role.location}
              </span>
            )}
            {role.experience && (
              <span style={{ backgroundColor: '#ede9fe', color: '#5b21b6', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                {role.experience}
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setStep('account')}
          style={secondaryButtonStyle}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep('upsells')}
          style={{ ...primaryButtonStyle, flex: 1 }}
          disabled={!role.title}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderUpsellsStep = () => {
    const upsellOptions = [
      { id: 'aiInterview', label: 'AI Interview', description: 'Automated video interviews with transcripts and summaries', price: 'R1,250/role' },
      { id: 'idVerification', label: 'ID Verification', description: 'Verify candidate identity documents', price: 'R200/candidate' },
      { id: 'criminalCheck', label: 'Criminal Check', description: 'Background criminal record check', price: 'R350/candidate' },
      { id: 'creditCheck', label: 'Credit Check', description: 'Financial background verification', price: 'R150/candidate' },
      { id: 'referenceCheck', label: 'Reference Checking', description: 'Automated reference verification', price: 'R200/candidate' }
    ];

    return (
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Optional add-ons
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px' }}>
          Enhance your hiring process with these optional services.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {upsellOptions.map((option) => (
            <label
              key={option.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                border: `2px solid ${upsells[option.id as keyof typeof upsells] ? '#4F46E5' : '#e2e8f0'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: upsells[option.id as keyof typeof upsells] ? '#faf5ff' : '#ffffff',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="checkbox"
                checked={upsells[option.id as keyof typeof upsells]}
                onChange={(e) => setUpsells(prev => ({ ...prev, [option.id]: e.target.checked }))}
                style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: '#4F46E5' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{option.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#4F46E5' }}>{option.price}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setStep('role')}
            style={secondaryButtonStyle}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep('billing')}
            style={{ ...primaryButtonStyle, flex: 1 }}
          >
            Continue to billing
          </button>
        </div>
      </div>
    );
  };

  const renderBillingStep = () => (
    <div style={{ width: '100%', maxWidth: '500px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
        Billing
      </h2>
      <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px' }}>
        Choose how you'd like to pay.
      </p>

      {/* Order summary */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Order summary</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>AI CV Screening ({role.title || 'Role'})</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>R1,750</span>
          </div>
          {upsells.aiInterview && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#64748b' }}>AI Interview</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>R1,250</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>Total</span>
            <span style={{ fontWeight: 700, color: '#4F46E5', fontSize: '18px' }}>
              R{(1750 + (upsells.aiInterview ? 1250 : 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        <button
          type="button"
          style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => {
            // In production: redirect to card payment
            setStep('complete');
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Pay by card</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Visa, Mastercard, or Amex</div>
        </button>

        <button
          type="button"
          style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => {
            // In production: generate invoice
            setStep('complete');
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Request invoice</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>We'll email a VAT invoice for EFT payment</div>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setStep('upsells')}
        style={secondaryButtonStyle}
      >
        Back
      </button>
    </div>
  );

  const renderCompleteStep = () => (
    <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
      <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
        You're all set!
      </h2>
      <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px', lineHeight: 1.6 }}>
        Start receiving CVs at your dedicated inbox:
      </p>

      <div style={{
        backgroundColor: '#f0fdf4',
        border: '2px solid #86efac',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#166534', fontFamily: 'monospace' }}>
          {generatedInbox}
        </div>
        <div style={{ fontSize: '13px', color: '#166534', marginTop: '8px' }}>
          Share this email in your job postings
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push('/hire/dashboard')}
        style={{ ...primaryButtonStyle, width: '100%' }}
      >
        Go to dashboard
      </button>
    </div>
  );

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
        <Logo />
        <button
          onClick={() => router.push('/hire')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </header>

      {/* Progress indicator */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid #f1f5f9',
        backgroundColor: '#fafafa'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          {['Account', 'Role', 'Add-ons', 'Billing'].map((label, i) => {
            const steps: Step[] = ['account', 'role', 'upsells', 'billing'];
            const currentIndex = steps.indexOf(step);
            const isComplete = i < currentIndex || step === 'complete';
            const isCurrent = steps[i] === step;

            return (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isComplete ? '#10B981' : isCurrent ? '#4F46E5' : '#e2e8f0',
                  color: (isComplete || isCurrent) ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  {isComplete ? '✓' : i + 1}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: isCurrent ? '#4F46E5' : '#64748b',
                  marginTop: '8px'
                }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main style={{
        padding: '48px 32px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {step === 'account' && renderAccountStep()}
        {step === 'role' && renderRoleStep()}
        {step === 'upsells' && renderUpsellsStep()}
        {step === 'billing' && renderBillingStep()}
        {step === 'complete' && renderCompleteStep()}
      </main>

      {/* Support button */}
      <button
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: 'none',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <span>💬</span> Support
      </button>
    </div>
  );
}

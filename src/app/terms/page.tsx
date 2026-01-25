'use client';

import Link from 'next/link';

/* ===========================================
   HIREINBOX - TERMS OF SERVICE PAGE
   South African Law Jurisdiction
   =========================================== */

// Logo Component
const Logo = ({ size = 32 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: size > 28 ? '1.15rem' : '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>Less noise. Better hires.</span>
    </div>
  </div>
);

export default function TermsPage() {
  const lastUpdated = '25 January 2026';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size={36} />
          </Link>
          <nav style={{ display: 'flex', gap: 24 }}>
            <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Home</Link>
            <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Privacy Policy</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {/* Title Section */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 12,
            letterSpacing: '-0.02em'
          }}>
            Terms of Service
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: '40px 48px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          lineHeight: 1.7
        }}>
          {/* Introduction */}
          <section style={{ marginBottom: 32 }}>
            <p style={{ color: '#475569', fontSize: '1.05rem' }}>
              Welcome to HireInbox. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the HireInbox platform, website, and services (collectively, the &quot;Service&quot;) operated by HireInbox (Pty) Ltd (&quot;HireInbox&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </p>
            <p style={{ color: '#475569', fontSize: '1.05rem', marginTop: 16 }}>
              By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
            </p>
          </section>

          {/* Section 1 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              1. Service Description
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              HireInbox is an AI-powered recruitment platform that provides:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong>For Employers (B2B):</strong> Automated CV screening, candidate ranking, and recruitment workflow tools.</li>
              <li style={{ marginBottom: 8 }}><strong>For Job Seekers (B2C):</strong> CV analysis, improvement suggestions, and career insights.</li>
              <li style={{ marginBottom: 8 }}><strong>AI-Powered Analysis:</strong> Machine learning algorithms that evaluate CVs against job requirements.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              2. Eligibility and Account Registration
            </h2>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>You must be at least 18 years old to use our Service.</li>
              <li style={{ marginBottom: 8 }}>You must provide accurate and complete information when creating an account.</li>
              <li style={{ marginBottom: 8 }}>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li style={{ marginBottom: 8 }}>You are responsible for all activities that occur under your account.</li>
              <li style={{ marginBottom: 8 }}>You must notify us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              3. User Responsibilities
            </h2>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              3.1 General Obligations
            </h3>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              When using our Service, you agree to:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24, marginBottom: 16 }}>
              <li style={{ marginBottom: 8 }}>Provide accurate, current, and complete information.</li>
              <li style={{ marginBottom: 8 }}>Use the Service only for lawful purposes.</li>
              <li style={{ marginBottom: 8 }}>Not interfere with or disrupt the Service or servers.</li>
              <li style={{ marginBottom: 8 }}>Not attempt to gain unauthorized access to any part of the Service.</li>
              <li style={{ marginBottom: 8 }}>Comply with all applicable laws and regulations.</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              3.2 For Employers
            </h3>
            <ul style={{ color: '#475569', paddingLeft: 24, marginBottom: 16 }}>
              <li style={{ marginBottom: 8 }}>You must not use the Service to discriminate against candidates based on race, gender, religion, disability, or other protected characteristics.</li>
              <li style={{ marginBottom: 8 }}>You are solely responsible for all hiring decisions. AI recommendations are advisory only.</li>
              <li style={{ marginBottom: 8 }}>You must comply with the Employment Equity Act and other applicable employment laws.</li>
              <li style={{ marginBottom: 8 }}>You must handle candidate data in accordance with POPIA.</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              3.3 For Job Seekers
            </h3>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>You must submit only your own CV and accurate information.</li>
              <li style={{ marginBottom: 8 }}>You must not submit fraudulent or misleading documents.</li>
              <li style={{ marginBottom: 8 }}>You understand that CV analysis is based on the information you provide.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              4. Prohibited Activities
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              You agree not to:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>Upload any content that is unlawful, harmful, defamatory, or infringing.</li>
              <li style={{ marginBottom: 8 }}>Use automated scripts, bots, or scrapers to access the Service.</li>
              <li style={{ marginBottom: 8 }}>Reverse engineer or attempt to extract the source code of our software.</li>
              <li style={{ marginBottom: 8 }}>Resell or redistribute the Service without our authorization.</li>
              <li style={{ marginBottom: 8 }}>Upload viruses, malware, or other harmful code.</li>
              <li style={{ marginBottom: 8 }}>Impersonate another person or entity.</li>
              <li style={{ marginBottom: 8 }}>Use the Service to send spam or unsolicited communications.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              5. Intellectual Property
            </h2>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong>Our IP:</strong> The Service, including all software, algorithms, designs, and content, is owned by HireInbox and protected by intellectual property laws.</li>
              <li style={{ marginBottom: 8 }}><strong>Your Content:</strong> You retain ownership of the content you upload (e.g., CVs). By uploading, you grant us a license to use this content to provide and improve the Service.</li>
              <li style={{ marginBottom: 8 }}><strong>Feedback:</strong> Any feedback or suggestions you provide may be used by us without obligation to you.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              6. Payment Terms
            </h2>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>Paid features are billed as described at the time of purchase.</li>
              <li style={{ marginBottom: 8 }}>All prices are in South African Rand (ZAR) unless otherwise stated.</li>
              <li style={{ marginBottom: 8 }}>Subscription fees are billed in advance and are non-refundable.</li>
              <li style={{ marginBottom: 8 }}>We may change our pricing with 30 days&apos; notice.</li>
              <li style={{ marginBottom: 8 }}>Failure to pay may result in suspension or termination of your account.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              7. Disclaimers and Limitations of Liability
            </h2>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              7.1 AI Disclaimer
            </h3>
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <p style={{ color: '#92400E', fontSize: '0.95rem', margin: 0 }}>
                <strong>Important:</strong> Our AI-powered analysis is provided &quot;as is&quot; and is intended to assist, not replace, human judgment. We do not guarantee the accuracy of AI recommendations. Employers must independently verify candidate qualifications and make their own hiring decisions.
              </p>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              7.2 Service Availability
            </h3>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              7.3 Limitation of Liability
            </h3>
            <p style={{ color: '#475569', marginBottom: 8 }}>
              To the maximum extent permitted by South African law:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>HireInbox shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
              <li style={{ marginBottom: 8 }}>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</li>
              <li style={{ marginBottom: 8 }}>We are not liable for any employment decisions made based on our AI recommendations.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              8. Indemnification
            </h2>
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <p style={{ color: '#DC2626', fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>
                IMPORTANT: Please read this section carefully.
              </p>
            </div>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              To the maximum extent permitted by South African law, you agree to indemnify, defend, and hold harmless HireInbox (Pty) Ltd, its parent companies, subsidiaries, affiliates, and their respective officers, directors, employees, agents, partners, and licensors (collectively, the &quot;Indemnified Parties&quot;) from and against any and all claims, demands, actions, losses, damages, costs, liabilities, and expenses (including but not limited to reasonable attorneys&apos; fees, court costs, and expert witness fees) arising out of or relating to:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24, marginBottom: 16 }}>
              <li style={{ marginBottom: 8 }}>Your use or misuse of the Service;</li>
              <li style={{ marginBottom: 8 }}>Your violation of these Terms;</li>
              <li style={{ marginBottom: 8 }}>Any hiring, employment, or recruitment decisions you make, whether or not based on information provided by the Service;</li>
              <li style={{ marginBottom: 8 }}>Any content or information you submit, post, or transmit through the Service;</li>
              <li style={{ marginBottom: 8 }}>Your violation of any law or the rights of any third party;</li>
              <li style={{ marginBottom: 8 }}>Any claims by candidates, employees, or applicants related to your use of the Service;</li>
              <li style={{ marginBottom: 8 }}>Claims arising from alleged discrimination, unfair labor practices, or violation of employment laws;</li>
              <li style={{ marginBottom: 8 }}>Any unauthorized access to or use of our servers and/or any personal information stored therein;</li>
              <li style={{ marginBottom: 8 }}>Any claim relating to the accuracy, reliability, or completeness of AI-generated recommendations.</li>
            </ul>
            <p style={{ color: '#475569' }}>
              This indemnification obligation shall survive the termination of your account or these Terms. HireInbox reserves the right, at its own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you will cooperate with us in asserting any available defenses.
            </p>
          </section>

          {/* Section 9 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              9. Termination
            </h2>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>You may terminate your account at any time by contacting us.</li>
              <li style={{ marginBottom: 8 }}>We may suspend or terminate your access for violation of these Terms.</li>
              <li style={{ marginBottom: 8 }}>Upon termination, your right to use the Service ceases immediately.</li>
              <li style={{ marginBottom: 8 }}>Data retention after termination is governed by our Privacy Policy.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              10. Dispute Resolution
            </h2>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              10.1 Governing Law
            </h3>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              These Terms are governed by and construed in accordance with the laws of the Republic of South Africa.
            </p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              10.2 Jurisdiction
            </h3>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of the Western Cape, South Africa.
            </p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              10.3 Informal Resolution
            </h3>
            <p style={{ color: '#475569' }}>
              Before initiating legal proceedings, you agree to contact us and attempt to resolve any dispute informally within 30 days.
            </p>
          </section>

          {/* Section 11 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              11. Consumer Protection
            </h2>
            <p style={{ color: '#475569' }}>
              These Terms do not exclude, restrict, or modify any consumer rights under the Consumer Protection Act 68 of 2008 that cannot be excluded, restricted, or modified by agreement.
            </p>
          </section>

          {/* Section 12 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              12. Changes to Terms
            </h2>
            <p style={{ color: '#475569' }}>
              We may update these Terms from time to time. Material changes will be communicated via email or prominent notice on our Service. Your continued use after changes become effective constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Section 13 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              13. General Provisions
            </h2>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and HireInbox.</li>
              <li style={{ marginBottom: 8 }}><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions continue in effect.</li>
              <li style={{ marginBottom: 8 }}><strong>Waiver:</strong> Our failure to enforce any right does not waive that right.</li>
              <li style={{ marginBottom: 8 }}><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent.</li>
            </ul>
          </section>

          {/* Section 14 */}
          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              14. Contact Us
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              For questions about these Terms, please contact us:
            </p>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              padding: 20,
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ color: '#475569', margin: 0, marginBottom: 8 }}>
                <strong>HireInbox (Pty) Ltd</strong>
              </p>
              <p style={{ color: '#475569', margin: 0, marginBottom: 8 }}>
                Email: <a href="mailto:legal@hireinbox.co.za" style={{ color: '#4F46E5' }}>legal@hireinbox.co.za</a>
              </p>
              <p style={{ color: '#475569', margin: 0 }}>
                Cape Town, South Africa
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: 'white',
        padding: '32px 24px',
        marginTop: 48
      }}>
        <div style={{
          maxWidth: 800,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
            &copy; {new Date().getFullYear()} HireInbox (Pty) Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

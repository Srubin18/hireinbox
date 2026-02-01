'use client';

import Link from 'next/link';

/* ===========================================
   HIREINBOX - PRIVACY POLICY PAGE
   POPIA Compliant Privacy Policy
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

export default function PrivacyPage() {
  const lastUpdated = '26 December 2024';

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
            <Link href="/terms" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Terms of Service</Link>
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
            Privacy Policy
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
              Hyred (Pty) Ltd (&quot;Hyred&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered CV screening platform.
            </p>
            <p style={{ color: '#475569', fontSize: '1.05rem', marginTop: 16 }}>
              We comply with the Protection of Personal Information Act 4 of 2013 (&quot;POPIA&quot;) and other applicable South African data protection laws.
            </p>
          </section>

          {/* Section 1 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              1. Information We Collect
            </h2>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              1.1 Information You Provide
            </h3>
            <ul style={{ color: '#475569', paddingLeft: 24, marginBottom: 16 }}>
              <li style={{ marginBottom: 8 }}><strong>CV/Resume Data:</strong> When you upload your CV, we collect all information contained within it, including your name, contact details, work history, education, skills, and qualifications.</li>
              <li style={{ marginBottom: 8 }}><strong>Account Information:</strong> Email address, password, and profile information when you create an account.</li>
              <li style={{ marginBottom: 8 }}><strong>Job Requirements:</strong> For employers, we collect job descriptions, required skills, and screening criteria.</li>
              <li style={{ marginBottom: 8 }}><strong>Communications:</strong> Any correspondence you have with us.</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
              1.2 Information Collected Automatically
            </h3>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
              <li style={{ marginBottom: 8 }}><strong>Usage Data:</strong> Pages visited, time spent on the platform, and interaction patterns.</li>
              <li style={{ marginBottom: 8 }}><strong>Cookies:</strong> We use cookies and similar technologies to improve your experience. See Section 7 for details.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              2. How We Use Your Information
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              We process your personal information for the following purposes:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong>AI-Powered CV Screening:</strong> Analyzing CVs using artificial intelligence to match candidates with job requirements.</li>
              <li style={{ marginBottom: 8 }}><strong>Providing Feedback:</strong> Generating personalized CV improvement suggestions for job seekers.</li>
              <li style={{ marginBottom: 8 }}><strong>Service Delivery:</strong> Facilitating connections between employers and candidates.</li>
              <li style={{ marginBottom: 8 }}><strong>Platform Improvement:</strong> Enhancing our AI models and user experience.</li>
              <li style={{ marginBottom: 8 }}><strong>Communications:</strong> Sending service-related notifications and, with your consent, marketing communications.</li>
              <li style={{ marginBottom: 8 }}><strong>Legal Compliance:</strong> Meeting our legal and regulatory obligations.</li>
            </ul>
          </section>

          {/* Section 3 - AI Processing */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              3. AI Processing and Automated Decision-Making
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              Hyred uses artificial intelligence to analyze CVs and provide screening recommendations. We are transparent about how our AI works:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24, marginBottom: 16 }}>
              <li style={{ marginBottom: 8 }}><strong>Evidence-Based Analysis:</strong> Our AI provides reasoning with direct quotes from CVs, ensuring transparency.</li>
              <li style={{ marginBottom: 8 }}><strong>Human Oversight:</strong> AI recommendations are advisory only. Final hiring decisions are always made by humans.</li>
              <li style={{ marginBottom: 8 }}><strong>No Discrimination:</strong> Our AI is designed to focus on skills and qualifications, not protected characteristics.</li>
              <li style={{ marginBottom: 8 }}><strong>Right to Contest:</strong> You have the right to contest any AI-generated assessment. Contact us to request a human review.</li>
            </ul>
            <div style={{
              backgroundColor: '#EEF2FF',
              border: '1px solid #C7D2FE',
              borderRadius: 8,
              padding: 16,
              marginTop: 16
            }}>
              <p style={{ color: '#4338CA', fontSize: '0.95rem', margin: 0 }}>
                <strong>Your Rights:</strong> Under POPIA, you have the right not to be subject to a decision based solely on automated processing that produces legal effects or similarly significantly affects you. Our AI assists human decision-makers but does not make final decisions.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              4. Data Retention
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              We retain your personal information only as long as necessary:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong>Job Seeker CVs:</strong> Retained for 12 months from last activity, or until you request deletion.</li>
              <li style={{ marginBottom: 8 }}><strong>Employer Data:</strong> Retained for the duration of the business relationship plus 5 years for legal compliance.</li>
              <li style={{ marginBottom: 8 }}><strong>Screening Records:</strong> Maintained for 3 years to provide audit trails as required by employment law.</li>
              <li style={{ marginBottom: 8 }}><strong>Account Data:</strong> Retained until account deletion is requested.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              5. Sharing Your Information
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              We do not sell your personal information. We may share information with:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong>Employers:</strong> Your CV and screening results are shared only with employers for positions you apply to.</li>
              <li style={{ marginBottom: 8 }}><strong>Service Providers:</strong> Third-party providers who assist in operating our platform (hosting, AI processing, payment processing).</li>
              <li style={{ marginBottom: 8 }}><strong>Legal Requirements:</strong> When required by law, court order, or government request.</li>
              <li style={{ marginBottom: 8 }}><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              6. Your Rights Under POPIA
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              As a data subject, you have the following rights:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong>Right to Access:</strong> Request a copy of your personal information we hold.</li>
              <li style={{ marginBottom: 8 }}><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete information.</li>
              <li style={{ marginBottom: 8 }}><strong>Right to Deletion:</strong> Request deletion of your personal information.</li>
              <li style={{ marginBottom: 8 }}><strong>Right to Object:</strong> Object to the processing of your personal information.</li>
              <li style={{ marginBottom: 8 }}><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li style={{ marginBottom: 8 }}><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
              <li style={{ marginBottom: 8 }}><strong>Right to Lodge a Complaint:</strong> Lodge a complaint with the Information Regulator.</li>
            </ul>
            <p style={{ color: '#475569', marginTop: 16 }}>
              To exercise these rights, contact us at <a href="mailto:privacy@hireinbox.co.za" style={{ color: '#4F46E5' }}>privacy@hireinbox.co.za</a>
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              7. Cookies and Tracking Technologies
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              We use cookies and similar technologies to:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24, marginBottom: 16 }}>
              <li style={{ marginBottom: 8 }}><strong>Essential Cookies:</strong> Required for the platform to function properly.</li>
              <li style={{ marginBottom: 8 }}><strong>Analytics Cookies:</strong> Help us understand how visitors use our platform.</li>
              <li style={{ marginBottom: 8 }}><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
            </ul>
            <p style={{ color: '#475569' }}>
              You can manage cookie preferences through your browser settings or our cookie consent banner.
            </p>
          </section>

          {/* Section 8 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              8. Data Security
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul style={{ color: '#475569', paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>Encryption of data in transit and at rest</li>
              <li style={{ marginBottom: 8 }}>Secure hosting infrastructure</li>
              <li style={{ marginBottom: 8 }}>Access controls and authentication</li>
              <li style={{ marginBottom: 8 }}>Regular security assessments</li>
              <li style={{ marginBottom: 8 }}>Employee training on data protection</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              9. International Data Transfers
            </h2>
            <p style={{ color: '#475569' }}>
              Some of our service providers (including AI processing services) may be located outside South Africa. When transferring data internationally, we ensure adequate protection through contractual safeguards and compliance with POPIA requirements for cross-border transfers.
            </p>
          </section>

          {/* Section 10 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              10. Changes to This Policy
            </h2>
            <p style={{ color: '#475569' }}>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              11. Contact Us
            </h2>
            <p style={{ color: '#475569', marginBottom: 16 }}>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              padding: 20,
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ color: '#475569', margin: 0, marginBottom: 8 }}>
                <strong>Hyred (Pty) Ltd</strong>
              </p>
              <p style={{ color: '#475569', margin: 0, marginBottom: 8 }}>
                Email: <a href="mailto:privacy@hireinbox.co.za" style={{ color: '#4F46E5' }}>privacy@hireinbox.co.za</a>
              </p>
              <p style={{ color: '#475569', margin: 0, marginBottom: 16 }}>
                Cape Town, South Africa
              </p>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
                For complaints, you may also contact the Information Regulator at <a href="https://inforegulator.org.za" style={{ color: '#4F46E5' }} target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>
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
            &copy; {new Date().getFullYear()} Hyred (Pty) Ltd. All rights reserved.
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

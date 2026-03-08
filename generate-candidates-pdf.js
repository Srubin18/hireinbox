const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Jobix - Automation Candidates',
    Author: 'HireInbox Intelligence Stack',
  }
});

const output = fs.createWriteStream('/home/user/hireinbox/Jobix - Automation Candidates.pdf');
doc.pipe(output);

// Colors
const DARK = '#1a1a2e';
const ACCENT = '#e94560';
const BLUE = '#0077b5';
const GREEN = '#16c79a';
const WARM = '#f5a623';
const GRAY = '#6b7280';
const LIGHT_BG = '#f8f9fa';

// Helper functions
function drawLine(y, color = '#e0e0e0') {
  doc.moveTo(50, y).lineTo(545, y).strokeColor(color).lineWidth(0.5).stroke();
}

function addLink(text, url, options = {}) {
  const x = options.x || doc.x;
  const y = options.y || doc.y;
  doc.fillColor(BLUE).fontSize(options.fontSize || 10)
    .text(text, x, y, { link: url, underline: true, continued: options.continued || false });
  doc.fillColor(DARK);
}

// ==================== COVER PAGE ====================
doc.rect(0, 0, 595, 842).fill(DARK);

// Logo area
doc.fontSize(42).fillColor('#ffffff').font('Helvetica-Bold')
  .text('JOBIX', 50, 200, { align: 'center' });
doc.fontSize(14).fillColor(ACCENT).font('Helvetica')
  .text('AI AUTOMATION DIVISION', 50, 250, { align: 'center' });

drawLine(280, ACCENT);

doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
  .text('Cape Town', 50, 310, { align: 'center' });
doc.fontSize(28)
  .text('AI Automation Candidates', 50, 345, { align: 'center' });

doc.fontSize(12).fillColor(GRAY).font('Helvetica')
  .text('Confidential Intelligence Report', 50, 420, { align: 'center' });

doc.fontSize(10).fillColor('#888888')
  .text('Prepared: 8 March 2026', 50, 460, { align: 'center' })
  .text('Source: HireInbox Intelligence Stack (GDELT + Shofo + LinkedIn)', 50, 478, { align: 'center' });

doc.fontSize(9).fillColor('#666666')
  .text('5 candidates identified | Readiness to move assessed', 50, 520, { align: 'center' });

// ==================== PAGE 2: EXECUTIVE SUMMARY ====================
doc.addPage();

doc.fontSize(22).fillColor(DARK).font('Helvetica-Bold')
  .text('Executive Summary', 50, 50);
drawLine(78);

doc.fontSize(11).fillColor(DARK).font('Helvetica').lineGap(4)
  .text('', 50, 95)
  .text('Jobix AI (like ElevenLabs) needs automation specialists who can help clients set up voice agents, wire API integrations, and deploy automation workflows. Using our intelligence stack, we identified 5 hands-on automation builders in Cape Town who match this profile.', { width: 495 })
  .moveDown(0.5)
  .text('Each candidate has been assessed for technical fit, readiness to move, and optimal approach strategy. Focus: API integration, voice/AI agents, workflow automation, CI/CD, and client deployment.', { width: 495 });

doc.moveDown(1.5);

// Summary table
const tableTop = doc.y;
doc.rect(50, tableTop, 495, 28).fill(DARK);
doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold')
  .text('Candidate', 60, tableTop + 8)
  .text('Current Company', 200, tableTop + 8)
  .text('Signal', 370, tableTop + 8)
  .text('Priority', 470, tableTop + 8);

const candidates = [
  { name: 'Craig Van', company: 'Adyen', signal: 'HOT', priority: 'Immediate' },
  { name: 'Shaun Egan', company: 'iiDENTIFii', signal: 'WARM-HOT', priority: 'High' },
  { name: 'Lindsay Bell-Cedras', company: 'IQbusiness', signal: 'HOT', priority: 'Immediate' },
  { name: 'Sapokazi Maqoga', company: 'Zensar/Sanlam', signal: 'WARM-HOT', priority: 'High' },
  { name: 'Leroy Sharp', company: 'RealFi', signal: 'WARM', priority: 'Medium' },
];

let rowY = tableTop + 28;
candidates.forEach((c, i) => {
  const bg = i % 2 === 0 ? LIGHT_BG : '#ffffff';
  doc.rect(50, rowY, 495, 24).fill(bg);
  doc.fontSize(10).fillColor(DARK).font('Helvetica')
    .text(c.name, 60, rowY + 7)
    .text(c.company, 200, rowY + 7);

  const signalColor = c.signal === 'HOT' ? ACCENT : c.signal === 'WARM-HOT' ? WARM : GREEN;
  doc.fillColor(signalColor).font('Helvetica-Bold')
    .text(c.signal, 370, rowY + 7);
  doc.fillColor(DARK).font('Helvetica')
    .text(c.priority, 470, rowY + 7);
  rowY += 24;
});

// Market intel box
doc.moveDown(3);
const boxY = rowY + 30;
doc.rect(50, boxY, 495, 130).fill('#f0f4f8').stroke('#d0d8e0');
doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold')
  .text('Market Intelligence', 65, boxY + 12);
doc.fontSize(10).fillColor(DARK).font('Helvetica').lineGap(3);

const intel = [
  ['Voice AI Market', '100+ AI automation jobs in Cape Town on Indeed. Voice agent demand surging.'],
  ['Adyen CT Office', '3,000+ staff in Western Cape. Tech support roles -- engineers want to build, not support.'],
  ['SA AI Salaries', 'R350K-R900K for automation engineers. Cape Town pays highest in SA.'],
  ['Market Trend', 'AI agent/integration specialists are scarce in CT. First-mover advantage for Jobix.'],
];

let intelY = boxY + 32;
intel.forEach(([label, detail]) => {
  doc.font('Helvetica-Bold').fillColor(ACCENT).text(label + ':', 65, intelY, { continued: true, width: 420 });
  doc.font('Helvetica').fillColor(DARK).text(' ' + detail, { width: 420 });
  intelY = doc.y + 2;
});

// ==================== CANDIDATE PAGES ====================

const candidateDetails = [
  {
    name: 'Craig Van',
    role: 'Technical Support Engineer (Payments)',
    company: 'Adyen',
    linkedin: 'https://www.linkedin.com/in/craigvandotcom/',
    signal: 'HOT',
    signalColor: ACCENT,
    stack: 'Voiceflow, OpenAI API, RAG, Python Flask, Chatbots, API Integration, Full-Stack Development',
    background: [
      'Built AI chatbot using Voiceflow + OpenAI API + RAG with Python Flask backend',
      'Technical co-founder -- developed chatbots and inventory management systems',
      'Full-stack developer with AI, data pipelines, and process automation focus',
      'Strong API expertise honed through payments integration work at Adyen',
      'Side projects in ML and data engineering -- constantly building',
    ],
    readiness: [
      'Currently in a SUPPORT role at Adyen -- a builder stuck in support. Wants to create.',
      'Already building AI chatbots and voice solutions on the side -- this is his passion',
      'Technical co-founder experience -- understands startup pace and client delivery',
      'Voiceflow + OpenAI + RAG stack maps DIRECTLY to Jobix voice agent work',
    ],
    approach: 'This is your #1 target. He is literally building voice agents in his spare time while stuck in a support role. Pitch: "Stop supporting payments. Build voice AI full-time." He will bite.',
  },
  {
    name: 'Shaun Egan',
    role: 'Principal Engineer / Software Architect',
    company: 'iiDENTIFii',
    linkedin: 'https://za.linkedin.com/in/shauneganza',
    signal: 'WARM-HOT',
    signalColor: WARM,
    stack: 'Cloud-native Architecture, Microservices, AWS, Event-driven Systems, AI Tools, Python, CI/CD',
    background: [
      '15 years experience. MSc from Rhodes University',
      'Principal Engineer at iiDENTIFii (identity verification AI startup)',
      'Ex-Director of Software Engineering at Deimos -- led large engineering teams',
      'Built event-driven microservices and payments systems at Iflix (serverless AWS)',
      'Drives adoption of AI-based tools and process automation',
    ],
    readiness: [
      'iiDENTIFii is a niche identity verification company -- may want broader AI scope',
      'Has held Director-level roles -- senior enough to want meaningful product ownership',
      'Microservices + API architecture expertise = perfect for voice agent infrastructure',
      'Actively discusses AI-driven development on LinkedIn -- engaged with the space',
    ],
    approach: 'Position as a technical leadership opportunity. "Architect the voice AI platform for Africa." His cloud-native and API architecture skills are exactly what Jobix needs at scale.',
  },
  {
    name: 'Lindsay Bell-Cedras',
    role: 'Automation Lead / Senior Developer',
    company: 'IQbusiness South Africa',
    linkedin: 'https://www.linkedin.com/in/lindsay-bell-cedras/',
    signal: 'HOT',
    signalColor: ACCENT,
    stack: 'RPA (Blue Prism, Automation Anywhere), Process Automation, Project Management, IT Programming',
    background: [
      'Automation Lead and Senior Developer at IQbusiness',
      'Certified in Blue Prism and Automation Anywhere (dual RPA platforms)',
      'Previously Automation Delivery Manager and Senior Dev at DigiBlu',
      'Graduated with distinction in IT Programming from Varsity College',
      'Also runs CreativeIdeas Cape Town (graphic design, photography)',
    ],
    readiness: [
      'IQbusiness is a consulting firm -- project-based work, no product ownership',
      'Consulting fatigue is real -- building a product is more compelling than client rotations',
      'RPA + automation delivery experience maps perfectly to client voice agent deployment',
      'Creative side (runs own design business) signals entrepreneurial drive',
    ],
    approach: 'Lead with product ownership. "Stop consulting. Build the automation product." Their delivery management skills are gold for client onboarding and voice agent setup.',
  },
  {
    name: 'Sapokazi Maqoga',
    role: 'RPA Developer',
    company: 'Zensar Technologies / Sanlam',
    linkedin: 'https://www.linkedin.com/in/sapokazi-maqoga-8360ab104/',
    signal: 'WARM-HOT',
    signalColor: WARM,
    stack: 'Power Automate, Power Apps, RPA, Workflow Automation, Process Integration',
    background: [
      'RPA Developer at Zensar Technologies with Sanlam as client',
      'Builds automated workflows and custom applications using Power Platform',
      'Walter Sisulu University graduate, based in City of Cape Town',
      'Streamlines business processes through intelligent automation',
    ],
    readiness: [
      'Working as a contractor (Zensar) servicing Sanlam -- no deep loyalty to either',
      'Power Automate / workflow automation skills translate directly to voice agent setup',
      'Contract/outsourced roles have natural churn -- timing could be right',
      'Enterprise automation experience at Sanlam = understands client deployment at scale',
    ],
    approach: 'Pitch the product side. "Build automation that ships to thousands of clients, not just one bank." Enterprise RPA experience + startup energy = strong fit.',
  },
  {
    name: 'Leroy Sharp',
    role: 'QA Engineer / Automation Specialist',
    company: 'RealFi',
    linkedin: 'https://www.linkedin.com/in/leroy-sharp-027496b5/',
    signal: 'WARM',
    signalColor: GREEN,
    stack: 'Test Automation, CI/CD, Python, Full-Stack Development, Software Testing',
    background: [
      '6+ years of QA automation experience, specialising in framework design',
      'Currently at RealFi -- DeFi/blockchain startup in Cape Town',
      'Mancosa graduate, completed Elements of AI (University of Helsinki)',
      'Full-stack development experience alongside QA automation',
      'Self-motivated, creative problem solver with rapid environment adaptation',
    ],
    readiness: [
      'RealFi is a small blockchain startup -- crypto market volatility creates uncertainty',
      'QA automation + full-stack = can build AND test client integration pipelines',
      'AI training (Elements of AI) shows intent to move into AI space',
      'Building personal portfolio site -- actively investing in career growth',
    ],
    approach: 'Position as a career upgrade into AI. "Your automation skills + AI = the future. Come build voice agents." His QA rigour ensures client integrations actually work.',
  },
];

candidateDetails.forEach((c, idx) => {
  doc.addPage();

  // Header bar
  doc.rect(0, 0, 595, 90).fill(DARK);
  doc.fontSize(10).fillColor(ACCENT).font('Helvetica')
    .text(`CANDIDATE ${idx + 1} OF 5`, 50, 20);
  doc.fontSize(24).fillColor('#ffffff').font('Helvetica-Bold')
    .text(c.name, 50, 38);
  doc.fontSize(12).fillColor('#cccccc').font('Helvetica')
    .text(`${c.role} | ${c.company}`, 50, 67);

  // Signal badge
  const badgeWidth = c.signal.length * 10 + 20;
  doc.rect(545 - badgeWidth, 38, badgeWidth, 26).fillAndStroke(c.signalColor, c.signalColor);
  doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold')
    .text(c.signal, 545 - badgeWidth + 10, 44, { width: badgeWidth - 20, align: 'center' });

  let y = 110;

  // LinkedIn link
  doc.fontSize(10).fillColor(BLUE).font('Helvetica')
    .text('View LinkedIn Profile', 50, y, { link: c.linkedin, underline: true });
  doc.fontSize(9).fillColor(GRAY)
    .text(c.linkedin, 180, y);
  y += 25;

  drawLine(y);
  y += 15;

  // Tech Stack
  doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold')
    .text('Tech Stack', 50, y);
  y += 18;
  doc.rect(50, y, 495, 30).fill(LIGHT_BG);
  doc.fontSize(10).fillColor(DARK).font('Helvetica')
    .text(c.stack, 60, y + 8, { width: 475 });
  y += 38;

  // Background
  doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold')
    .text('Background & Experience', 50, y);
  y += 18;
  c.background.forEach(item => {
    doc.fontSize(10).fillColor(ACCENT).font('Helvetica')
      .text('>', 55, y);
    doc.fillColor(DARK).font('Helvetica')
      .text(item, 68, y, { width: 470 });
    y = doc.y + 5;
  });

  y += 10;

  // Readiness signals
  doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold')
    .text('Readiness to Move -- Signals', 50, y);
  y += 18;

  doc.rect(50, y, 495, c.readiness.length * 22 + 10).fill('#fff8f0').stroke('#f0e0d0');
  y += 8;
  c.readiness.forEach(item => {
    doc.fontSize(10).fillColor(WARM).font('Helvetica')
      .text('!', 60, y);
    doc.fillColor(DARK).font('Helvetica')
      .text(item, 74, y, { width: 460 });
    y += 22;
  });

  y += 18;

  // Approach strategy
  doc.rect(50, y, 495, 60).fill(DARK);
  doc.fontSize(11).fillColor(ACCENT).font('Helvetica-Bold')
    .text('RECOMMENDED APPROACH', 65, y + 10);
  doc.fontSize(10).fillColor('#ffffff').font('Helvetica')
    .text(c.approach, 65, y + 28, { width: 465 });
});

// ==================== FINAL PAGE ====================
doc.addPage();

doc.rect(0, 0, 595, 842).fill(DARK);

doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
  .text('Next Steps', 50, 200, { align: 'center' });

drawLine(235, ACCENT);

doc.fontSize(12).fillColor('#cccccc').font('Helvetica').lineGap(6);

const steps = [
  ['1.', 'Craig Van', 'Move NOW. He is building voice agents on the side while stuck in support. Perfect fit.'],
  ['2.', 'Lindsay Bell-Cedras', 'Reach out this week. Consulting fatigue + product ownership pitch = compelling.'],
  ['3.', 'Sapokazi Maqoga', 'Approach within 2 weeks. Contractor status = lower switching cost.'],
  ['4.', 'Shaun Egan', 'Coffee chat. Senior hire -- position as CTO-track or Head of Engineering.'],
  ['5.', 'Leroy Sharp', 'Soft approach. Career upgrade pitch from QA automation into AI voice agents.'],
];

let stepY = 260;
steps.forEach(([num, name, detail]) => {
  doc.fontSize(28).fillColor(ACCENT).font('Helvetica-Bold')
    .text(num, 80, stepY);
  doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
    .text(name, 120, stepY + 2);
  doc.fontSize(10).fillColor('#aaaaaa').font('Helvetica')
    .text(detail, 120, stepY + 22, { width: 400 });
  stepY += 60;
});

doc.fontSize(9).fillColor('#666666').font('Helvetica')
  .text('Generated by HireInbox Intelligence Stack', 50, 700, { align: 'center' })
  .text('GDELT News Analysis | Shofo Salary Benchmarks | LinkedIn Enrichment', 50, 715, { align: 'center' })
  .text('Confidential -- For Jobix AI internal use only', 50, 740, { align: 'center' });

doc.end();

output.on('finish', () => {
  console.log('PDF generated: Jobix - Automation Candidates.pdf');
});

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
  .text('Using the HireInbox Superior Intelligence Stack (GDELT news analysis, Shofo salary benchmarking, and LinkedIn enrichment), we identified 5 high-calibre AI/automation engineers based in Cape Town who could strengthen Jobix AI\'s engineering team.', { width: 495 })
  .moveDown(0.5)
  .text('Each candidate has been assessed for technical fit, readiness to move, and optimal approach strategy.', { width: 495 });

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
  { name: 'Nick Pentreath', company: 'Rumi.ai', signal: 'WARM', priority: 'Long-term' },
  { name: 'Josh Chettiar', company: 'InstaDeep', signal: 'HOT', priority: 'Immediate' },
  { name: 'Shane Weisz', company: 'Aerobotics', signal: 'WARM-HOT', priority: 'High' },
  { name: 'Ruan de Kock', company: 'InstaDeep', signal: 'WARM', priority: 'Medium' },
  { name: 'Olivier Adjagba', company: 'AIMS Graduate', signal: 'HOT', priority: 'Immediate' },
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
  ['BioNTech/InstaDeep', '950-1,350 global cuts by 2027. CT engineers may feel the squeeze.'],
  ['Aerobotics', 'Small team (~50), narrow agri-tech focus. ML engineers underutilised.'],
  ['SA AI Salaries', 'R400K-R1M engineers, R900K-R2.5M directors. Cape Town pays highest.'],
  ['Market Trend', 'AI jobs in CT growing but sparse (0.09/100K). Demand outstrips supply.'],
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
    name: 'Nick Pentreath',
    role: 'Principal Engineer',
    company: 'Rumi.ai',
    linkedin: 'https://www.linkedin.com/in/mlnick/',
    signal: 'WARM',
    signalColor: GREEN,
    stack: 'AI/ML, Apache Spark (PMC member), NLP, Recommendations, Personalisation, Python, Scala, Java',
    background: [
      '15 years in AI/ML engineering and tech leadership',
      'Ex-Goldman Sachs, Investec, IBM, Tumblr/Automattic ML Tech Lead',
      'MSc Machine Learning from UCL (Distinction), UCT BSc graduate',
      'Co-founded ML startup Graphflow',
      'Apache Spark Project PMC Member',
    ],
    readiness: [
      'Recently joined Rumi.ai (small meetings startup) -- early-stage company risk',
      'Has startup DNA (co-founded before) -- understands the Jobix AI vision',
      'Rumi.ai is niche; a purpose-driven AI company could be more compelling',
      'Senior and just posted about joining Rumi -- timing may be 6-12 months out',
    ],
    approach: 'Long game. Coffee chat, keep warm. He is the "in 6 months" hire. Appeal to his desire to build something bigger than a meetings tool.',
  },
  {
    name: 'Josh Chettiar',
    role: 'Applied AI Engineer -- Team Lead',
    company: 'InstaDeep (BioNTech)',
    linkedin: 'https://www.linkedin.com/in/josh-chettiar-9650b796/',
    signal: 'HOT',
    signalColor: ACCENT,
    stack: 'Azure OpenAI, Azure AI Studio, Databricks, Open-source ML/AI, PoC-to-Production delivery',
    background: [
      'University of the Witwatersrand graduate',
      'At InstaDeep since mid-2023, promoted to Team Lead Jan 2025',
      'Runs AI solution delivery from Proof of Concept to Production',
      'Experience accelerating customer AI/ML opportunities',
    ],
    readiness: [
      'BioNTech (parent company) cutting 950-1,350 jobs globally by 2027',
      'InstaDeep CT is a satellite of a pharma-focused parent -- potential misalignment',
      '~2 years tenure = classic "ready to explore" window',
      'Applied AI focus maps perfectly to Jobix AI\'s automation needs',
    ],
    approach: 'Lead with the BioNTech uncertainty angle. "Build AI that matters, not pharma pipelines." His PoC-to-Production skills are exactly what Jobix needs.',
  },
  {
    name: 'Shane Weisz',
    role: 'Software Engineer (Machine Learning)',
    company: 'Aerobotics',
    linkedin: 'https://www.linkedin.com/in/shaneweisz/',
    signal: 'WARM-HOT',
    signalColor: WARM,
    stack: 'Computer Vision, ML, Deep Learning, NLP, LLM Fine-tuning, Python',
    background: [
      'Cambridge MPhil in Machine Learning & Machine Intelligence',
      'UCT graduate, currently pursuing PhD at Cambridge',
      'Built ML models for agriculture (340M+ trees analysed at Aerobotics)',
      'GitHub: LLM fine-tuning for counterspeech, deep learning for network classification',
      'Previous experience at Nomanini',
    ],
    readiness: [
      'Splitting time between PhD and Aerobotics -- may want a singular focus',
      'Aerobotics is small (~50 people) and narrowly focused on agriculture',
      'Skills (LLMs, NLP, CV) are overqualified for tree-counting',
      'Cambridge pedigree would bring credibility to Jobix AI',
    ],
    approach: 'Appeal to his breadth. "Stop counting trees. Automate hiring for Africa." His LLM fine-tuning skills are gold for AI-driven recruitment.',
  },
  {
    name: 'Ruan de Kock',
    role: 'Senior Research Engineer',
    company: 'InstaDeep (BioNTech)',
    linkedin: 'https://www.linkedin.com/in/ruan-de-kock/',
    signal: 'WARM',
    signalColor: GREEN,
    stack: 'Multi-Agent Reinforcement Learning (MARL), JAX, Transformers, Generative Models',
    background: [
      'UCT BSc Honours, currently MSc student at UCT',
      'Previously Data Scientist at Praelexis (Cape Town AI company)',
      'Paper accepted at ICLR 2026 (top ML conference)',
      'Leads AI career workshops at UCT -- strong community presence',
    ],
    readiness: [
      'Same BioNTech restructuring risk as Josh Chettiar',
      'Currently doing MSc alongside work -- may want a role that supports research',
      'Strong community involvement -- values purpose-driven work',
      'Published researcher (ICLR 2026) -- wants to build things that matter',
    ],
    approach: 'Position Jobix AI as applied research that ships. His MARL expertise could power multi-agent hiring automation workflows.',
  },
  {
    name: 'Olivier Adjagba',
    role: 'AI/ML Engineer',
    company: 'AIMS / Google DeepMind Alumnus',
    linkedin: 'https://www.linkedin.com/in/olivieradjagba/',
    signal: 'HOT',
    signalColor: ACCENT,
    stack: 'AI for Science, Epidemiological Modelling, Deep Learning, Pathogen Tracking',
    background: [
      'AIMS South Africa graduate (Google DeepMind full scholarship)',
      'Originally from Benin, based in Cape Town',
      'Worked with CERI/KRISP on AI for dengue fever prediction',
      'Featured in Google DeepMind blog post',
      'Part of first AIMS-DeepMind cohort of AI leaders in Africa',
    ],
    readiness: [
      'Recently graduated from AIMS programme -- actively entering the job market',
      'No permanent employer anchor -- perfect timing for a founding-stage opportunity',
      'Google DeepMind training + AIMS pedigree = exceptional talent at early-career cost',
      'Already in Cape Town; mission-driven (applied AI to real African problems)',
    ],
    approach: 'Timing is everything. He is job-hunting NOW. Move immediately. Frame Jobix as "AI solving real African problems" -- mirrors his values perfectly.',
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
  ['1.', 'Olivier Adjagba', 'Move immediately. He is actively job-hunting. First-mover advantage.'],
  ['2.', 'Josh Chettiar', 'Reach out this week. BioNTech uncertainty creates a window.'],
  ['3.', 'Shane Weisz', 'Approach within 2 weeks. His LLM skills are rare in Cape Town.'],
  ['4.', 'Ruan de Kock', 'Soft approach. Invite to an AI meetup or coffee. Build rapport.'],
  ['5.', 'Nick Pentreath', 'Plant the seed. LinkedIn connect, share Jobix AI vision. Revisit in 6 months.'],
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

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const pdfGenerator = require('./services/pdfGenerator');

// Try to load Gemini service (optional)
let geminiService = null;
try {
  geminiService = require('./services/gemini');
} catch (e) {
  console.log('[Server] Gemini service not available, using offline ATS scoring only');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Create temp directory for generated files
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Clean old temp files every 10 minutes
setInterval(() => {
  const now = Date.now();
  try {
    fs.readdirSync(TEMP_DIR).forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 10 * 60 * 1000) { // 10 min
        fs.unlinkSync(filePath);
      }
    });
  } catch (e) { /* ignore cleanup errors */ }
}, 10 * 60 * 1000);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== Offline ATS Scorer =====
function scoreATSOffline(resumeData, targetJob, language) {
  const isAr = language === 'ar';
  let score = 0;
  const tips = [];
  const keywords = [];

  if (resumeData.fullName && resumeData.fullName.trim().length > 2) score += 5;
  else tips.push(isAr ? '- أضف اسمك الكامل' : '- Add your full name');

  if (resumeData.jobTitle && resumeData.jobTitle.trim().length > 2) score += 10;
  else tips.push(isAr ? '- أضف المسمى الوظيفي المستهدف' : '- Add your target job title');

  if (resumeData.email && resumeData.email.includes('@')) score += 5;
  else tips.push(isAr ? '- أضف بريدك الإلكتروني' : '- Add your email');

  if (resumeData.phone && resumeData.phone.length >= 8) score += 5;
  else tips.push(isAr ? '- أضف رقم هاتفك' : '- Add your phone number');

  if (resumeData.summary) {
    const len = resumeData.summary.trim().length;
    if (len > 150) score += 15;
    else if (len > 50) { score += 10; tips.push(isAr ? '- اكتب ملخصاً أطول (150+ حرف)' : '- Write a longer summary (150+ chars)'); }
    else { score += 5; tips.push(isAr ? '- الملخص قصير جداً، اكتب 3-4 جمل' : '- Summary too short, write 3-4 sentences'); }
  } else tips.push(isAr ? '- أضف ملخصاً مهنياً' : '- Add a professional summary');

  const exps = (resumeData.experience || []).filter(e => e.title || e.company);
  if (exps.length >= 2) score += 20;
  else if (exps.length === 1) { score += 12; tips.push(isAr ? '- أضف المزيد من الخبرات' : '- Add more experience'); }
  else tips.push(isAr ? '- أضف خبراتك العملية' : '- Add work experience');

  const expsWithDesc = exps.filter(e => e.description && e.description.length > 30);
  if (expsWithDesc.length >= exps.length && exps.length > 0) score += 10;
  else if (expsWithDesc.length > 0) { score += 5; tips.push(isAr ? '- أضف وصفاً تفصيلياً لكل خبرة' : '- Add detailed descriptions'); }

  const edus = (resumeData.education || []).filter(e => e.degree || e.institution);
  if (edus.length >= 1) score += 10;
  else tips.push(isAr ? '- أضف مؤهلاتك الدراسية' : '- Add education');

  const skillCount = (resumeData.skills || []).length;
  if (skillCount >= 6) score += 15;
  else if (skillCount >= 3) { score += 10; tips.push(isAr ? '- أضف المزيد من المهارات (6+)' : '- Add more skills (6+)'); }
  else if (skillCount > 0) { score += 5; tips.push(isAr ? '- أضف مهارات أكثر' : '- Add more skills'); }
  else tips.push(isAr ? '- أضف مهاراتك' : '- Add skills');

  if (resumeData.location && resumeData.location.length > 2) score += 5;
  else tips.push(isAr ? '- أضف موقعك' : '- Add your location');

  const specKeywords = getSpecKeywords(resumeData.specialization);
  const existingText = [resumeData.summary || '', ...(resumeData.skills || []),
  ...(resumeData.experience || []).map(e => `${e.title} ${e.description}`), resumeData.jobTitle || ''].join(' ').toLowerCase();
  specKeywords.forEach(kw => { if (!existingText.includes(kw.toLowerCase())) keywords.push(kw); });

  score = Math.min(100, Math.max(0, score));
  return `SCORE: ${score}\nTIPS:\n${tips.join('\n')}\nKEYWORDS:\n${keywords.map(k => `- ${k}`).join('\n')}`;
}

function getSpecKeywords(spec) {
  const map = {
    'تكنولوجيا المعلومات': ['Agile', 'Scrum', 'Git', 'CI/CD', 'Cloud', 'API', 'Database', 'Security'],
    'Information Technology': ['Agile', 'Scrum', 'Git', 'CI/CD', 'Cloud', 'API', 'Database', 'Security'],
    'الهندسة': ['AutoCAD', 'Project Management', 'Quality Control', 'Safety'],
    'Engineering': ['AutoCAD', 'Project Management', 'Quality Control', 'Safety'],
    'إدارة الأعمال': ['Leadership', 'Strategy', 'KPI', 'Budget', 'Stakeholder Management'],
    'Business Management': ['Leadership', 'Strategy', 'KPI', 'Budget', 'Stakeholder Management'],
    'التسويق والمبيعات': ['SEO', 'Analytics', 'Social Media', 'CRM', 'ROI'],
    'Marketing & Sales': ['SEO', 'Analytics', 'Social Media', 'CRM', 'ROI'],
    'المحاسبة والمالية': ['Financial Reporting', 'Audit', 'Compliance', 'Excel', 'ERP'],
    'Accounting & Finance': ['Financial Reporting', 'Audit', 'Compliance', 'Excel', 'ERP'],
    'التصميم والإبداع': ['Adobe Suite', 'UI/UX', 'Figma', 'Typography'],
    'Design & Creative': ['Adobe Suite', 'UI/UX', 'Figma', 'Typography'],
  };
  return map[spec] || ['Communication', 'Teamwork', 'Problem Solving', 'Leadership'];
}

// API: ATS Check
app.post('/api/optimize', async (req, res) => {
  try {
    const { resumeData, targetJob, language } = req.body;
    if (!resumeData) return res.status(400).json({ error: 'Resume data is required' });

    if (geminiService) {
      try {
        const result = await geminiService.optimizeForATS(resumeData, targetJob || '', language || 'ar');
        return res.json({ result });
      } catch (aiError) {
        console.log('[API] AI ATS failed, using offline:', aiError.message.substring(0, 60));
      }
    }

    const result = scoreATSOffline(resumeData, targetJob, language || 'ar');
    console.log('[API] ATS check completed (offline)');
    res.json({ result });
  } catch (error) {
    console.error('[API] Optimize error:', error.message);
    res.status(500).json({ error: 'ATS check failed' });
  }
});

// API: Generate PDF — saves to temp file, returns download URL
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ error: 'Resume data is required' });

    console.log('[API] Generating PDF for:', resumeData.fullName);
    const pdfBuffer = await pdfGenerator.generate(resumeData);

    // Save to temp file
    const fileId = crypto.randomBytes(8).toString('hex');
    const safeName = (resumeData.fullName || 'resume').replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, '').replace(/\s+/g, '_');
    const fileName = `${safeName}_CV.pdf`;
    const filePath = path.join(TEMP_DIR, `${fileId}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    console.log('[API] PDF saved:', filePath, `(${pdfBuffer.length} bytes)`);
    res.json({ downloadUrl: `/api/download/${fileId}`, fileName });
  } catch (error) {
    console.error('[API] Generate PDF error:', error.message);
    res.status(500).json({ error: 'PDF generation failed: ' + error.message });
  }
});

// API: Download generated file (GET - browser navigates here directly)
app.get('/api/download/:fileId', (req, res) => {
  const filePath = path.join(TEMP_DIR, `${req.params.fileId}.pdf`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File expired or not found. Please generate again.');
  }
  res.download(filePath, 'Resume_CV.pdf', (err) => {
    if (err) console.error('[API] Download error:', err.message);
    // Clean up after download
    setTimeout(() => {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }, 5000);
  });
});

// API: Generate HTML resume (alternative to PDF — always works)
app.post('/api/generate-html', (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ error: 'Resume data is required' });

    const html = pdfGenerator._buildHTML(resumeData);

    const fileId = crypto.randomBytes(8).toString('hex');
    const filePath = path.join(TEMP_DIR, `${fileId}.html`);
    fs.writeFileSync(filePath, html, 'utf8');

    console.log('[API] HTML resume saved:', filePath);
    res.json({ viewUrl: `/api/view/${fileId}` });
  } catch (error) {
    console.error('[API] Generate HTML error:', error.message);
    res.status(500).json({ error: 'HTML generation failed' });
  }
});

// API: View HTML resume in new tab (user can print to PDF via Ctrl+P)
app.get('/api/view/:fileId', (req, res) => {
  const filePath = path.join(TEMP_DIR, `${req.params.fileId}.html`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found. Please generate again.');
  }
  const html = fs.readFileSync(filePath, 'utf8');
  // Add print button to the HTML
  const printableHtml = html.replace('</body>', `
    <div id="printBtnBar" style="position:fixed;top:0;left:0;right:0;background:#2563eb;padding:10px 20px;display:flex;gap:12px;align-items:center;justify-content:center;z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
      <button onclick="window.print()" style="background:white;color:#2563eb;border:none;padding:10px 30px;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;">🖨️ Print / Save as PDF</button>
      <button onclick="document.getElementById('printBtnBar').remove()" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;">✕ Close Bar</button>
    </div>
    <style>@media print { #printBtnBar { display: none !important; } body { padding-top: 0 !important; } }</style>
    <style>body { padding-top: 60px; }</style>
  </body>`);
  res.send(printableHtml);
});

app.listen(PORT, () => {
  console.log(`\n🚀 ATS Resume Builder running at http://localhost:${PORT}`);
  console.log(`📋 API Keys: ${geminiService ? geminiService.getStatus().length : 0}`);
  console.log(`📄 PDF + HTML export ready`);
  console.log(`🔍 ATS Check: ${geminiService ? 'AI + Offline' : 'Offline'}`);
});

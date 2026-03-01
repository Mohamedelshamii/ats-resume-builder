const puppeteer = require('puppeteer');

class PDFGenerator {
  async generate(resumeData) {
    const html = this._buildHTML(resumeData);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '0.5in', bottom: '0.5in', left: '0.6in', right: '0.6in' },
        printBackground: true,
        preferCSSPageSize: false
      });
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  _buildHTML(data) {
    const template = data.template || 'classic';
    const isAr = data.language === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const align = isAr ? 'right' : 'left';
    const labels = isAr ? {
      summary: 'الملخص المهني', experience: 'الخبرة العملية', education: 'التعليم',
      skills: 'المهارات', certifications: 'الشهادات', languages: 'اللغات', present: 'حتى الآن'
    } : {
      summary: 'Professional Summary', experience: 'Work Experience', education: 'Education',
      skills: 'Skills', certifications: 'Certifications', languages: 'Languages', present: 'Present'
    };

    // Build content sections
    const contactParts = [data.email, data.phone, data.location, data.linkedin].filter(Boolean);
    const expHTML = (data.experience || []).filter(e => e.title || e.company).map(exp => `
      <div class="exp-item">
        <div class="exp-header">
          <div><span class="exp-title">${exp.title || ''}</span><span class="exp-company">${exp.company ? ' — ' + exp.company : ''}</span></div>
          <span class="exp-date">${exp.startDate || ''} - ${exp.endDate || labels.present}</span>
        </div>
        <div class="exp-desc">${(exp.description || '').replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');

    const eduHTML = (data.education || []).filter(e => e.degree || e.institution).map(edu => `
      <div class="edu-item">
        <div class="exp-header">
          <div><span class="exp-title">${edu.degree || ''}</span><span class="exp-company">${edu.institution ? ' — ' + edu.institution : ''}</span></div>
          <span class="exp-date">${edu.year || ''}</span>
        </div>
      </div>
    `).join('');

    const skillsHTML = (data.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('');
    const certsHTML = (data.certifications || []).map(c => `<div class="cert-item">• ${c}</div>`).join('');
    const langsHTML = (data.languages || []).map(l => `<span class="skill-tag">${l}</span>`).join('');

    switch (template) {
      case 'professional': return this._professionalTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML);
      case 'modern': return this._modernTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML);
      case 'executive': return this._executiveTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML);
      case 'photo': return this._photoTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML);
      case 'twocolumn': return this._twoColumnTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML);
      default: return this._classicTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML);
    }
  }

  _baseCSS(dir, align, isAr) {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 10.5pt; color: #1a1a1a; line-height: 1.5; direction: ${dir}; text-align: ${align}; }
      .section { margin-bottom: 12px; }
      .summary-text { font-size: 10pt; color: #333; line-height: 1.6; }
      .exp-item { margin-bottom: 10px; }
      .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
      .exp-title { font-weight: 700; font-size: 10.5pt; }
      .exp-company { color: #444; font-size: 10pt; }
      .exp-date { font-size: 9.5pt; color: #666; white-space: nowrap; }
      .exp-desc { font-size: 10pt; color: #333; padding-${isAr ? 'right' : 'left'}: 10px; line-height: 1.6; }
      .edu-item { margin-bottom: 5px; }
      .skills-container { display: flex; flex-wrap: wrap; gap: 5px; }
      .skill-tag { background: #f3f4f6; color: #111; padding: 2px 8px; border-radius: 3px; font-size: 9.5pt; border: 1px solid #e5e7eb; }
      .cert-item { font-size: 10pt; color: #333; margin-bottom: 2px; }
    `;
  }

  _buildSections(labels, data, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML) {
    let html = '';
    if (data.summary) html += `<div class="section"><div class="section-title">${labels.summary}</div><div class="summary-text">${data.summary}</div></div>`;
    if (expHTML) html += `<div class="section"><div class="section-title">${labels.experience}</div>${expHTML}</div>`;
    if (eduHTML) html += `<div class="section"><div class="section-title">${labels.education}</div>${eduHTML}</div>`;
    if (skillsHTML) html += `<div class="section"><div class="section-title">${labels.skills}</div><div class="skills-container">${skillsHTML}</div></div>`;
    if (certsHTML) html += `<div class="section"><div class="section-title">${labels.certifications}</div>${certsHTML}</div>`;
    if (langsHTML) html += `<div class="section"><div class="section-title">${labels.languages}</div><div class="skills-container">${langsHTML}</div></div>`;
    return html;
  }

  // ===== TEMPLATE 1: CLASSIC =====
  _classicTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML) {
    return `<!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="UTF-8"><style>
      ${this._baseCSS(dir, align, isAr)}
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
      .header h1 { font-size: 20pt; color: #000; letter-spacing: 1px; margin-bottom: 4px; }
      .subtitle { font-size: 11pt; color: #333; }
      .contact-info { text-align: center; font-size: 9.5pt; color: #444; margin-top: 4px; }
      .section-title { font-size: 11pt; font-weight: 700; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    </style></head><body>
      <div class="header">
        <h1>${data.fullName || ''}</h1>
        ${data.jobTitle ? `<div class="subtitle">${data.jobTitle}</div>` : ''}
        ${contactParts.length ? `<div class="contact-info">${contactParts.join(' | ')}</div>` : ''}
      </div>
      ${this._buildSections(labels, data, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML)}
    </body></html>`;
  }

  // ===== TEMPLATE 2: PROFESSIONAL =====
  _professionalTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML) {
    return `<!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="UTF-8"><style>
      ${this._baseCSS(dir, align, isAr)}
      .header { text-align: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 3px solid #000; }
      .header h1 { font-size: 22pt; color: #000; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 4px; }
      .subtitle { font-size: 11pt; color: #333; font-weight: 500; }
      .contact-info { font-size: 9.5pt; color: #555; margin-top: 6px; }
      .section-title { font-size: 11.5pt; font-weight: 800; color: #000; background: #f0f0f0; padding: 4px 10px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
      .skill-tag { background: #000; color: #fff; padding: 3px 10px; border-radius: 2px; border: none; }
    </style></head><body>
      <div class="header">
        <h1>${data.fullName || ''}</h1>
        ${data.jobTitle ? `<div class="subtitle">${data.jobTitle}</div>` : ''}
        ${contactParts.length ? `<div class="contact-info">${contactParts.join(' • ')}</div>` : ''}
      </div>
      ${this._buildSections(labels, data, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML)}
    </body></html>`;
  }

  // ===== TEMPLATE 3: MODERN =====
  _modernTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML) {
    const borderSide = isAr ? 'border-right' : 'border-left';
    return `<!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="UTF-8"><style>
      ${this._baseCSS(dir, align, isAr)}
      body { ${borderSide}: 4px solid #000; padding-${isAr ? 'right' : 'left'}: 20px; }
      .header { margin-bottom: 14px; }
      .header h1 { font-size: 20pt; color: #000; margin-bottom: 2px; }
      .subtitle { font-size: 11pt; color: #555; }
      .contact-info { font-size: 9.5pt; color: #666; margin-top: 4px; }
      .section-title { font-size: 10.5pt; font-weight: 700; color: #000; border-bottom: 2px solid #000; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase; }
    </style></head><body>
      <div class="header">
        <h1>${data.fullName || ''}</h1>
        ${data.jobTitle ? `<div class="subtitle">${data.jobTitle}</div>` : ''}
        ${contactParts.length ? `<div class="contact-info">${contactParts.join(' | ')}</div>` : ''}
      </div>
      ${this._buildSections(labels, data, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML)}
    </body></html>`;
  }

  // ===== TEMPLATE 4: EXECUTIVE =====
  _executiveTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML) {
    return `<!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="UTF-8"><style>
      ${this._baseCSS(dir, align, isAr)}
      .header { text-align: center; margin-bottom: 16px; }
      .header h1 { font-size: 24pt; color: #000; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px; }
      .subtitle { font-size: 10.5pt; color: #555; letter-spacing: 2px; }
      .contact-info { font-size: 9.5pt; color: #777; margin-top: 6px; letter-spacing: 0.5px; }
      .divider { height: 1px; background: #ccc; margin: 10px 0; }
      .section-title { font-size: 10pt; font-weight: 600; color: #000; letter-spacing: 2px; text-transform: uppercase; padding-bottom: 4px; margin-bottom: 6px; border-bottom: 1px solid #ddd; }
      .skill-tag { background: transparent; border: 1px solid #999; color: #333; }
    </style></head><body>
      <div class="header">
        <h1>${data.fullName || ''}</h1>
        ${data.jobTitle ? `<div class="subtitle">${data.jobTitle}</div>` : ''}
        <div class="divider"></div>
        ${contactParts.length ? `<div class="contact-info">${contactParts.join(' · ')}</div>` : ''}
      </div>
      ${this._buildSections(labels, data, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML)}
    </body></html>`;
  }

  // ===== TEMPLATE 5: WITH PHOTO =====
  _photoTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML) {
    const photoHTML = data.photoBase64
      ? `<img src="${data.photoBase64}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #333;">`
      : `<div style="width:80px;height:80px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:30px;border:2px solid #333;">👤</div>`;

    return `<!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="UTF-8"><style>
      ${this._baseCSS(dir, align, isAr)}
      .header { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #000; }
      .header-text { flex: 1; }
      .header h1 { font-size: 20pt; color: #000; margin-bottom: 2px; }
      .subtitle { font-size: 11pt; color: #444; }
      .contact-info { font-size: 9.5pt; color: #555; margin-top: 4px; }
      .section-title { font-size: 11pt; font-weight: 700; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase; }
    </style></head><body>
      <div class="header">
        ${photoHTML}
        <div class="header-text">
          <h1>${data.fullName || ''}</h1>
          ${data.jobTitle ? `<div class="subtitle">${data.jobTitle}</div>` : ''}
          ${contactParts.length ? `<div class="contact-info">${contactParts.join(' | ')}</div>` : ''}
        </div>
      </div>
      ${this._buildSections(labels, data, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML)}
    </body></html>`;
  }

  // ===== TEMPLATE 6: TWO COLUMN =====
  _twoColumnTemplate(data, labels, dir, align, isAr, contactParts, expHTML, eduHTML, skillsHTML, certsHTML, langsHTML) {
    const photoHTML = data.photoBase64
      ? `<img src="${data.photoBase64}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #555;">`
      : `<div style="width:90px;height:90px;border-radius:50%;background:#555;display:flex;align-items:center;justify-content:center;font-size:36px;color:#ccc;">👤</div>`;

    // Sidebar content: photo, contact, skills, languages
    const sidebarSections = [];
    sidebarSections.push(`<div style="text-align:center;margin-bottom:14px;">${photoHTML}</div>`);

    if (contactParts.length) {
      sidebarSections.push(`<div class="sidebar-section"><div class="sidebar-title">${isAr ? 'التواصل' : 'Contact'}</div>`);
      contactParts.forEach(c => { sidebarSections.push(`<div class="sidebar-item">${c}</div>`); });
      sidebarSections.push('</div>');
    }
    if (skillsHTML) {
      sidebarSections.push(`<div class="sidebar-section"><div class="sidebar-title">${labels.skills}</div><div class="skills-container">${(data.skills || []).map(s => `<span class="sidebar-skill">${s}</span>`).join('')}</div></div>`);
    }
    if (langsHTML) {
      sidebarSections.push(`<div class="sidebar-section"><div class="sidebar-title">${labels.languages}</div>${(data.languages || []).map(l => `<div class="sidebar-item">${l}</div>`).join('')}</div>`);
    }
    if (certsHTML) {
      sidebarSections.push(`<div class="sidebar-section"><div class="sidebar-title">${labels.certifications}</div>${(data.certifications || []).map(c => `<div class="sidebar-item">• ${c}</div>`).join('')}</div>`);
    }

    // Main content: summary, experience, education
    let mainHTML = '';
    mainHTML += `<h1 style="font-size:20pt;color:#000;margin-bottom:2px;">${data.fullName || ''}</h1>`;
    if (data.jobTitle) mainHTML += `<div style="font-size:11pt;color:#444;margin-bottom:12px;">${data.jobTitle}</div>`;
    if (data.summary) mainHTML += `<div class="section"><div class="main-section-title">${labels.summary}</div><div class="summary-text">${data.summary}</div></div>`;
    if (expHTML) mainHTML += `<div class="section"><div class="main-section-title">${labels.experience}</div>${expHTML}</div>`;
    if (eduHTML) mainHTML += `<div class="section"><div class="main-section-title">${labels.education}</div>${eduHTML}</div>`;

    return `<!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="UTF-8"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 10.5pt; color: #1a1a1a; line-height: 1.5; direction: ${dir}; }
      .container { display: flex; min-height: 100vh; }
      .sidebar { width: 200px; background: #2d2d2d; color: #e0e0e0; padding: 20px 14px; }
      .main { flex: 1; padding: 20px 24px; text-align: ${align}; }
      .sidebar-title { font-size: 10pt; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #555; padding-bottom: 3px; margin-bottom: 6px; margin-top: 12px; }
      .sidebar-item { font-size: 9.5pt; color: #ccc; margin-bottom: 3px; word-break: break-all; }
      .sidebar-skill { display: inline-block; background: #444; color: #ddd; padding: 2px 7px; border-radius: 3px; font-size: 9pt; margin: 2px 1px; }
      .sidebar-section { margin-bottom: 4px; }
      .section { margin-bottom: 12px; }
      .main-section-title { font-size: 11pt; font-weight: 700; color: #000; border-bottom: 2px solid #000; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase; }
      .summary-text { font-size: 10pt; color: #333; line-height: 1.6; }
      .exp-item { margin-bottom: 10px; }
      .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
      .exp-title { font-weight: 700; font-size: 10.5pt; }
      .exp-company { color: #444; font-size: 10pt; }
      .exp-date { font-size: 9.5pt; color: #666; white-space: nowrap; }
      .exp-desc { font-size: 10pt; color: #333; padding-${isAr ? 'right' : 'left'}: 10px; line-height: 1.6; }
      .edu-item { margin-bottom: 5px; }
      .skills-container { display: flex; flex-wrap: wrap; gap: 3px; }
    </style></head><body>
      <div class="container">
        <div class="sidebar">${sidebarSections.join('')}</div>
        <div class="main">${mainHTML}</div>
      </div>
    </body></html>`;
  }
}

module.exports = new PDFGenerator();

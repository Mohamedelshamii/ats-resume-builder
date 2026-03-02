// ===== STATE =====
let currentStep = 1;
let totalSteps = 8;
let currentLang = 'ar';
let selectedSpecialization = '';
let selectedTemplate = 'classic';
let selectedColor = '#2563eb';
let userPhotoBase64 = '';
let skills = [];
let experienceCount = 0;
let educationCount = 0;

// ===== LANGUAGE TOGGLE =====
function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  const btn = document.getElementById('langToggle');
  btn.textContent = currentLang === 'ar' ? 'English' : 'العربية';
  if (currentLang === 'en') {
    document.body.classList.add('ltr');
    document.body.dir = 'ltr';
    document.documentElement.lang = 'en';
  } else {
    document.body.classList.remove('ltr');
    document.body.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }
  document.querySelectorAll('[data-ar]').forEach(el => {
    const text = el.getAttribute(`data-${currentLang}`);
    if (text) el.textContent = text;
  });
  document.querySelectorAll('.spec-card').forEach(card => {
    const nameEl = card.querySelector('.spec-name');
    if (nameEl) nameEl.textContent = nameEl.getAttribute(`data-${currentLang}`);
  });
}

// ===== STEP NAVIGATION =====
function updateProgress() {
  const steps = document.querySelectorAll('.step-item');
  const lines = document.querySelectorAll('.step-line');
  steps.forEach((step, i) => {
    const num = i + 1;
    step.classList.remove('active', 'completed');
    if (num === currentStep) step.classList.add('active');
    else if (num < currentStep) step.classList.add('completed');
  });
  lines.forEach((line, i) => {
    line.classList.remove('completed');
    if (i + 1 < currentStep) line.classList.add('completed');
  });
}

function showStep(step) {
  document.querySelectorAll('.step-content').forEach(el => el.style.display = 'none');
  const target = document.getElementById(`step${step}`);
  if (target) {
    target.style.display = 'block';
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = 'fadeInUp 0.4s ease';
  }
  currentStep = step;
  updateProgress();
  if (step === 8) renderPreview();
}

function nextStep() {
  if (!validateCurrentStep()) return;
  if (currentStep < totalSteps) showStep(currentStep + 1);
}

function prevStep() {
  if (currentStep > 1) showStep(currentStep - 1);
}

// ===== VALIDATION =====
function validateCurrentStep() {
  switch (currentStep) {
    case 1:
      const manualInput = document.getElementById('manualSpecInput');
      if (manualInput && manualInput.value.trim()) {
        selectedSpecialization = manualInput.value.trim();
      }

      if (!selectedSpecialization) {
        showToast(currentLang === 'ar' ? 'يرجى إدخال أو اختيار تخصصك' : 'Please enter or select a specialization', 'error');
        return false;
      }
      return true;
    case 2:
      if (!selectedTemplate) {
        showToast(currentLang === 'ar' ? 'يرجى اختيار قالب' : 'Please select a template', 'error');
        return false;
      }
      return true;
    case 3:
      const name = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phoneVal = document.getElementById('phone').value.trim();

      if (!name) {
        showToast(currentLang === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter your name', 'error');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showToast(currentLang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', 'error');
        return false;
      }

      if (phoneVal && window.iti && !window.iti.isValidNumber()) {
        showToast(currentLang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح مع رمز الدولة' : 'Please enter a valid phone number with country code', 'error');
        return false;
      }

      return true;
    default:
      return true;
  }
}

// ===== SPECIALIZATION =====
function clearSpecSelection() {
  document.querySelectorAll('.spec-card').forEach(c => c.classList.remove('selected'));
  selectedSpecialization = '';
}

function selectSpec(el) {
  document.querySelectorAll('.spec-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const specAttr = currentLang === 'ar' ? 'data-spec' : 'data-spec-en';
  selectedSpecialization = el.getAttribute(specAttr) || el.getAttribute('data-spec');

  const manualInput = document.getElementById('manualSpecInput');
  if (manualInput) manualInput.value = '';
}

// ===== TEMPLATE SELECTION =====
function selectTemplate(el) {
  document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedTemplate = el.getAttribute('data-template');

  // Show photo upload for photo templates
  const photoGroup = document.getElementById('photoUploadGroup');
  const needsPhoto = (selectedTemplate === 'photo' || selectedTemplate === 'twocolumn');
  photoGroup.style.display = needsPhoto ? 'block' : 'none';
}

// ===== COLOR SELECTION =====
function selectColor(el) {
  document.querySelectorAll('.color-swatch').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.getAttribute('data-color');

  // Apply to document for live template preview updates
  document.documentElement.style.setProperty('--resume-accent', selectedColor);

  // Instantly apply to preview if visible
  const preview = document.getElementById('resumePreview');
  if (preview) {
    preview.style.setProperty('--resume-accent', selectedColor);
    // Force a re-render to update the HTML inline styles if any
    if (currentStep === 8) renderPreview();
  }
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    userPhotoBase64 = e.target.result;
    document.getElementById('photoPreviewSmall').innerHTML = `<img src="${userPhotoBase64}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);">`;
  };
  reader.readAsDataURL(file);
}

// ===== EXPERIENCE =====
function addExperience() {
  experienceCount++;
  const id = experienceCount;
  const container = document.getElementById('experienceEntries');
  const isAr = currentLang === 'ar';
  const html = `
    <div class="exp-entry" id="exp-${id}">
      <div class="exp-entry-header">
        <span class="exp-entry-title">${isAr ? 'خبرة' : 'Experience'} #${id}</span>
        <button class="remove-entry-btn" onclick="removeEntry('exp-${id}')">✕</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${isAr ? 'المسمى الوظيفي' : 'Job Title'}</label>
          <input type="text" class="form-input" id="expTitle-${id}">
        </div>
        <div class="form-group">
          <label class="form-label">${isAr ? 'اسم الشركة' : 'Company'}</label>
          <input type="text" class="form-input" id="expCompany-${id}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${isAr ? 'تاريخ البدء' : 'Start Date'}</label>
          <input type="month" class="form-input" id="expStart-${id}" onchange="validateDates(${id})">
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
            <span>${isAr ? 'تاريخ الانتهاء' : 'End Date'}</span>
            <label style="font-size:11px; font-weight:normal; display:flex; align-items:center; gap:4px; cursor:pointer;">
              <input type="checkbox" id="expPresent-${id}" onchange="toggleEndDate(${id})"> 
              ${isAr ? 'أعمل هنا حالياً' : 'Currently working here'}
            </label>
          </label>
          <input type="month" class="form-input" id="expEnd-${id}" onchange="validateDates(${id})">
        </div>
      </div>
      <div class="form-group">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label class="form-label" style="margin-bottom:0;">${isAr ? 'وصف المهام (استخدم - لعمل قائمة نقطية)' : 'Duties (Use - for bullet points)'}</label>
          <div style="display:flex; gap:8px;">
            <select class="form-input" style="padding:2px 6px; font-size:11px; border-radius:4px; height:auto;" onchange="insertPowerVerb(this, 'expDesc-${id}')">
              <option value="">${isAr ? 'أفعال قوية' : 'Power Verbs'}</option>
              <option value="${isAr ? 'أدرت ' : 'Managed '}">${isAr ? 'أدرت' : 'Managed'}</option>
              <option value="${isAr ? 'طورت ' : 'Developed '}">${isAr ? 'طورت' : 'Developed'}</option>
              <option value="${isAr ? 'قدت ' : 'Led '}">${isAr ? 'قدت' : 'Led'}</option>
              <option value="${isAr ? 'حققت ' : 'Achieved '}">${isAr ? 'حققت' : 'Achieved'}</option>
              <option value="${isAr ? 'حسّنت ' : 'Improved '}">${isAr ? 'حسّنت' : 'Improved'}</option>
              <option value="${isAr ? 'صممت ' : 'Designed '}">${isAr ? 'صممت' : 'Designed'}</option>
            </select>
          </div>
        </div>
        <textarea class="form-textarea" id="expDesc-${id}" rows="4" oninput="debouncedReview('expDesc-${id}', 'experience')" placeholder="${isAr ? '- طورت نظاماً...\n- أدرت فريقاً...' : '- Developed a system...\n- Managed a team...'}"></textarea>
        <div class="ai-review-result" id="review-expDesc-${id}"></div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

function removeEntry(entryId) {
  const el = document.getElementById(entryId);
  if (el) { el.style.animation = 'fadeInUp 0.3s ease reverse'; setTimeout(() => el.remove(), 200); }
}

// ===== EXPERIENCES HELPERS =====
function toggleEndDate(id) {
  const isPresent = document.getElementById(`expPresent-${id}`).checked;
  const endInput = document.getElementById(`expEnd-${id}`);
  if (isPresent) {
    endInput.disabled = true;
    endInput.value = '';
  } else {
    endInput.disabled = false;
  }
}

function validateDates(id) {
  const startInput = document.getElementById(`expStart-${id}`);
  const endInput = document.getElementById(`expEnd-${id}`);
  if (startInput.value && endInput.value && !endInput.disabled) {
    if (new Date(startInput.value) > new Date(endInput.value)) {
      showToast(currentLang === 'ar' ? 'تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء' : 'Start date must be before end date', 'error');
      endInput.value = '';
    }
  }
}

function insertPowerVerb(selectEl, textAreaId) {
  const val = selectEl.value;
  if (!val) return;
  const textarea = document.getElementById(textAreaId);
  if (!textarea) return;

  const startPos = textarea.selectionStart;
  const text = textarea.value;
  const prefix = text.substring(0, startPos);

  // Auto-add hyphen if on a new line and it's not there
  const lastLine = prefix.split('\\n').pop() || '';
  let insertText = val;
  if (!lastLine.trim().startsWith('-')) {
    insertText = '- ' + val;
  }

  textarea.value = text.substring(0, startPos) + insertText + text.substring(textarea.selectionEnd, text.length);
  const newPos = startPos + insertText.length;
  textarea.setSelectionRange(newPos, newPos);
  textarea.focus();

  selectEl.value = ''; // Reset select
  saveState();
  debouncedReview(textAreaId, 'experience');
}

// ===== EDUCATION =====
function addEducation() {
  educationCount++;
  const id = educationCount;
  const container = document.getElementById('educationEntries');
  const isAr = currentLang === 'ar';
  const html = `
    <div class="exp-entry" id="edu-${id}">
      <div class="exp-entry-header">
        <span class="exp-entry-title">${isAr ? 'مؤهل' : 'Education'} #${id}</span>
        <button class="remove-entry-btn" onclick="removeEntry('edu-${id}')">✕</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${isAr ? 'الدرجة العلمية' : 'Degree'}</label>
          <input type="text" class="form-input" id="eduDegree-${id}">
        </div>
        <div class="form-group">
          <label class="form-label">${isAr ? 'المؤسسة التعليمية' : 'Institution'}</label>
          <input type="text" class="form-input" id="eduInst-${id}">
        </div>
      </div>
      <div class="form-group" style="max-width:200px;">
        <label class="form-label">${isAr ? 'سنة التخرج' : 'Year'}</label>
        <input type="text" class="form-input" id="eduYear-${id}" placeholder="2024">
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

// ===== SKILLS =====
const roleSkills = {
  software: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Agile', 'REST APIs', 'AWS', 'Docker'],
  data: ['Python', 'SQL', 'Tableau', 'Power BI', 'Machine Learning', 'Data Visualization', 'Statistics', 'Excel'],
  design: ['Adobe Photoshop', 'Illustrator', 'Figma', 'UI/UX Design', 'Typography', 'Branding', 'HTML/CSS'],
  marketing: ['SEO', 'Google Analytics', 'Content Strategy', 'Social Media Marketing', 'Email Campaigns', 'CRM', 'Copywriting'],
  sales: ['B2B Sales', 'CRM', 'Negotiation', 'Lead Generation', 'Client Relations', 'Account Management', 'Cold Calling'],
  hr: ['Recruitment', 'Employee Relations', 'Performance Management', 'HRIS', 'Onboarding', 'Talent Acquisition'],
  customer_service: ['Communication', 'Conflict Resolution', 'CRM', 'Problem Solving', 'Time Management', 'Empathy', 'Active Listening'],
  teacher: ['Curriculum Development', 'Classroom Management', 'Lesson Planning', 'Special Education', 'Educational Technology', 'Assessment'],
  accountant: ['Financial Reporting', 'GAAP', 'QuickBooks', 'Tax Preparation', 'Reconciliation', 'Auditing', 'Excel (Advanced)'],
  admin: ['Office Management', 'Data Entry', 'Scheduling', 'Microsoft Office', 'Customer Service', 'Event Planning', 'Inventory Management']
};

function addSkill(skillName) {
  const input = document.getElementById('skillInput');
  const name = typeof skillName === 'string' ? skillName : input.value.trim();
  if (!name) return;
  if (skills.includes(name)) { showToast(currentLang === 'ar' ? 'المهارة موجودة بالفعل' : 'Skill already added', 'error'); return; }
  skills.push(name);
  renderSkills();
  if (typeof skillName !== 'string') input.value = '';
}

function removeSkill(idx) { skills.splice(idx, 1); renderSkills(); }

function renderSkills() {
  document.getElementById('skillsChips').innerHTML = skills.map((s, i) => `
    <div class="skill-chip">${s}<span class="remove-skill" onclick="removeSkill(${i})">✕</span></div>
  `).join('');
  renderSuggestedSkills();
}

function renderSuggestedSkills() {
  const container = document.getElementById('suggestedSkillsContainer');
  const chipsDiv = document.getElementById('suggestedSkillsChips');
  if (!container || !chipsDiv) return;

  if (!selectedSpecialization || !roleSkills[selectedSpecialization]) {
    container.style.display = 'none';
    return;
  }

  const suggested = roleSkills[selectedSpecialization].filter(s => !skills.includes(s));

  if (suggested.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  chipsDiv.innerHTML = suggested.map(s => `
    <div class="skill-chip" style="background:var(--bg-card); border-color:var(--primary); color:var(--primary); cursor:pointer;" onclick="addSkill('${s}')">+ ${s}</div>
  `).join('');
}

// ===== BULLET POINT FORMATTER =====
function formatText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      if (!inList) { html += '<ul style="padding-inline-start: 20px; margin: 4px 0;">'; inList = true; }
      html += `<li>${trimmed.substring(1).trim()}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (trimmed) html += `<div>${trimmed}</div>`;
    }
  });

  if (inList) html += '</ul>';
  return html;
}

// ===== COLLECT DATA =====
function collectResumeData() {
  const experiences = [];
  document.querySelectorAll('.exp-entry[id^="exp-"]').forEach(entry => {
    const id = entry.id.replace('exp-', '');
    const isPresent = document.getElementById(`expPresent-${id}`)?.checked;
    experiences.push({
      title: document.getElementById(`expTitle-${id}`)?.value || '',
      company: document.getElementById(`expCompany-${id}`)?.value || '',
      startDate: document.getElementById(`expStart-${id}`)?.value || '',
      endDate: isPresent ? '' : (document.getElementById(`expEnd-${id}`)?.value || ''),
      description: document.getElementById(`expDesc-${id}`)?.value || ''
    });
  });
  const educationList = [];
  document.querySelectorAll('.exp-entry[id^="edu-"]').forEach(entry => {
    const id = entry.id.replace('edu-', '');
    educationList.push({
      degree: document.getElementById(`eduDegree-${id}`)?.value || '',
      institution: document.getElementById(`eduInst-${id}`)?.value || '',
      year: document.getElementById(`eduYear-${id}`)?.value || ''
    });
  });
  experiences.sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    if (!a.endDate && b.endDate) return -1;
    if (a.endDate && !b.endDate) return 1;
    return new Date(b.startDate) - new Date(a.startDate);
  });

  educationList.sort((a, b) => {
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    return yearB - yearA;
  });

  const certs = (document.getElementById('certifications')?.value || '').split('\n').map(c => c.trim()).filter(Boolean);
  const langs = (document.getElementById('languages')?.value || '').split('،').join(',').split(',').map(l => l.trim()).filter(Boolean);

  return {
    fullName: document.getElementById('fullName')?.value || '',
    jobTitle: document.getElementById('jobTitle')?.value || '',
    email: document.getElementById('email')?.value || '',
    phone: window.iti ? window.iti.getNumber() : (document.getElementById('phone')?.value || ''),
    location: (document.getElementById('countrySelect')?.value && document.getElementById('citySelect')?.value)
      ? `${document.getElementById('citySelect').value}, ${document.getElementById('countrySelect').value}`
      : document.getElementById('countrySelect')?.value || '',
    linkedin: document.getElementById('linkedin')?.value || '',
    github: document.getElementById('github')?.value || '',
    portfolio: document.getElementById('portfolio')?.value || '',
    summary: document.getElementById('summary')?.value || '',
    specialization: selectedSpecialization,
    template: selectedTemplate,
    primaryColor: selectedColor,
    photoBase64: userPhotoBase64,
    experience: experiences,
    education: educationList,
    skills: [...skills],
    certifications: certs,
    languages: langs,
    language: currentLang
  };
}

// ===== PREVIEW =====
function renderPreview() {
  const data = collectResumeData();
  const isAr = currentLang === 'ar';
  const container = document.getElementById('resumePreview');
  container.style.direction = isAr ? 'rtl' : 'ltr';
  container.style.setProperty('--resume-accent', data.primaryColor || '#2563eb');

  const labels = isAr
    ? { summary: 'الملخص المهني', experience: 'الخبرة العملية', education: 'التعليم', skills: 'المهارات', certs: 'الشهادات', langs: 'اللغات', present: 'حتى الآن' }
    : { summary: 'Professional Summary', experience: 'Work Experience', education: 'Education', skills: 'Skills', certs: 'Certifications', langs: 'Languages', present: 'Present' };

  const contactParts = [
    data.email,
    data.phone,
    data.location,
    data.linkedin ? `<a href="${data.linkedin}" target="_blank" style="color:var(--resume-accent);text-decoration:none;">LinkedIn</a>` : null,
    data.github ? `<a href="${data.github}" target="_blank" style="color:var(--resume-accent);text-decoration:none;">GitHub</a>` : null,
    data.portfolio ? `<a href="${data.portfolio}" target="_blank" style="color:var(--resume-accent);text-decoration:none;">Portfolio</a>` : null
  ].filter(Boolean);

  let html = '';

  // Photo for photo templates
  if ((data.template === 'photo' || data.template === 'twocolumn') && data.photoBase64) {
    html += `<div style="text-align:center;margin-bottom:10px;"><img src="${data.photoBase64}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;"></div>`;
  }

  html += `<h1>${data.fullName || '---'}</h1>`;
  if (data.jobTitle) html += `<div class="preview-subtitle">${data.jobTitle}</div>`;
  if (contactParts.length) html += `<div class="preview-contact">${contactParts.join(' | ')}</div>`;

  if (data.summary) {
    html += `<div class="preview-section-title" style="color:var(--resume-accent); border-bottom-color:var(--resume-accent)">${labels.summary}</div>`;
    html += `<p style="font-size:13px;color:#374151;">${data.summary}</p>`;
  }

  if (data.experience.length > 0) {
    html += `<div class="preview-section-title" style="color:var(--resume-accent); border-bottom-color:var(--resume-accent)">${labels.experience}</div>`;
    data.experience.forEach(exp => {
      if (!exp.title && !exp.company) return;
      html += `<div style="margin-bottom:10px;">
        <div class="preview-exp-header">
          <div><span class="preview-exp-title">${exp.title}</span>${exp.company ? ' — ' + exp.company : ''}</div>
          <span class="preview-exp-date">${exp.startDate || ''} - ${exp.endDate || labels.present}</span>
        </div>
        <div class="preview-exp-desc">${(exp.description || '').replace(/\n/g, '<br>')}</div>
      </div>`;
    });
  }

  if (data.education.length > 0) {
    html += `<div class="preview-section-title" style="color:var(--resume-accent); border-bottom-color:var(--resume-accent)">${labels.education}</div>`;
    data.education.forEach(edu => {
      if (!edu.degree && !edu.institution) return;
      html += `<div style="margin-bottom:6px;">
        <div class="preview-exp-header">
          <div><span class="preview-exp-title">${edu.degree}</span>${edu.institution ? ' — ' + edu.institution : ''}</div>
          <span class="preview-exp-date">${edu.year || ''}</span>
        </div>
      </div>`;
    });
  }

  if (data.skills.length > 0) {
    html += `<div class="preview-section-title" style="color:var(--resume-accent); border-bottom-color:var(--resume-accent)">${labels.skills}</div>`;
    html += `<div class="preview-skills-list">${data.skills.map(s => `<span class="preview-skill-tag" style="background-color: var(--resume-accent); color: white; opacity: 0.9;">${s}</span>`).join('')}</div>`;
  }

  if (data.certifications.length > 0) {
    html += `<div class="preview-section-title" style="color:var(--resume-accent); border-bottom-color:var(--resume-accent)">${labels.certs}</div>`;
    data.certifications.forEach(c => { html += `<p style="font-size:13px;color:#374151;">• ${c}</p>`; });
  }

  if (data.languages.length > 0) {
    html += `<div class="preview-section-title" style="color:var(--resume-accent); border-bottom-color:var(--resume-accent)">${labels.langs}</div>`;
    html += `<div class="preview-skills-list">${data.languages.map(l => `<span class="preview-skill-tag">${l}</span>`).join('')}</div>`;
  }

  container.innerHTML = html;
}

// ===== ATS CHECK =====
async function checkATS() {
  const btn = document.getElementById('atsCheckBtn');
  btn.classList.add('loading');
  btn.disabled = true;
  try {
    const resumeData = collectResumeData();
    const targetJobInput = document.getElementById('targetJob')?.value.trim();
    const targetJob = targetJobInput ? targetJobInput : resumeData.jobTitle;

    const response = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData, targetJob, language: currentLang })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const scoreCard = document.getElementById('atsScoreCard');
    scoreCard.style.display = 'block';
    const result = data.result;
    const scoreMatch = result.match(/SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

    const circle = document.getElementById('atsScoreCircle');
    circle.textContent = `${score}%`;
    circle.className = 'ats-score-circle';
    if (score >= 80) circle.classList.add('high');
    else if (score >= 60) circle.classList.add('medium');
    else circle.classList.add('low');

    const tipsSection = result.split('TIPS:')[1]?.split('KEYWORDS:')[0] || '';
    const tips = tipsSection.split('\n').filter(l => l.trim().startsWith('-'));
    const keywordsSection = result.split('KEYWORDS:')[1] || '';
    const keywords = keywordsSection.split('\n').filter(l => l.trim().startsWith('-'));

    document.getElementById('atsTips').innerHTML = `
      ${tips.map(t => `<div class="ats-tip">${t.trim()}</div>`).join('')}
      ${keywords.length > 0 ? `<div class="ats-tip" style="margin-top:10px; border-color: var(--accent);">
        <strong style="color:var(--accent-light);">${currentLang === 'ar' ? 'كلمات مفتاحية مقترحة:' : 'Suggested Keywords:'}</strong><br>
        ${keywords.map(k => k.replace('-', '').trim()).join(' • ')}
      </div>` : ''}
    `;
    showToast(currentLang === 'ar' ? 'تم تحليل التوافق مع ATS!' : 'ATS analysis complete!', 'success');
  } catch (err) {
    showToast(err.message || (currentLang === 'ar' ? 'فشل في الفحص' : 'Check failed'), 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ===== PDF DOWNLOAD =====
async function downloadPDF() {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  loadingText.textContent = currentLang === 'ar' ? 'جاري إنشاء ملف PDF...' : 'Generating PDF...';
  overlay.classList.add('active');
  try {
    const resumeData = collectResumeData();
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    window.open(data.downloadUrl, '_blank');
    showToast(currentLang === 'ar' ? 'تم إنشاء PDF بنجاح!' : 'PDF generated!', 'success');
  } catch (err) {
    console.error('PDF Error:', err);
    showToast(err.message || (currentLang === 'ar' ? 'فشل في إنشاء PDF' : 'PDF failed'), 'error');
  } finally {
    overlay.classList.remove('active');
  }
}

// ===== HTML EXPORT =====
async function viewAsHTML() {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  loadingText.textContent = currentLang === 'ar' ? 'جاري التحضير...' : 'Preparing...';
  overlay.classList.add('active');
  try {
    const resumeData = collectResumeData();
    const response = await fetch('/api/generate-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    window.open(data.viewUrl, '_blank');
    showToast(currentLang === 'ar' ? 'اضغط Ctrl+P للحفظ كـ PDF' : 'Press Ctrl+P to save as PDF', 'success');
  } catch (err) {
    console.error('HTML Error:', err);
    showToast(err.message || (currentLang === 'ar' ? 'فشل' : 'Failed'), 'error');
  } finally {
    overlay.classList.remove('active');
  }
}

// ===== LIVE AI FIELD REVIEW (DEBOUNCED) =====
const _reviewTimers = {};
const _reviewCache = {};

function debouncedReview(fieldId, fieldType) {
  if (_reviewTimers[fieldId]) clearTimeout(_reviewTimers[fieldId]);
  _reviewTimers[fieldId] = setTimeout(() => {
    reviewFieldLive(fieldId, fieldType);
  }, 2000); // 2 seconds after user stops typing
}

async function reviewFieldLive(fieldId, fieldType) {
  const el = document.getElementById(fieldId);
  let content = '';

  if (fieldType === 'skills') {
    content = skills.join(', ');
  } else if (el) {
    content = el.value.trim();
  }

  if (!content || content.length < 3) {
    // Hide review if content is too short
    const resultDiv = document.getElementById(`review-${fieldId}`);
    if (resultDiv) resultDiv.classList.remove('visible');
    return;
  }

  // Skip if same content was already reviewed
  if (_reviewCache[fieldId] === content) return;
  _reviewCache[fieldId] = content;

  const resultDiv = document.getElementById(`review-${fieldId}`);
  if (resultDiv) {
    resultDiv.innerHTML = `<span style="color:var(--accent-light);font-size:12px;">${currentLang === 'ar' ? '⏳ جاري المراجعة...' : '⏳ Reviewing...'}</span>`;
    resultDiv.classList.add('visible');
  }

  try {
    const response = await fetch('/api/review-field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldType,
        content,
        jobTitle: document.getElementById('jobTitle')?.value || '',
        specialization: selectedSpecialization,
        language: currentLang
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    if (resultDiv) {
      const icon = data.source === 'ai' ? '🤖' : '📋';
      resultDiv.innerHTML = `<span class="review-close" onclick="this.parentElement.classList.remove('visible')">✕</span>${icon} ${data.review}`;
      resultDiv.classList.add('visible');
    }
  } catch (err) {
    // Silently fail for live review — don't annoy user
    if (resultDiv) resultDiv.classList.remove('visible');
  }
}

// Wire up live review to static fields
function setupLiveReview() {
  const jobTitleEl = document.getElementById('jobTitle');
  if (jobTitleEl) jobTitleEl.addEventListener('input', () => debouncedReview('jobTitle', 'jobTitle'));

  const summaryEl = document.getElementById('summary');
  if (summaryEl) summaryEl.addEventListener('input', () => debouncedReview('summary', 'summary'));
}

// ===== TOAST =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== LOCAL STORAGE PERSISTENCE =====
const STORAGE_KEY = 'ats_resume_data';

function saveState() {
  try {
    // Collect all input values
    const inputs = {};
    document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(el => {
      if (el.id) {
        if (el.id === 'phone' && window.iti) {
          inputs[el.id] = window.iti.getNumber();
        } else {
          inputs[el.id] = el.type === 'checkbox' ? el.checked : el.value;
        }
      }
    });

    const state = {
      currentStep,
      currentLang,
      selectedSpecialization,
      selectedTemplate,
      selectedColor,
      userPhotoBase64,
      skills: [...skills],
      experienceCount,
      educationCount,
      inputs,
      savedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore quota errors */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);

    // Skip if data is older than 24 hours
    if (Date.now() - state.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    // Restore language
    if (state.currentLang && state.currentLang !== currentLang) {
      toggleLanguage();
    }

    // Restore specialization
    if (state.selectedSpecialization) {
      selectedSpecialization = state.selectedSpecialization;
      let foundCard = false;
      document.querySelectorAll('.spec-card').forEach(card => {
        const specAr = card.getAttribute('data-spec');
        const specEn = card.getAttribute('data-spec-en');
        if (specAr === selectedSpecialization || specEn === selectedSpecialization) {
          card.classList.add('selected');
          foundCard = true;
        }
      });
      if (!foundCard) {
        const manualInput = document.getElementById('manualSpecInput');
        if (manualInput) manualInput.value = selectedSpecialization;
      }
    }

    // Restore template
    if (state.selectedTemplate) {
      selectedTemplate = state.selectedTemplate;
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
      const tCard = document.querySelector(`[data-template="${selectedTemplate}"]`);
      if (tCard) tCard.classList.add('selected');
      // Show photo upload if needed
      const needsPhoto = (selectedTemplate === 'photo' || selectedTemplate === 'twocolumn');
      const photoGroup = document.getElementById('photoUploadGroup');
      if (photoGroup) photoGroup.style.display = needsPhoto ? 'block' : 'none';
    }

    // Restore color
    if (state.selectedColor) {
      selectedColor = state.selectedColor;
      document.querySelectorAll('.color-swatch').forEach(c => c.classList.remove('selected'));
      const cSwatch = document.querySelector(`[data-color="${selectedColor}"]`);
      if (cSwatch) cSwatch.classList.add('selected');
      document.documentElement.style.setProperty('--resume-accent', selectedColor);
    }

    // Restore photo
    if (state.userPhotoBase64) {
      userPhotoBase64 = state.userPhotoBase64;
      const preview = document.getElementById('photoPreviewSmall');
      if (preview) preview.innerHTML = `<img src="${userPhotoBase64}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);">`;
    }

    // Restore experience entries
    const expCount = state.experienceCount || 1;
    while (experienceCount < expCount) addExperience();

    // Restore education entries
    const eduCount = state.educationCount || 1;
    while (educationCount < eduCount) addEducation();

    // Restore skills
    if (state.skills && state.skills.length > 0) {
      skills = state.skills;
      renderSkills();
    }

    // Restore all input values (after entries are created)
    if (state.inputs) {
      setTimeout(() => {
        Object.keys(state.inputs).forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            if (el.type === 'checkbox') el.checked = state.inputs[id];
            else if (id !== 'phone') el.value = state.inputs[id]; // phone handled separate

            if (id === 'countrySelect') {
              loadCities();
            }
          }
        });

        // Ensure citySelect gets assigned after loadCities runs
        if (state.inputs['citySelect']) {
          const cityEl = document.getElementById('citySelect');
          if (cityEl) cityEl.value = state.inputs['citySelect'];
        }

        // Restore phone if iti available
        if (state.inputs['phone'] && window.iti) {
          window.iti.setNumber(state.inputs['phone']);
        }
        // Re-run any UI toggles
        for (let i = 1; i <= experienceCount; i++) {
          if (document.getElementById(`expPresent-${i}`)) toggleEndDate(i);
        }
      }, 50);
    }

    // Navigate to saved step
    if (state.currentStep && state.currentStep > 1) {
      setTimeout(() => showStep(state.currentStep), 100);
    }

    return true;
  } catch (e) {
    console.error('Load state error:', e);
    return false;
  }
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

// Auto-save on any input change
function setupAutoSave() {
  document.addEventListener('input', () => saveState());
  document.addEventListener('change', () => saveState());
  // Also save when navigating steps
  const origShowStep = showStep;
  // Save state every time step changes — override via wrapper
}

// ===== RESET ALL =====
function resetAll() {
  const msg = currentLang === 'ar' ? 'هل أنت متأكد من إعادة تعيين جميع الحقول؟' : 'Are you sure you want to reset all fields?';
  if (!confirm(msg)) return;

  // Clear localStorage
  clearSavedState();

  // Reload the page to guarantee a completely fresh start at Step 1
  location.reload();
}
// ===== SUMMARY ENHANCEMENTS =====
const summaryTemplates = {
  software: {
    en: "Innovative Software Engineer with 5+ years of experience in designing, developing, and deploying scalable web applications. Proficient in modern JavaScript frameworks and scalable backend architectures. Committed to writing clean, maintainable code and solving complex technical challenges.",
    ar: "مهندس برمجيات مبتكر يتمتع بخبرة تزيد عن 5 سنوات في تصميم وتطوير تطبيقات الويب القابلة للتوسع. متمرس في أطر عمل جافا سكريبت الحديثة وتصميمات الواجهات الخلفية. ملتزم بكتابة كود نظيف وقابل للصيانة وحل التحديات التقنية المعقدة."
  },
  data: {
    en: "Detail-oriented Data Analyst with a strong background in statistical analysis, data mining, and visualization. Proven ability to transform complex datasets into actionable business insights that drive growth and optimize operations.",
    ar: "محلل بيانات دقيق يتمتع بخلفية قوية في التحليل الإحصائي وتنظيف البيانات وبناء لوحات البيانات. قدرة مثبتة على تحويل مجموعات البيانات المعقدة إلى رؤى أعمال قابلة للتنفيذ تدفع النمو وتحسن العمليات."
  },
  design: {
    en: "Creative Graphic Designer with a passion for visual storytelling and brand identity. Experienced in delivering compelling designs across digital and print media, translating marketing objectives into engaging visual concepts.",
    ar: "مصمم جرافيك مبدع شغوف بالسرد البصري وهوية العلامة التجارية. ذو خبرة في تقديم تصميمات مقنعة عبر الوسائط الرقمية والمطبوعة، وترجمة أهداف التسويق إلى مفاهيم بصرية جذابة."
  },
  marketing: {
    en: "Results-driven Marketing Specialist with expertise in digital campaigns, SEO, and content strategy. Adept at analyzing market trends to optimize performance and increase brand awareness across multiple channels.",
    ar: "أخصائي تسويق موجه نحو النتائج، ذو خبرة في الحملات الرقمية وتحسين محركات البحث واستراتيجية المحتوى. بارع في تحليل اتجاهات السوق لتحسين الأداء وزيادة الوعي بالعلامة التجارية عبر قنوات متعددة."
  },
  sales: {
    en: "Dynamic Sales Executive with a track record of exceeding revenue targets and building lasting client relationships. Skilled in negotiation, strategic territory management, and delivering high-impact presentations.",
    ar: "تنفيذي مبيعات ديناميكي يمتلك سجلاً حافلاً في تجاوز أهداف الإيرادات وبناء علاقات دائمة مع العملاء. ماهر في التفاوض والإدارة الاستراتيجية وتقديم عروض تقديمية عالية التأثير."
  },
  hr: {
    en: "Strategic HR Professional specializing in talent acquisition, employee relations, and organizational development. Dedicated to fostering an inclusive workplace culture that drives employee engagement and company success.",
    ar: "متخصص موارد بشرية يركز على استقطاب المواهب وعلاقات الموظفين والتطوير التنظيمي. مكرس لتعزيز ثقافة عمل شاملة تدفع مشاركة الموظفين ونجاح الشركة."
  },
  customer_service: {
    en: "Empathetic Customer Service Representative with a proven history of resolving complex inquiries and ensuring high client satisfaction. Excellent communicator adept at maintaining a positive attitude in fast-paced environments.",
    ar: "ممثل خدمة عملاء متعاطف يمتلك تاريخًا حافلًا في حل الاستفسارات المعقدة وضمان رضا العملاء العالي. متواصل ممتاز وبارع في الحفاظ على موقف إيجابي في بيئات العمل السريعة."
  },
  teacher: {
    en: "Dedicated Educator with a passion for creating engaging, student-centered learning environments. Skilled in curriculum development, classroom management, and fostering academic growth in diverse student populations.",
    ar: "معلم مكرس شغوف بخلق بيئات تعليمية جذابة تتمحور حول الطالب. ماهر في تطوير المناهج وإدارة الفصول الدراسية وتعزيز النمو الأكاديمي للطلاب بمختلف مستوياتهم."
  },
  accountant: {
    en: "Meticulous Financial Accountant with comprehensive experience in ledger management, financial reporting, and tax compliance. Strong analytical skills with a focus on streamlining processes and ensuring fiscal accuracy.",
    ar: "محاسب مالي دقيق يمتلك خبرة شاملة في إدارة الدفاتر والتقارير المالية والامتثال الضريبي. مهارات تحليلية قوية مع التركيز على تبسيط العمليات وضمان الدقة المالية."
  },
  admin: {
    en: "Organized Administrative Assistant adept at managing office operations, executive scheduling, and document control. Proactive problem-solver dedicated to ensuring organizational efficiency and seamless daily workflows.",
    ar: "مساعد إداري منظم وبارع في إدارة عمليات المكتب وجدولة المواعيد الرئاسية ومراقبة المستندات. مبادر في حل المشكلات ومكرس لضمان الكفاءة التنظيمية وسير العمل اليومي بسلاسة."
  }
};

function applySummaryTemplate() {
  const select = document.getElementById('summaryTemplate');
  const val = select.value;
  if (!val || !summaryTemplates[val]) return;

  const text = summaryTemplates[val][currentLang];
  const summaryEl = document.getElementById('summary');

  if (summaryEl.value.trim() !== '') {
    const confirmMsg = currentLang === 'ar' ? 'هل تريد استبدال الملخص الحالي بهذا النموذج؟' : 'Do you want to replace your current summary with this template?';
    if (!confirm(confirmMsg)) {
      select.value = "";
      return;
    }
  }

  summaryEl.value = text;
  saveState();
  debouncedReview('summary', 'summary');
}

async function improveSummaryWithAI() {
  const summaryEl = document.getElementById('summary');
  const text = summaryEl.value.trim();
  const jobTitle = document.getElementById('jobTitle')?.value.trim();

  if (!text) {
    showToast(
      currentLang === 'ar' ? 'يرجى كتابة بعض الجمل في الملخص أولاً ليقوم الذكاء الاصطناعي بتحسينها.' : 'Please write a few sentences in the summary first for the AI to improve.',
      'error'
    );
    return;
  }

  const btn = document.getElementById('improveSummaryBtn');
  const origHTML = btn.innerHTML;
  btn.innerHTML = currentLang === 'ar' ? '⏳ جاري التحسين...' : '⏳ Improving...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/improve-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: text, jobTitle, language: currentLang })
    });

    if (!res.ok) throw new Error('API Error');
    const data = await res.json();

    if (data.improvedSummary) {
      summaryEl.value = data.improvedSummary;
      saveState();
      debouncedReview('summary', 'summary');
      showToast(
        currentLang === 'ar' ? 'تم تحسين الملخص بنجاح!' : 'Summary improved successfully!',
        'success'
      );
    }
  } catch (err) {
    console.error(err);
    showToast(
      currentLang === 'ar' ? 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.' : 'Failed to connect to AI service.',
      'error'
    );
  } finally {
    btn.innerHTML = origHTML;
    btn.disabled = false;
  }
}

// ===== INIT =====
window.iti = null;
window.countryData = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Intl-Tel-Input
  const phoneInput = document.getElementById("phone");
  if (phoneInput && typeof intlTelInput !== 'undefined') {
    window.iti = intlTelInput(phoneInput, {
      utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
      initialCountry: "auto",
      geoIpLookup: function (success, failure) {
        fetch("https://ipapi.co/json")
          .then(res => res.json())
          .then(data => success(data.country_code))
          .catch(() => success("us"));
      },
      separateDialCode: true
    });
  }

  // Fetch Country and City data
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries');
    const json = await response.json();
    if (!json.error) {
      window.countryData = json.data;
      const countrySelect = document.getElementById('countrySelect');
      if (countrySelect) {
        window.countryData.forEach(item => {
          const option = document.createElement('option');
          option.value = item.country;
          option.textContent = item.country;
          countrySelect.appendChild(option);
        });
      }
    }
  } catch (e) {
    console.error('Failed to load countries', e);
  }

  const loaded = loadState();
  if (!loaded) {
    addExperience();
    addEducation();
    // Auto-select classic template
    const classicCard = document.querySelector('[data-template="classic"]');
    if (classicCard) classicCard.classList.add('selected');
  }
  updateProgress();
  setupAutoSave();
  setupLiveReview();
});

// Override showStep to auto-save
const _origShowStep = showStep;

// Override selectSpec to auto-save
const _origSelectSpec = selectSpec;
selectSpec = function (el) { _origSelectSpec(el); saveState(); };

// Override selectTemplate to auto-save
const _origSelectTemplate = selectTemplate;
selectTemplate = function (el) { _origSelectTemplate(el); saveState(); };

// Override selectColor to auto-save
const _origSelectColor = selectColor;
selectColor = function (el) { _origSelectColor(el); saveState(); };

// Override addSkill to auto-save + live review
const _origAddSkill = addSkill;
addSkill = function (s) { _origAddSkill(s); saveState(); debouncedReview('skills', 'skills'); };

// Override removeSkill to auto-save + live review
const _origRemoveSkill = removeSkill;
removeSkill = function (i) { _origRemoveSkill(i); saveState(); debouncedReview('skills', 'skills'); };

// Override nextStep/prevStep to auto-save
const _origNextStep = nextStep;
nextStep = function () { _origNextStep(); saveState(); };

const _origPrevStep = prevStep;
prevStep = function () { _origPrevStep(); saveState(); };

// Location Helper
window.loadCities = function () {
  const countrySelect = document.getElementById('countrySelect');
  const citySelect = document.getElementById('citySelect');
  if (!countrySelect || !citySelect) return;

  citySelect.innerHTML = `<option value="">-- ${currentLang === 'ar' ? 'اختر المدينة' : 'Select City'} --</option>`;
  citySelect.disabled = true;

  const selectedCountry = countrySelect.value;
  if (!selectedCountry) return;

  const countryObj = window.countryData.find(c => c.country === selectedCountry);
  if (countryObj && countryObj.cities.length > 0) {
    citySelect.disabled = false;
    countryObj.cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
  }
};

// ===== AUTHENTICATION & DASHBOARD LOGIC =====
let currentUser = null;

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      document.getElementById('dbLoginBtn').style.display = 'none';
      document.getElementById('dbDashboardBtn').style.display = 'inline-block';
      document.getElementById('dbLogoutBtn').style.display = 'inline-block';
      document.getElementById('saveToDbFloatingBtn').style.display = currentStep === 8 ? 'block' : 'none';
    } else {
      currentUser = null;
      document.getElementById('dbLoginBtn').style.display = 'inline-block';
      document.getElementById('dbDashboardBtn').style.display = 'none';
      document.getElementById('dbLogoutBtn').style.display = 'none';
      document.getElementById('saveToDbFloatingBtn').style.display = 'none';
    }
  } catch (err) {
    console.error('Auth check fail:', err);
  }
}
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Also tie the floating save button to step change
const _origShowStepForAuth = showStep;
showStep = function (step) {
  _origShowStepForAuth(step);
  if (currentUser) {
    document.getElementById('saveToDbFloatingBtn').style.display = step === 8 ? 'block' : 'none';
  }
};

function openLoginModal() {
  document.getElementById('authModal').style.display = 'flex';
  document.getElementById('loginFormContainer').style.display = 'block';
  document.getElementById('registerFormContainer').style.display = 'none';
}

function toggleAuthMode() {
  const loginForm = document.getElementById('loginFormContainer');
  const regForm = document.getElementById('registerFormContainer');
  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
  }
}

async function loginUser() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showToast('Please enter credentials', 'error');

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (res.ok) {
    showToast(currentLang === 'ar' ? 'تم تسجيل الدخول' : 'Logged in');
    document.getElementById('authModal').style.display = 'none';
    await checkAuthStatus();
  } else {
    showToast(data.error || 'Login failed', 'error');
  }
}

async function registerUser() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  if (!name || !email || !password) return showToast('All fields required', 'error');

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();

  if (res.ok) {
    showToast(currentLang === 'ar' ? 'تم إنشاء الحساب' : 'Account created');
    document.getElementById('authModal').style.display = 'none';
    await checkAuthStatus();
  } else {
    showToast(data.error || 'Registration failed', 'error');
  }
}

async function logoutUser() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  document.getElementById('currentResumeId').value = '';
  await checkAuthStatus();
  resetAll();
}

async function showDashboard() {
  document.getElementById('dashboardModal').style.display = 'flex';
  const container = document.getElementById('resumesListContainer');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch('/api/resumes');
    const data = await res.json();

    if (data.resumes.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:40px;">${currentLang === 'ar' ? 'لا توجد سير ذاتية محفوظة بعد.' : 'No saved resumes yet.'}</p>`;
      return;
    }

    container.innerHTML = `<div style="display:grid; grid-template-columns:1fr; gap:12px;">
      ${data.resumes.map(r => `
        <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:8px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0 0 5px 0; color:var(--text-primary); font-size:16px;">${r.title}</h3>
            <span style="font-size:12px; color:var(--text-muted);">تحديث: ${new Date(r.updated_at).toLocaleDateString()}</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="loadResumeFromDB(${r.id})" class="nav-btn" style="padding:6px 14px; font-size:13px; background:var(--primary);">فتح</button>
            <button onclick="deleteResumeFromDB(${r.id})" class="nav-btn" style="padding:6px 14px; font-size:13px; background:var(--danger);">حذف</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  } catch (err) {
    container.innerHTML = '<p class="text-danger">Failed to load resumes</p>';
  }
}

async function loadResumeFromDB(id) {
  try {
    const res = await fetch(`/api/resumes/${id}`);
    const data = await res.json();
    if (res.ok) {
      // Reconstitute into localStorage essentially
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.resume.data));
      document.getElementById('currentResumeId').value = id;
      document.getElementById('dashboardModal').style.display = 'none';
      showToast(currentLang === 'ar' ? 'تم تحميل السيرة' : 'Resume loaded');
      location.reload(); // Refresh to ensure all fields catch the new DB state mapped to localStorage
    }
  } catch (e) {
    showToast('Failed to load resume', 'error');
  }
}

function startNewResume() {
  document.getElementById('currentResumeId').value = '';
  document.getElementById('dashboardModal').style.display = 'none';
  resetAll();
}

async function saveResumeToDB() {
  if (!currentUser) return openLoginModal();

  const currentId = document.getElementById('currentResumeId').value;
  const rawState = localStorage.getItem(STORAGE_KEY);
  if (!rawState) return showToast('No data to save', 'error');

  const stateData = JSON.parse(rawState);
  const fullName = document.getElementById('fullName')?.value || 'New Resume';
  const title = currentLang === 'ar' ? `سيرة ${fullName}` : `${fullName}'s Resume`;

  const method = currentId ? 'PUT' : 'POST';
  const url = currentId ? `/api/resumes/${currentId}` : '/api/resumes';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, data: stateData })
    });

    const data = await res.json();
    if (res.ok) {
      if (!currentId && data.id) {
        document.getElementById('currentResumeId').value = data.id;
      }
      showToast(currentLang === 'ar' ? 'تم حفظ السيرة في السحابة بنجاح!' : 'Saved to cloud successfully!', 'success');
    } else {
      showToast(data.error || 'Failed to save', 'error');
    }
  } catch (err) {
    showToast('Network error while saving', 'error');
  }
}

async function deleteResumeFromDB(id) {
  if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذه السيرة الذاتية السحابية؟' : 'Are you sure you want to delete this cloud resume?')) return;

  try {
    const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(currentLang === 'ar' ? 'تم الحذف' : 'Deleted');
      if (document.getElementById('currentResumeId').value == id) {
        document.getElementById('currentResumeId').value = '';
      }
      showDashboard(); // Refresh list
    } else {
      showToast('Delete failed', 'error');
    }
  } catch (e) {
    showToast('Network error', 'error');
  }
}

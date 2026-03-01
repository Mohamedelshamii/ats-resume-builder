// ===== STATE =====
let currentStep = 1;
let totalSteps = 8;
let currentLang = 'ar';
let selectedSpecialization = '';
let selectedTemplate = 'classic';
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
      if (!selectedSpecialization) {
        const customSpec = document.getElementById('customSpec');
        if (customSpec && customSpec.value.trim()) {
          selectedSpecialization = customSpec.value.trim();
        } else {
          showToast(currentLang === 'ar' ? 'يرجى اختيار تخصصك' : 'Please select a specialization', 'error');
          return false;
        }
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
      if (!name) { showToast(currentLang === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter your name', 'error'); return false; }
      if (!email) { showToast(currentLang === 'ar' ? 'يرجى إدخال البريد' : 'Please enter your email', 'error'); return false; }
      return true;
    default:
      return true;
  }
}

// ===== SPECIALIZATION =====
function selectSpec(el) {
  document.querySelectorAll('.spec-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const specAttr = currentLang === 'ar' ? 'data-spec' : 'data-spec-en';
  selectedSpecialization = el.getAttribute(specAttr) || el.getAttribute('data-spec');
  const customGroup = document.getElementById('customSpecGroup');
  customGroup.style.display = el.getAttribute('data-spec') === 'أخرى' ? 'block' : 'none';
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
          <input type="month" class="form-input" id="expStart-${id}">
        </div>
        <div class="form-group">
          <label class="form-label">${isAr ? 'تاريخ الانتهاء' : 'End Date'}</label>
          <input type="month" class="form-input" id="expEnd-${id}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${isAr ? 'وصف المهام والإنجازات' : 'Duties & Achievements'}</label>
        <textarea class="form-textarea" id="expDesc-${id}" rows="4" oninput="debouncedReview('expDesc-${id}', 'experience')"></textarea>
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
function addSkill(skillName) {
  const input = document.getElementById('skillInput');
  const name = skillName || input.value.trim();
  if (!name) return;
  if (skills.includes(name)) { showToast(currentLang === 'ar' ? 'المهارة موجودة بالفعل' : 'Skill already added', 'error'); return; }
  skills.push(name);
  renderSkills();
  if (!skillName) input.value = '';
}

function removeSkill(idx) { skills.splice(idx, 1); renderSkills(); }

function renderSkills() {
  document.getElementById('skillsChips').innerHTML = skills.map((s, i) => `
    <div class="skill-chip">${s}<span class="remove-skill" onclick="removeSkill(${i})">✕</span></div>
  `).join('');
}

// ===== COLLECT DATA =====
function collectResumeData() {
  const experiences = [];
  document.querySelectorAll('.exp-entry[id^="exp-"]').forEach(entry => {
    const id = entry.id.replace('exp-', '');
    experiences.push({
      title: document.getElementById(`expTitle-${id}`)?.value || '',
      company: document.getElementById(`expCompany-${id}`)?.value || '',
      startDate: document.getElementById(`expStart-${id}`)?.value || '',
      endDate: document.getElementById(`expEnd-${id}`)?.value || '',
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
  const certs = (document.getElementById('certifications')?.value || '').split('\n').map(c => c.trim()).filter(Boolean);
  const langs = (document.getElementById('languages')?.value || '').split('،').join(',').split(',').map(l => l.trim()).filter(Boolean);

  return {
    fullName: document.getElementById('fullName')?.value || '',
    jobTitle: document.getElementById('jobTitle')?.value || '',
    email: document.getElementById('email')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    location: document.getElementById('location')?.value || '',
    linkedin: document.getElementById('linkedin')?.value || '',
    summary: document.getElementById('summary')?.value || '',
    specialization: selectedSpecialization,
    template: selectedTemplate,
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

  const labels = isAr
    ? { summary: 'الملخص المهني', experience: 'الخبرة العملية', education: 'التعليم', skills: 'المهارات', certs: 'الشهادات', langs: 'اللغات', present: 'حتى الآن' }
    : { summary: 'Professional Summary', experience: 'Work Experience', education: 'Education', skills: 'Skills', certs: 'Certifications', langs: 'Languages', present: 'Present' };

  const contactParts = [data.email, data.phone, data.location, data.linkedin].filter(Boolean);

  let html = '';

  // Photo for photo templates
  if ((data.template === 'photo' || data.template === 'twocolumn') && data.photoBase64) {
    html += `<div style="text-align:center;margin-bottom:10px;"><img src="${data.photoBase64}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;"></div>`;
  }

  html += `<h1>${data.fullName || '---'}</h1>`;
  if (data.jobTitle) html += `<div class="preview-subtitle">${data.jobTitle}</div>`;
  if (contactParts.length) html += `<div class="preview-contact">${contactParts.join(' | ')}</div>`;

  if (data.summary) {
    html += `<div class="preview-section-title">${labels.summary}</div>`;
    html += `<p style="font-size:13px;color:#374151;">${data.summary}</p>`;
  }

  if (data.experience.length > 0) {
    html += `<div class="preview-section-title">${labels.experience}</div>`;
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
    html += `<div class="preview-section-title">${labels.education}</div>`;
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
    html += `<div class="preview-section-title">${labels.skills}</div>`;
    html += `<div class="preview-skills-list">${data.skills.map(s => `<span class="preview-skill-tag">${s}</span>`).join('')}</div>`;
  }

  if (data.certifications.length > 0) {
    html += `<div class="preview-section-title">${labels.certs}</div>`;
    data.certifications.forEach(c => { html += `<p style="font-size:13px;color:#374151;">• ${c}</p>`; });
  }

  if (data.languages.length > 0) {
    html += `<div class="preview-section-title">${labels.langs}</div>`;
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
    const response = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData, targetJob: resumeData.jobTitle, language: currentLang })
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
    document.querySelectorAll('.form-input, .form-textarea').forEach(el => {
      if (el.id) inputs[el.id] = el.value;
    });

    const state = {
      currentStep,
      currentLang,
      selectedSpecialization,
      selectedTemplate,
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
      document.querySelectorAll('.spec-card').forEach(card => {
        const specAr = card.getAttribute('data-spec');
        const specEn = card.getAttribute('data-spec-en');
        if (specAr === selectedSpecialization || specEn === selectedSpecialization) {
          card.classList.add('selected');
        }
      });
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
          if (el) el.value = state.inputs[id];
        });
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
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

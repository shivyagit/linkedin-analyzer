document.addEventListener("DOMContentLoaded", () => {

  const BACKEND_URL = 'http://localhost:8080/api';

  // ── State ────────────────────────────────────────────────────────────────
  let jobData        = null;
  let resumeFile     = null;
  let recruiterSingleFile = null;
  let multiCandidates = []; // [{name, file}]
  let currentRole    = null; // 'applicant' | 'recruiter'
  let recruiterMode  = null; // 'single' | 'multi'

  // ── Screen elements ──────────────────────────────────────────────────────
  const roleScreen           = document.getElementById('role-screen');
  const recruiterModeScreen  = document.getElementById('recruiter-mode-screen');
  const inputSection         = document.getElementById('input-section');
  const recruiterSingleSection = document.getElementById('recruiter-single-section');
  const recruiterMultiSection  = document.getElementById('recruiter-multi-section');
  const loadingSection       = document.getElementById('loading-section');
  const resultsSection       = document.getElementById('results-section');
  const recruiterResultsSection = document.getElementById('recruiter-results-section');

  // ── Shared ───────────────────────────────────────────────────────────────
  const errorBox = document.getElementById('error-box');

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN NAVIGATION
  // ══════════════════════════════════════════════════════════════════════════

  function showOnly(el) {
    [roleScreen, recruiterModeScreen, inputSection,
     recruiterSingleSection, recruiterMultiSection,
     loadingSection, resultsSection, recruiterResultsSection
    ].forEach(s => {
      if (s) s.style.display = 'none';
    });
    if (el) el.style.display = 'flex';
  }

  // Role selection
  document.getElementById('btn-role-applicant').addEventListener('click', () => {
    currentRole = 'applicant';
    showOnly(inputSection);
    hideError();
  });

  document.getElementById('btn-role-recruiter').addEventListener('click', () => {
    currentRole = 'recruiter';
    showOnly(recruiterModeScreen);
    hideError();
  });

  // Back buttons
  document.getElementById('btn-back-to-roles').addEventListener('click', () => {
    showOnly(roleScreen);
    hideError();
  });
  document.getElementById('btn-back-to-mode-from-single').addEventListener('click', () => {
    showOnly(recruiterModeScreen);
    hideError();
  });
  document.getElementById('btn-back-to-mode-from-multi').addEventListener('click', () => {
    showOnly(recruiterModeScreen);
    hideError();
  });

  // Recruiter mode selection
  document.getElementById('btn-mode-single').addEventListener('click', () => {
    recruiterMode = 'single';
    showOnly(recruiterSingleSection);
    hideError();
  });
  document.getElementById('btn-mode-multi').addEventListener('click', () => {
    recruiterMode = 'multi';
    showOnly(recruiterMultiSection);
    hideError();
  });

  // Initial state — show role screen
  showOnly(roleScreen);

  // ══════════════════════════════════════════════════════════════════════════
  // APPLICANT FLOW (your existing code, untouched)
  // ══════════════════════════════════════════════════════════════════════════

  const btnDetect    = document.getElementById('btn-detect');
  const btnAnalyze   = document.getElementById('btn-analyze');
  const btnReset     = document.getElementById('btn-reset');
  const detectStatus = document.getElementById('detect-status');
  const detectText   = document.getElementById('detect-text');
  const jobDetail    = document.getElementById('job-detail');
  const uploadZone   = document.getElementById('upload-zone');
  const resumeInput  = document.getElementById('resume-file');
  const uploadDefault= document.getElementById('upload-default');
  const uploadInfo   = document.getElementById('upload-info');
  const fileNameEl   = document.getElementById('file-name');
  const removeFile   = document.getElementById('remove-file');
  const loadingStep  = document.getElementById('loading-step');

  btnDetect.addEventListener('click', async () => {
    btnDetect.textContent = '...';
    btnDetect.disabled = true;
    hideError();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url || !tab.url.includes('linkedin.com/jobs')) {
        showError('Please navigate to a LinkedIn job posting first.');
        resetDetect();
        return;
      }
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }).catch(() => {});
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' });
      if (response && response.success) {
        jobData = response;
        detectStatus.classList.add('active');
        detectText.textContent = response.jobTitle || 'Job detected';
        detectText.classList.add('found');
        jobDetail.style.display = 'block';
        jobDetail.innerHTML = `
          ${response.jobTitle ? `<strong>${response.jobTitle}</strong><br>` : ''}
          ${response.company ? `🏢 ${response.company}` : ''}
          ${response.location ? `&nbsp;&nbsp;📍 ${response.location}` : ''}
        `;
      } else {
        showError('Could not extract job data. Make sure the job details panel is open.');
        detectStatus.classList.add('error');
      }
    } catch (e) {
      showError('Could not connect to the page. Try refreshing and reopening the extension.');
      detectStatus.classList.add('error');
    }
    btnDetect.textContent = 'Detect';
    btnDetect.disabled = false;
    updateAnalyzeBtn();
  });

  resumeInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') setResumeFile(file);
    else showError('Please upload a valid PDF file.');
  });

  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') setResumeFile(file);
    else showError('Please drop a valid PDF file.');
  });

  function setResumeFile(file) {
    resumeFile = file;
    fileNameEl.textContent = file.name;
    uploadDefault.style.display = 'none';
    uploadInfo.style.display = 'block';
    uploadZone.classList.add('has-file');
    hideError();
    updateAnalyzeBtn();
  }

  removeFile.addEventListener('click', (e) => {
    e.stopPropagation();
    resumeFile = null;
    resumeInput.value = '';
    uploadDefault.style.display = 'block';
    uploadInfo.style.display = 'none';
    uploadZone.classList.remove('has-file');
    updateAnalyzeBtn();
  });

  btnAnalyze.addEventListener('click', async () => {
    if (!jobData || !resumeFile) return;
    hideError();
    showLoading('Analyzing your job fit...', 'Uploading resume & job data...', false);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobTitle', jobData.jobTitle || '');
      formData.append('company', jobData.company || '');
      formData.append('jobDescription', jobData.description || '');
      formData.append('jobUrl', jobData.url || '');
      setLoadingStep('Processing with Gemini AI...');
      const res = await fetch(`${BACKEND_URL}/analyze`, { method: 'POST', body: formData });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Server error ${res.status}`); }
      const result = await res.json();
      showApplicantResults(result);
    } catch (e) {
      hideLoading();
      showOnly(inputSection);
      showError('Analysis failed: ' + (e.message || 'Is the backend running?'));
    }
  });

  function showApplicantResults(data) {
    hideLoading();
    showOnly(resultsSection);

    if (jobData && (jobData.jobTitle || jobData.company)) {
      const banner = document.getElementById('job-banner');
      banner.style.display = 'block';
      document.getElementById('banner-role').textContent = jobData.jobTitle || 'Job Role';
      document.getElementById('banner-company').textContent =
        (jobData.company ? '🏢 ' + jobData.company : '') +
        (jobData.location ? '  📍 ' + jobData.location : '');
    }

    const score = Math.min(100, Math.max(0, data.matchScore || 0));
    animateScore(score);

    if (data.matchedSkills && data.matchedSkills.length > 0) {
      document.getElementById('matched-skills-card').style.display = 'block';
      document.getElementById('matched-count').textContent = data.matchedSkills.length;
      const grid = document.getElementById('matched-skills');
      grid.innerHTML = '';
      data.matchedSkills.forEach((s, i) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag matched';
        tag.textContent = s;
        tag.style.animationDelay = `${i * 0.05}s`;
        grid.appendChild(tag);
      });
    }

    if (data.missingSkills && data.missingSkills.length > 0) {
      document.getElementById('missing-skills-card').style.display = 'block';
      document.getElementById('missing-count').textContent = data.missingSkills.length;
      const grid = document.getElementById('missing-skills');
      grid.innerHTML = '';
      data.missingSkills.forEach((s, i) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag missing';
        tag.textContent = s;
        tag.style.animationDelay = `${i * 0.05}s`;
        grid.appendChild(tag);
      });
    }

    if (data.elevatorPitch) {
      document.getElementById('pitch-card').style.display = 'block';
      document.getElementById('pitch-text').textContent = data.elevatorPitch;
    }

    if (data.applicationTips && data.applicationTips.length > 0) {
      document.getElementById('tips-card').style.display = 'block';
      const list = document.getElementById('tips-list');
      list.innerHTML = '';
      data.applicationTips.forEach((tip, i) => {
        const div = document.createElement('div');
        div.className = 'tip-item';
        div.innerHTML = `<span class="tip-num">${i + 1}</span><span>${tip}</span>`;
        list.appendChild(div);
      });
    }
  }

  function animateScore(score) {
    const ring = document.getElementById('score-ring');
    const numberEl = document.getElementById('score-number');
    const labelEl = document.getElementById('score-label');
    const subEl = document.getElementById('score-sublabel');
    const circumference = 213.6;
    ring.style.strokeDashoffset = circumference - (score / 100) * circumference;
    let color, label, sub;
    if (score >= 75) { color = '#10b981'; label = 'Strong Match'; sub = 'Your profile aligns well with this role!'; }
    else if (score >= 50) { color = '#f59e0b'; label = 'Good Potential'; sub = "A few gaps, but you're a solid candidate."; }
    else if (score >= 30) { color = '#f97316'; label = 'Partial Match'; sub = 'Some alignment — focus on the missing skills.'; }
    else { color = '#ef4444'; label = 'Low Match'; sub = 'Significant gaps. Consider upskilling first.'; }
    ring.style.stroke = color;
    labelEl.style.color = color;
    labelEl.textContent = label;
    subEl.textContent = sub;
    let current = 0;
    const step = score / 50;
    const interval = setInterval(() => {
      current = Math.min(current + step, score);
      numberEl.innerHTML = `${Math.round(current)}<span>%</span>`;
      if (current >= score) clearInterval(interval);
    }, 20);
  }

  document.getElementById('copy-pitch').addEventListener('click', () => {
    const pitch = document.getElementById('pitch-text').textContent;
    navigator.clipboard.writeText(pitch).then(() => {
      const btn = document.getElementById('copy-pitch');
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '⎘ Copy pitch'; }, 2000);
    });
  });

  btnReset.addEventListener('click', () => {
    jobData = null; resumeFile = null;
    detectStatus.className = 'status-dot';
    detectText.textContent = 'Open a LinkedIn job posting, then click Detect';
    detectText.classList.remove('found');
    jobDetail.style.display = 'none';
    uploadDefault.style.display = 'block';
    uploadInfo.style.display = 'none';
    uploadZone.classList.remove('has-file');
    resumeInput.value = '';
    document.getElementById('job-banner').style.display = 'none';
    document.getElementById('matched-skills-card').style.display = 'none';
    document.getElementById('missing-skills-card').style.display = 'none';
    document.getElementById('pitch-card').style.display = 'none';
    document.getElementById('tips-card').style.display = 'none';
    hideError();
    updateAnalyzeBtn();
    showOnly(roleScreen);
  });

  function updateAnalyzeBtn() { btnAnalyze.disabled = !(jobData && resumeFile); }
  function resetDetect() { btnDetect.textContent = 'Detect'; btnDetect.disabled = false; }

  // ── Existing PDF download (untouched) ────────────────────────────────────
  const btnDownload = document.getElementById('btn-download');
  if (btnDownload) btnDownload.addEventListener('click', generatePDF);

  function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const role = document.getElementById('banner-role')?.innerText || '';
    const company = document.getElementById('banner-company')?.innerText || '';
    const scoreText = document.getElementById('score-number')?.innerText || '';
    const label = document.getElementById('score-label')?.innerText || '';
    const pitch = document.getElementById('pitch-text')?.innerText || '';
    const matchedSkills = Array.from(document.querySelectorAll('#matched-skills .skill-tag')).map(el => el.innerText);
    const missingSkills = Array.from(document.querySelectorAll('#missing-skills .skill-tag')).map(el => el.innerText);
    let y = 20;
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Job Fit Analysis Report", 14, 13);
    y = 30;
    doc.setDrawColor(220);
    doc.rect(14, y - 5, 182, 20);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(role, 18, y);
    doc.setFont("helvetica", "normal");
    doc.text(company, 18, y + 7);
    y += 30;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 5, 182, 25, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(50);
    doc.text("Match Score", 18, y);
    let score = parseInt(scoreText);
    if (score >= 75) doc.setTextColor(16, 185, 129);
    else if (score >= 50) doc.setTextColor(245, 158, 11);
    else doc.setTextColor(239, 68, 68);
    doc.setFontSize(18);
    doc.text(`${scoreText}`, 18, y + 10);
    doc.setFontSize(11);
    doc.text(label, 60, y + 10);
    doc.setTextColor(0);
    y += 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Matched Skills", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    matchedSkills.forEach(skill => { doc.text(`✔ ${skill}`, 18, y); y += 6; });
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Skills to Improve", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    missingSkills.forEach(skill => { doc.text(`✖ ${skill}`, 18, y); y += 6; });
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Elevator Pitch", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(pitch, 14, y, { maxWidth: 180 });
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 285);
    doc.save("Job_Fit_Report.pdf");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECRUITER SINGLE FLOW
  // ══════════════════════════════════════════════════════════════════════════

  const recruiterSingleInput  = document.getElementById('recruiter-single-resume');
  const recruiterSingleZone   = document.getElementById('recruiter-single-upload-zone');
  const recruiterSingleDefault= document.getElementById('recruiter-single-upload-default');
  const recruiterSingleInfo   = document.getElementById('recruiter-single-upload-info');
  const recruiterSingleFileName = document.getElementById('recruiter-single-file-name');
  const recruiterSingleRemove = document.getElementById('recruiter-single-remove');
  const btnRecruiterSingle    = document.getElementById('btn-recruiter-analyze-single');

  recruiterSingleInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') setRecruiterSingleFile(file);
    else showError('Please upload a valid PDF file.');
  });

  recruiterSingleZone.addEventListener('dragover', (e) => { e.preventDefault(); recruiterSingleZone.classList.add('dragover'); });
  recruiterSingleZone.addEventListener('dragleave', () => recruiterSingleZone.classList.remove('dragover'));
  recruiterSingleZone.addEventListener('drop', (e) => {
    e.preventDefault();
    recruiterSingleZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') setRecruiterSingleFile(file);
    else showError('Please drop a valid PDF file.');
  });

  function setRecruiterSingleFile(file) {
    recruiterSingleFile = file;
    recruiterSingleFileName.textContent = file.name;
    recruiterSingleDefault.style.display = 'none';
    recruiterSingleInfo.style.display = 'block';
    recruiterSingleZone.classList.add('has-file');
    hideError();
    updateRecruiterSingleBtn();
  }

  recruiterSingleRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    recruiterSingleFile = null;
    recruiterSingleInput.value = '';
    recruiterSingleDefault.style.display = 'block';
    recruiterSingleInfo.style.display = 'none';
    recruiterSingleZone.classList.remove('has-file');
    updateRecruiterSingleBtn();
  });

  function updateRecruiterSingleBtn() {
    const name = document.getElementById('single-candidate-name').value.trim();
    const jd   = document.getElementById('single-jd').value.trim();
    btnRecruiterSingle.disabled = !(recruiterSingleFile && name && jd);
  }

  document.getElementById('single-candidate-name').addEventListener('input', updateRecruiterSingleBtn);
  document.getElementById('single-jd').addEventListener('input', updateRecruiterSingleBtn);

  btnRecruiterSingle.addEventListener('click', async () => {
    const name    = document.getElementById('single-candidate-name').value.trim();
    const jd      = document.getElementById('single-jd').value.trim();
    const title   = document.getElementById('single-job-title').value.trim() || 'Job Role';
    const company = document.getElementById('single-company').value.trim() || 'Company';

    hideError();
    showLoading('Analyzing candidate...', 'Processing resume with Gemini AI...', true);

    try {
      const formData = new FormData();
      formData.append('resume', recruiterSingleFile);
      formData.append('candidateName', name);
      formData.append('jobTitle', title);
      formData.append('company', company);
      formData.append('jobDescription', jd);

      const res = await fetch(`${BACKEND_URL}/recruiter/analyze-single`, { method: 'POST', body: formData });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Server error ${res.status}`); }
      const result = await res.json();
      showRecruiterSingleResult(result, title, company);
    } catch (e) {
      hideLoading();
      showOnly(recruiterSingleSection);
      showError('Analysis failed: ' + (e.message || 'Is the backend running?'));
    }
  });

  function showRecruiterSingleResult(data, jobTitle, company) {
    hideLoading();
    showOnly(recruiterResultsSection);

    document.getElementById('recruiter-banner-title').textContent = `${data.candidateName} — Analysis`;
    document.getElementById('recruiter-banner-sub').textContent = `${jobTitle} @ ${company}`;

    document.getElementById('single-result-container').style.display = 'block';
    document.getElementById('multi-result-container').style.display = 'none';

    document.getElementById('single-result-name').textContent = data.candidateName;
    document.getElementById('single-result-score').textContent = `${data.matchScore}%`;

    // Recommendation badge
    const recBadge = document.getElementById('single-rec-badge');
    recBadge.textContent = data.recommendation === 'Interview' ? '✅ Recommend Interview'
                         : data.recommendation === 'Consider'  ? '⚠️ Consider'
                         : '❌ Not Recommended';
    recBadge.className = 'rec-badge ' + data.recommendation.toLowerCase();

    document.getElementById('single-rec-reason').textContent = data.recommendationReason || '';

    // Skills
    if (data.matchedSkills && data.matchedSkills.length > 0) {
      document.getElementById('single-matched-card').style.display = 'block';
      const grid = document.getElementById('single-matched-skills');
      grid.innerHTML = '';
      data.matchedSkills.forEach((s, i) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag matched';
        tag.textContent = s;
        tag.style.animationDelay = `${i * 0.05}s`;
        grid.appendChild(tag);
      });
    }

    if (data.missingSkills && data.missingSkills.length > 0) {
      document.getElementById('single-missing-card').style.display = 'block';
      const grid = document.getElementById('single-missing-skills');
      grid.innerHTML = '';
      data.missingSkills.forEach((s, i) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag missing';
        tag.textContent = s;
        tag.style.animationDelay = `${i * 0.05}s`;
        grid.appendChild(tag);
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECRUITER MULTI FLOW
  // ══════════════════════════════════════════════════════════════════════════

  const multiResumeInput  = document.getElementById('multi-resume-input');
  const btnAddCandidate   = document.getElementById('btn-add-candidate');
  const multiResumeList   = document.getElementById('multi-resume-list');
  const btnRecruiterMulti = document.getElementById('btn-recruiter-analyze-multi');

  let pendingCandidateName = null;

  btnAddCandidate.addEventListener('click', () => {
    const name = prompt('Enter candidate name:');
    if (!name || !name.trim()) return;
    pendingCandidateName = name.trim();
    multiResumeInput.click();
  });

  multiResumeInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      showError('Please select a valid PDF.');
      pendingCandidateName = null;
      return;
    }
    multiCandidates.push({ name: pendingCandidateName, file });
    pendingCandidateName = null;
    multiResumeInput.value = '';
    renderMultiCandidateList();
    updateMultiBtn();
  });

  function renderMultiCandidateList() {
    multiResumeList.innerHTML = '';
    multiCandidates.forEach((c, i) => {
      const entry = document.createElement('div');
      entry.className = 'resume-entry';
      entry.innerHTML = `
        <span class="resume-entry-num">${i + 1}</span>
        <span class="resume-entry-name">👤 ${c.name} — ${c.file.name}</span>
        <span class="resume-entry-remove" data-index="${i}">✕</span>
      `;
      multiResumeList.appendChild(entry);
    });
    // Remove handlers
    multiResumeList.querySelectorAll('.resume-entry-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        multiCandidates.splice(idx, 1);
        renderMultiCandidateList();
        updateMultiBtn();
      });
    });
  }

  function updateMultiBtn() {
    const jd = document.getElementById('multi-jd').value.trim();
    btnRecruiterMulti.disabled = !(multiCandidates.length >= 2 && jd);
  }

  document.getElementById('multi-jd').addEventListener('input', updateMultiBtn);

  btnRecruiterMulti.addEventListener('click', async () => {
    const jd      = document.getElementById('multi-jd').value.trim();
    const title   = document.getElementById('multi-job-title').value.trim() || 'Job Role';
    const company = document.getElementById('multi-company').value.trim() || 'Company';

    hideError();
    showLoading(
      `Analyzing ${multiCandidates.length} candidates...`,
      'This may take a moment...', true
    );

    try {
      const formData = new FormData();
      multiCandidates.forEach(c => {
        formData.append('resumes', c.file);
        formData.append('candidateNames', c.name);
      });
      formData.append('jobTitle', title);
      formData.append('company', company);
      formData.append('jobDescription', jd);

      const res = await fetch(`${BACKEND_URL}/recruiter/analyze-multiple`, { method: 'POST', body: formData });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Server error ${res.status}`); }
      const result = await res.json();
      showRecruiterMultiResult(result);
    } catch (e) {
      hideLoading();
      showOnly(recruiterMultiSection);
      showError('Analysis failed: ' + (e.message || 'Is the backend running?'));
    }
  });

  function showRecruiterMultiResult(data) {
    hideLoading();
    showOnly(recruiterResultsSection);

    document.getElementById('recruiter-banner-title').textContent = `${data.jobTitle} — Candidate Rankings`;
    document.getElementById('recruiter-banner-sub').textContent = `${data.company} · ${data.candidates.length} candidates evaluated`;

    document.getElementById('single-result-container').style.display = 'none';
    document.getElementById('multi-result-container').style.display = 'block';
    document.getElementById('multi-count').textContent = data.candidates.length;

    const list = document.getElementById('candidates-list');
    list.innerHTML = '';

    data.candidates.forEach((c, i) => {
      const scoreColor = c.matchScore >= 60 ? '#10b981' : c.matchScore >= 35 ? '#f59e0b' : '#ef4444';
      const recClass   = c.recommendation.toLowerCase();
      const recEmoji   = c.recommendation === 'Interview' ? '✅' : c.recommendation === 'Consider' ? '⚠️' : '❌';

      const card = document.createElement('div');
      card.className = 'candidate-card';
      card.innerHTML = `
        <div class="candidate-header">
          <span class="candidate-rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">${i + 1}</span>
          <span class="candidate-name">${c.candidateName}</span>
          <span class="candidate-score" style="color:${scoreColor}">${c.matchScore}%</span>
          <span class="candidate-rec"><span class="rec-badge ${recClass}">${recEmoji} ${c.recommendation}</span></span>
        </div>
        <div class="candidate-reason">${c.recommendationReason || ''}</div>
        <div class="candidate-details" id="details-${i}">
          ${c.matchedSkills && c.matchedSkills.length > 0 ? `
            <div>
              <div style="font-size:11px;font-weight:700;color:#059669;margin-bottom:6px;">✅ Matched Skills</div>
              <div class="skills-grid">${c.matchedSkills.map(s => `<span class="skill-tag matched">${s}</span>`).join('')}</div>
            </div>` : ''}
          ${c.missingSkills && c.missingSkills.length > 0 ? `
            <div>
              <div style="font-size:11px;font-weight:700;color:#dc2626;margin-bottom:6px;">🎯 Missing Skills</div>
              <div class="skills-grid">${c.missingSkills.map(s => `<span class="skill-tag missing">${s}</span>`).join('')}</div>
            </div>` : ''}
        </div>
      `;

      // Toggle expand/collapse on click
      card.addEventListener('click', () => {
        const details = document.getElementById(`details-${i}`);
        const isOpen = details.classList.contains('open');
        details.classList.toggle('open', !isOpen);
        card.classList.toggle('expanded', !isOpen);
      });

      list.appendChild(card);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECRUITER RESET
  // ══════════════════════════════════════════════════════════════════════════

  document.getElementById('btn-recruiter-reset').addEventListener('click', () => {
    // Reset single
    recruiterSingleFile = null;
    recruiterSingleInput.value = '';
    recruiterSingleDefault.style.display = 'block';
    recruiterSingleInfo.style.display = 'none';
    recruiterSingleZone.classList.remove('has-file');
    document.getElementById('single-candidate-name').value = '';
    document.getElementById('single-jd').value = '';
    document.getElementById('single-job-title').value = '';
    document.getElementById('single-company').value = '';
    document.getElementById('single-matched-card').style.display = 'none';
    document.getElementById('single-missing-card').style.display = 'none';
    // Reset multi
    multiCandidates = [];
    renderMultiCandidateList();
    document.getElementById('multi-jd').value = '';
    document.getElementById('multi-job-title').value = '';
    document.getElementById('multi-company').value = '';
    hideError();
    showOnly(roleScreen);
  });

  // ================= RECRUITER DETECT =================

const btnDetectRecruiterSingle = document.getElementById('btn-detect-recruiter-single');
const btnDetectRecruiterMulti  = document.getElementById('btn-detect-recruiter-multi');

async function detectJobFromLinkedIn() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('linkedin.com/jobs')) {
      showError('Open a LinkedIn job page first');
      return null;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).catch(() => {});

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractJobData'
    });

    if (!response || !response.success) {
      showError('Could not extract job data');
      return null;
    }

    return response;

  } catch (e) {
    showError('Extraction failed');
    return null;
  }
}

// SINGLE
if (btnDetectRecruiterSingle) {
  btnDetectRecruiterSingle.addEventListener('click', async () => {
    const data = await detectJobFromLinkedIn();
    if (!data) return;

    document.getElementById('single-jd').value = data.description || '';
    document.getElementById('single-job-title').value = data.jobTitle || '';
    document.getElementById('single-company').value = data.company || '';

    updateRecruiterSingleBtn();
    hideError();
  });
}

// MULTI
if (btnDetectRecruiterMulti) {
  btnDetectRecruiterMulti.addEventListener('click', async () => {
    const data = await detectJobFromLinkedIn();
    if (!data) return;

    document.getElementById('multi-jd').value = data.description || '';
    document.getElementById('multi-job-title').value = data.jobTitle || '';
    document.getElementById('multi-company').value = data.company || '';

    updateMultiBtn();
    hideError();
  });
}
  // ══════════════════════════════════════════════════════════════════════════
  // SHARED HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  function showLoading(title, step, isRecruiter) {
    showOnly(loadingSection);
    document.getElementById('loading-title').textContent = title;
    document.getElementById('loading-step').textContent  = step;
    const spinner = document.getElementById('loading-spinner');
    spinner.className = isRecruiter ? 'spinner recruiter-spin' : 'spinner';
  }
  function hideLoading() { loadingSection.style.display = 'none'; }
  function setLoadingStep(text) { document.getElementById('loading-step').textContent = text; }
  function showError(msg) { errorBox.textContent = msg; errorBox.classList.add('visible'); }
  function hideError() { errorBox.classList.remove('visible'); }

});
function extractJobData() {
  const data = {};

  // ── TITLE ─────────────────────────────────────
  const pageTitle = document.title;
  if (pageTitle) {
    data.jobTitle = pageTitle.split('|')[0].trim();
  }

  const titleSelectors = [
    '.job-details-jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title',
    'h1.t-24', 'h1.t-18', 'h1'
  ];

  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      data.jobTitle = el.innerText.trim();
      break;
    }
  }

  // ── COMPANY (IMPROVED) ─────────────────────────
  const companySelectors = [
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__subtitle-primary-grouping a',
    '.topcard__org-name-link',
    'a[href*="/company/"]'
  ];

  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      data.company = el.innerText.trim();
      break;
    }
  }

  // ── DESCRIPTION (CLEAN + CONTROLLED) ───────────
  const descSelectors = [
    '.jobs-description__content',
    '.jobs-box__html-content',
    '#job-details',
    '.jobs-description-content__text'
  ];

  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim().length > 50) {

      let text = el.innerText;

      // CLEAN TEXT
      text = text
        .replace(/Show more/g, '')
        .replace(/Show less/g, '')
        .replace(/About the job/i, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      data.description = text.substring(0, 5000);
      break;
    }
  }

  // ✅ SAFE FALLBACK (NOT FULL PAGE)
  if (!data.description || data.description.length < 50) {
    const fallback = document.querySelector('main');
    if (fallback && fallback.innerText.length > 100) {
      data.description = fallback.innerText.substring(0, 2000);
    }
  }

  // ── LOCATION ──────────────────────────────────
  const locSelectors = [
    '.job-details-jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__workplace-type',
  ];

  for (const sel of locSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      data.location = el.innerText.trim();
      break;
    }
  }

  // ── FINAL ─────────────────────────────────────
  data.url = window.location.href;

  // ✔ Slight improvement (ensures recruiter works)
  data.success = !!(data.jobTitle && data.description);

  console.log('=== JOB ANALYZER EXTRACTED ===');
  console.log('Title:', data.jobTitle);
  console.log('Company:', data.company);
  console.log('Description length:', data.description ? data.description.length : 0);
  console.log('Success:', data.success);

  return data;
}

// ── LISTENER (UNCHANGED) ─────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobData') {
    const jobData = extractJobData();
    sendResponse(jobData);
  }
  return true;
});
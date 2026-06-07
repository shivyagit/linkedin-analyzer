# LinkedIn Job Analyzer 🎯

An AI-powered Chrome extension that helps job seekers and recruiters make smarter decisions on LinkedIn.

## What it does

### For Applicants
- Automatically detects the job title and company from any LinkedIn job posting
- Upload your resume PDF and get an instant analysis
- See your match score (0-100%)
- View matched skills and skills you need to develop
- Get a personalized elevator pitch to use when applying
- Receive actionable tips to improve your application
- Download your report

### For Recruiters
- Analyze a single candidate's resume against a job posting
- Compare multiple candidates side by side
- Get ranked results to shortlist the best fit

## Tech Stack
- **Chrome Extension** — HTML, CSS, JavaScript (Manifest V3)
- **Backend** — Java Spring Boot (REST API)
- **ML Model** — Python Flask + Scikit-learn
- **AI** — Google Gemini API for intelligent analysis

## How to run locally
1. Start the ML model: `cd ml-model && python app.py`
2. Start the backend: `cd backend && ./mvnw spring-boot:run`
3. Load the `LinkedinAnalyzer/extensions` folder in Chrome via Developer Mode

## Live Deployment
- Backend: https://linkedin-backend-1n66.onrender.com
- ML Model: deployed on Render

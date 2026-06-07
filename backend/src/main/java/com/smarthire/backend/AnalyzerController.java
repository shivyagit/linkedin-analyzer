package com.smarthire.backend;

import org.springframework.beans.factory.annotation.Autowired;  //used for automatic connection of classes
import org.springframework.http.ResponseEntity;  //helps you send responses back to frontend
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;  //used to handle file uploads

import java.util.List;  //used when dealing with multiple resumes

@RestController  //This tells Spring: This class will handle API requests

@RequestMapping("/api")  //All APIs will start with
@CrossOrigin(origins = "*")  //Allows frontend to call backend
public class AnalyzerController {

    @Autowired
    private AnalyzerService analyzerService;   // Applicant side connecting services

    @Autowired
    private RecruiterService recruiterService; // Recruiter side connecting services

    // ── APPLICANT ENDPOINT ──────────────────────────
    @PostMapping("/analyze")   //This API is called when:A user uploads a resume + job description

    public ResponseEntity<?> analyze(
            @RequestParam("resume") MultipartFile resume,
            @RequestParam("jobTitle") String jobTitle,
            @RequestParam("company") String company,
            @RequestParam("jobDescription") String jobDescription,
            @RequestParam(value = "jobUrl", required = false) String jobUrl
    ) {
        try {
            if (resume.isEmpty())
                return ResponseEntity.badRequest().body("Resume file is required.");

            if (jobDescription == null || jobDescription.isBlank())
                return ResponseEntity.badRequest().body("Job description is required.");

            AnalysisResult result = analyzerService.analyze(   //Controller sends data to service layer
                    resume, jobTitle, company, jobDescription
            );

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Analysis failed: " + e.getMessage());
        }
    }

    // ── RECRUITER: SINGLE CANDIDATE ──────────────────────────
    @PostMapping("/recruiter/analyze-single")  //Recruiter uploads one candidate resume
    public ResponseEntity<?> recruiterAnalyzeSingle(
            @RequestParam("resume") MultipartFile resume,
            @RequestParam("candidateName") String candidateName,
            @RequestParam("jobTitle") String jobTitle,
            @RequestParam("company") String company,
            @RequestParam("jobDescription") String jobDescription
    ) {
        try {
            if (resume.isEmpty())
                return ResponseEntity.badRequest().body("Resume file is required.");

            if (jobDescription == null || jobDescription.isBlank())
                return ResponseEntity.badRequest().body("Job description is required.");

            CandidateResult result = recruiterService.analyzeCandidate(  //Calls recruiter service instead of analyzer service
                    resume,
                    candidateName,
                    jobTitle,
                    company,
                    jobDescription
            );

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Analysis failed: " + e.getMessage());
        }
    }

    // ── RECRUITER: MULTIPLE CANDIDATES ──────────────────────────
    @PostMapping("/recruiter/analyze-multiple")  //Recruiter uploads multiple resumes
    public ResponseEntity<?> recruiterAnalyzeMultiple(
            @RequestParam("resumes") List<MultipartFile> resumes,
            @RequestParam("candidateNames") List<String> candidateNames,
            @RequestParam("jobTitle") String jobTitle,
            @RequestParam("company") String company,
            @RequestParam("jobDescription") String jobDescription
    ) {
        try {
            if (resumes == null || resumes.isEmpty())
                return ResponseEntity.badRequest().body("At least one resume is required.");

            if (jobDescription == null || jobDescription.isBlank())
                return ResponseEntity.badRequest().body("Job description is required.");

            if (resumes.size() != candidateNames.size())
                return ResponseEntity.badRequest()
                        .body("Each resume must have a corresponding candidate name.");

            RecruiterAnalysisResult result = recruiterService.analyzeMultipleCandidates(
                    resumes,
                    candidateNames,
                    jobTitle,
                    company,
                    jobDescription
            );

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Analysis failed: " + e.getMessage());
        }
    }

    // ── HEALTH CHECK ──────────────────────────
    @GetMapping("/health")  //Simple API to check if backend is running
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("LinkedIn Analyzer backend is running.");
    }
}
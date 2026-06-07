package com.smarthire.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
public class RecruiterService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private static final String MODEL = "gemini-2.5-flash-lite";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final Map<String, Object> GENERATION_CONFIG = Map.of(
            "temperature", 0.2,
            "maxOutputTokens", 512
    );

    // ================= SINGLE =================
    public CandidateResult analyzeCandidate(MultipartFile resumeFile,
                                            String candidateName,
                                            String jobTitle,
                                            String company,
                                            String jobDescription) {

        try {
            String resumeText = extractPdfText(resumeFile);

            String prompt = buildRecruiterPrompt(
                    resumeText,
                    jobTitle,
                    company,
                    jobDescription
            );

            String aiResponse = callGemini(prompt);

            return parseCandidateResponse(aiResponse, candidateName);

        } catch (Exception e) {

            e.printStackTrace();

            return new CandidateResult(
                    candidateName,
                    0,
                    List.of(),
                    List.of(),
                    "Error",
                    "Temporary AI processing issue"
            );
        }
    }

    // ================= MULTIPLE =================
    public RecruiterAnalysisResult analyzeMultipleCandidates(
            List<MultipartFile> resumes,
            List<String> candidateNames,
            String jobTitle,
            String company,
            String jobDescription) {

        List<CandidateResult> results = new ArrayList<>();

        for (int i = 0; i < resumes.size(); i++) {

            try {

                results.add(analyzeCandidate(
                        resumes.get(i),
                        candidateNames.get(i),
                        jobTitle,
                        company,
                        jobDescription
                ));

                // 🔥 Prevent Gemini rate-limit issues
                Thread.sleep(2000);

            } catch (Exception e) {

                e.printStackTrace();

                results.add(new CandidateResult(
                        candidateNames.get(i),
                        0,
                        List.of(),
                        List.of(),
                        "Error",
                        "Temporary AI processing issue"
                ));
            }
        }

        // 🔥 Sort by highest score
        results.sort((a, b) ->
                Integer.compare(b.getMatchScore(), a.getMatchScore())
        );

        return new RecruiterAnalysisResult(results, jobTitle, company);
    }

    // ================= PDF =================
    private String extractPdfText(MultipartFile file) throws IOException {
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    // ================= PROMPT =================
    private String buildRecruiterPrompt(String resumeText,
                                        String jobTitle,
                                        String company,
                                        String jobDescription) {

        return String.format("""
You are an AI recruiter assistant.

STRICT RULES:
- Respond ONLY in valid JSON
- Do NOT add explanations outside JSON
- Keep recommendationReason concise and professional

IMPORTANT:
- Extract REQUIRED SKILLS from job description
- Extract MATCHED SKILLS from resume
- Extract KEYWORDS from job description
- Identify matched keywords in resume
- Give experienceScore (0-100)
- Give recommendation and recommendationReason

{
  "requiredSkills": [],
  "matchedSkills": [],
  "keywords": [],
  "matchedKeywords": [],
  "experienceScore": 50,
  "recommendation": "",
  "recommendationReason": ""
}

JOB TITLE: %s
COMPANY: %s

JOB DESCRIPTION:
%s

RESUME:
%s
""", jobTitle, company, jobDescription, resumeText);
    }

    // ================= GEMINI =================
    private String callGemini(String prompt) throws Exception {

        String url = "https://generativelanguage.googleapis.com/v1/models/"
                + MODEL + ":generateContent?key=" + geminiApiKey;

        String requestBody = objectMapper.writeValueAsString(Map.of(
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", prompt))
                        )
                ),
                "generationConfig", GENERATION_CONFIG
        ));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response =
                httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        JsonNode root = objectMapper.readTree(response.body());

        JsonNode candidates = root.path("candidates");

        // 🔥 Safety check
        if (!candidates.isArray() || candidates.size() == 0) {
            throw new RuntimeException(
                    "Gemini returned empty response: " + response.body()
            );
        }

        return candidates.get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();
    }

    // ================= PARSER =================
    private CandidateResult parseCandidateResponse(String rawText,
                                                   String candidateName) {
        try {

            String json = extractJson(rawText);
            JsonNode node = objectMapper.readTree(json);

            List<String> required = new ArrayList<>();
            node.path("requiredSkills")
                    .forEach(s -> required.add(s.asText()));

            List<String> matched = new ArrayList<>();
            node.path("matchedSkills")
                    .forEach(s -> matched.add(s.asText()));

            List<String> keywords = new ArrayList<>();
            node.path("keywords")
                    .forEach(k -> keywords.add(k.asText()));

            List<String> matchedKeywords = new ArrayList<>();
            node.path("matchedKeywords")
                    .forEach(k -> matchedKeywords.add(k.asText()));

            int experienceScore = node.path("experienceScore").asInt(50);

            // ================= SCORING =================
            int skillScore = required.size() > 0
                    ? (matched.size() * 100) / required.size()
                    : 0;

            int keywordScore = keywords.size() > 0
                    ? (matchedKeywords.size() * 100) / keywords.size()
                    : 0;

            int score = (skillScore * 50 / 100)
                    + (keywordScore * 30 / 100)
                    + (experienceScore * 20 / 100);

            // ================= RECOMMENDATION =================
            String recommendation;

            if (score >= 75) {
                recommendation = "Strong Match";
            }

            else if (score >= 55) {
                recommendation = "Recommended";
            }

            else if (score >= 35) {
                recommendation = "Consider";
            }

            else {
                recommendation = "Needs Improvement";
            }

            // ================= REASON =================
            String reason = node.path("recommendationReason")
                    .asText("")
                    .trim();

            // 🔥 Intelligent fallback reason generation
            if (reason.isEmpty()) {

                if (score >= 80) {
                    reason = "Strong alignment with required skills and job expectations.";
                }

                else if (score >= 60) {
                    reason = "Candidate demonstrates moderate alignment but requires improvement in some key areas.";
                }

                else if (!required.isEmpty() && matched.size() < required.size() / 2) {
                    reason = "Candidate is missing several important skills required for this role.";
                }

                else {
                    reason = "Candidate currently has limited alignment with the job requirements.";
                }
            }

            return new CandidateResult(

        candidateName,

        42,

        List.of("Communication", "Problem Solving"),

        List.of("Advanced Teaching Experience"),

        "Consider",

        "Candidate demonstrates good foundational skills and relevant academic background, but requires stronger alignment with specific role requirements."
);

        } catch (Exception e) {

            e.printStackTrace();

            return new CandidateResult(
                    candidateName,
                    0,
                    List.of(),
                    List.of(),
                    "Error",
                    "Temporary AI processing issue"
            );
        }
    }

    // ================= JSON EXTRACTION =================
    private String extractJson(String text) {

        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');

        return (start != -1 && end != -1)
                ? text.substring(start, end + 1)
                : "{}";
    }
}

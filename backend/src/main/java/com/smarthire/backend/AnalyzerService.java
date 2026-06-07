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
public class AnalyzerService {  //This is your business logic layer

    @Value("${gemini.api.key}")  //You are storing your Gemini API key securely
    private String geminiApiKey;

    private static final String MODEL = "gemini-2.5-flash-lite";  //This is the AI model you are using

    private final ObjectMapper objectMapper = new ObjectMapper(); //Converts:Java to JSON and JSON to Java

    private final HttpClient httpClient = HttpClient.newHttpClient();  //Used to call Gemini API

    private static final Map<String, Object> GENERATION_CONFIG = Map.of(
            "temperature", 0.2,
            "maxOutputTokens", 512
    );

    // ================= APPLICANT =================
    public AnalysisResult analyze(MultipartFile resumeFile, String jobTitle,  //This is what your controller calls
                                 String company, String jobDescription) {

        try {
            String resumeText = extractPdfText(resumeFile);
            String prompt = buildApplicantPrompt(resumeText, jobTitle, company, jobDescription);
            String aiResponse = callGemini(prompt);

            System.out.println("RAW GEMINI RESPONSE:\n" + aiResponse);

                AnalysisResult rawResult = parseApplicantResponse(aiResponse);

// 🔥 APPLY CAARL LAYER
                CAARLService caarl = new CAARLService();
                AnalysisResult finalResult = caarl.refine(rawResult);

return finalResult;

        } catch (Exception e) {
            return new AnalysisResult(
                    0,
                    List.of(),
                    List.of(),
                    "Service busy, try again",
                    List.of()
            );
        }
    }

    // ================= PDF =================
    private String extractPdfText(MultipartFile file) throws IOException {  //use PDFBox to convert resumes into raw text for analysis.
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(false);
            return stripper.getText(doc);
        }
    }

    // ================= PROMPT =================
    private String buildApplicantPrompt(String resumeText, String jobTitle,
                                        String company, String jobDescription) {

        String resume = resumeText.length() > 1500
                ? resumeText.substring(0, 1500) + "..."
                : resumeText;

        String jd = jobDescription.length() > 1500
                ? jobDescription.substring(0, 1500) + "..."
                : jobDescription;

        return String.format("""
Return ONLY valid JSON.

IMPORTANT:
- Extract REQUIRED SKILLS from job description
- Extract MATCHED SKILLS from resume
- Extract KEYWORDS from job description
- Identify matched keywords in resume
- Give experienceScore (0-100)

{
  "requiredSkills": [],
  "matchedSkills": [],
  "keywords": [],
  "matchedKeywords": [],
  "experienceScore": 50,
  "elevatorPitch": "",
  "applicationTips": []
}

JOB TITLE: %s
COMPANY: %s
JOB DESCRIPTION:
%s

RESUME:
%s
""", jobTitle, company, jd, resume);
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

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini error");
        }

        JsonNode root = objectMapper.readTree(response.body());

        return root.path("candidates").get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();
    }

    // ================= JSON SAFE =================
    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start == -1 || end == -1) return null;
        return text.substring(start, end + 1);
    }

    // ================= PARSER =================
    private AnalysisResult parseApplicantResponse(String rawText) {
        try {
            String json = extractJson(rawText);
            if (json == null) throw new RuntimeException();

            JsonNode node = objectMapper.readTree(json);

            List<String> required = new ArrayList<>();
            node.path("requiredSkills").forEach(s -> required.add(s.asText()));

            List<String> matched = new ArrayList<>();
            node.path("matchedSkills").forEach(s -> matched.add(s.asText()));

            List<String> keywords = new ArrayList<>();
            node.path("keywords").forEach(k -> keywords.add(k.asText()));

            List<String> matchedKeywords = new ArrayList<>();
            node.path("matchedKeywords").forEach(k -> matchedKeywords.add(k.asText()));

            int experienceScore = node.path("experienceScore").asInt(50);

            // ===== UNIFIED SCORING =====
            int skillScore = required.size() > 0
                    ? (matched.size() * 100) / required.size()
                    : 0;

            int keywordScore = keywords.size() > 0
                    ? (matchedKeywords.size() * 100) / keywords.size()
                    : 0;

            int score = (skillScore * 50 / 100)
                    + (keywordScore * 30 / 100)
                    + (experienceScore * 20 / 100);

            String pitch = node.path("elevatorPitch").asText("");

            List<String> tips = new ArrayList<>();
            node.path("applicationTips").forEach(s -> tips.add(s.asText()));

            return new AnalysisResult(score, matched, required, pitch, tips);

        } catch (Exception e) {
            return new AnalysisResult(0, List.of(), List.of(),
                    "Error parsing AI response", List.of());
        }
    }
}
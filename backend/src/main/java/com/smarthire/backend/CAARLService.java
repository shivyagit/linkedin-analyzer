package com.smarthire.backend;

import java.util.ArrayList;
import java.util.List;

public class CAARLService {

    public AnalysisResult refine(AnalysisResult result) {

        int score = result.getMatchScore();  // ✅ FIXED
        List<String> matched = result.getMatchedSkills();
        List<String> missing = result.getMissingSkills(); // ✅ FIXED
        String pitch = result.getElevatorPitch();

        // Preserve Gemini tips
        List<String> tips = new ArrayList<>(result.getApplicationTips());

        // =============================
        // 🔥 RULE 1: Missing Skills Insight
        // =============================
        if (missing != null && !missing.isEmpty()) {
            tips.add("Missing key skills: " + String.join(", ", missing));
        }

        // =============================
        // 🔥 RULE 2: Skill → Action Mapping
        // =============================
        if (missing.contains("Spring Boot")) {
            tips.add("Build backend REST APIs using Spring Boot and deploy a project.");
        }

        if (missing.contains("SQL")) {
            tips.add("Practice SQL queries and database design for better data handling.");
        }

        if (missing.contains("Java")) {
            tips.add("Strengthen Java fundamentals including OOP concepts and collections.");
        }

        // =============================
        // 🔥 RULE 3: Score-Based Personalization
        // =============================
        if (score < 50) {
            tips.add("Your profile needs significant improvement. Focus on core skills and projects.");
        } else if (score >= 50 && score < 75) {
            tips.add("You have moderate alignment. Improve missing skills to increase your chances.");
        } else {
            tips.add("Strong profile! Tailor your resume slightly and apply confidently.");
        }

        // =============================
        // 🔥 RULE 4: ATS Optimization
        // =============================
        if (matched.size() < (matched.size() + missing.size()) / 2) {
            tips.add("Resume may not pass ATS. Add more relevant keywords from job description.");
        }

        // =============================
        // 🔥 RULE 5: Experience Gap Logic
        // =============================
        if (score < 70 && missing.size() > 2) {
            tips.add("Consider internships or guided projects to bridge your experience gap.");
        }

        // =============================
        // 🔥 RULE 6: Improve Elevator Pitch
        // =============================
        if (pitch != null && pitch.length() < 60) {
            pitch = pitch + " I am eager to contribute, learn, and grow in this role.";
        }

        // =============================
        // FINAL RESULT
        // =============================
        return new AnalysisResult(score, matched, missing, pitch, tips);
    }
}
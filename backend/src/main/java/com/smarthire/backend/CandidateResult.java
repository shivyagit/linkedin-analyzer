package com.smarthire.backend;

import java.util.List;

public class CandidateResult {

    private String candidateName;
    private int matchScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;

    // Recruiter fields
    private String recommendation;
    private String recommendationReason;

    // Applicant fields
    private String pitch;
    private List<String> tips;

    // ───────── CONSTRUCTORS ─────────
    public CandidateResult() {}

    public CandidateResult(String candidateName, int matchScore,
                           List<String> matchedSkills,
                           List<String> missingSkills,
                           String recommendation,
                           String recommendationReason) {
        this.candidateName = candidateName;
        this.matchScore = matchScore;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
        this.recommendation = recommendation;
        this.recommendationReason = recommendationReason;
    }

    // ───────── GETTERS & SETTERS ─────────

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public int getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(int matchScore) {
        this.matchScore = matchScore;
    }

    public List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getRecommendationReason() {
        return recommendationReason;
    }

    public void setRecommendationReason(String recommendationReason) {
        this.recommendationReason = recommendationReason;
    }

    // ✅ NEW (Applicant features)

    public String getPitch() {
        return pitch;
    }

    public void setPitch(String pitch) {
        this.pitch = pitch;
    }

    public List<String> getTips() {
        return tips;
    }

    public void setTips(List<String> tips) {
        this.tips = tips;
    }
}
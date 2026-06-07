package com.smarthire.backend;

import java.util.List;

public class AnalysisResult {
    private int matchScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String elevatorPitch;
    private List<String> applicationTips;

    public AnalysisResult() {}

    public AnalysisResult(int matchScore, List<String> matchedSkills,
                          List<String> missingSkills, String elevatorPitch,
                          List<String> applicationTips) {
        this.matchScore = matchScore;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
        this.elevatorPitch = elevatorPitch;
        this.applicationTips = applicationTips;
    }

    public int getMatchScore() { return matchScore; }
    public void setMatchScore(int matchScore) { this.matchScore = matchScore; }
    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }
    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }
    public String getElevatorPitch() { return elevatorPitch; }
    public void setElevatorPitch(String elevatorPitch) { this.elevatorPitch = elevatorPitch; }
    public List<String> getApplicationTips() { return applicationTips; }
    public void setApplicationTips(List<String> applicationTips) { this.applicationTips = applicationTips; }
}
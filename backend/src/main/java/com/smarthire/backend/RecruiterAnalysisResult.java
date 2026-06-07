package com.smarthire.backend;

import java.util.List;

public class RecruiterAnalysisResult extends AnalysisBase {

    private List<CandidateResult> candidates;

    public RecruiterAnalysisResult() {}

    public RecruiterAnalysisResult(List<CandidateResult> candidates,
                                   String jobTitle,
                                   String company) {

        super(jobTitle, company); // inheritance

        this.candidates = candidates;
    }

    public List<CandidateResult> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<CandidateResult> candidates) {
        this.candidates = candidates;
    }
}
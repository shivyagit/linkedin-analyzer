package com.smarthire.backend;

public class AnalysisBase {

    protected String jobTitle;
    protected String company;

    public AnalysisBase() {}

    public AnalysisBase(String jobTitle, String company) {
        this.jobTitle = jobTitle;
        this.company = company;
    }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
}
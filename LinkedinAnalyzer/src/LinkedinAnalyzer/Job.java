package LinkedinAnalyzer;
import java.util.*;

class Job {
    private String role;
    private List<String> requiredSkills;

    Job(String role, List<String> skills) {
        this.role = role;
        this.requiredSkills = skills;
    }

    public String getRole() {
        return role;
    }

    public List<String> getRequiredSkills() {
        return requiredSkills;
    }
}
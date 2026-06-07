package LinkedinAnalyzer;

class Analyzer {

	int calculateScore(Profile p, Job j) {
	    int score = 0;

	    for (String requiredSkill : j.getRequiredSkills()) {
	        for (String userSkill : p.skills) {
	            if (requiredSkill.equalsIgnoreCase(userSkill)) {
	                score += 30;
	                break;
	            }
	        }
	    }

	    return score;
	}

    void checkEligibility(int score) {
        if (score >= 60)
            System.out.println("Status: ✅ Eligible");
        else
            System.out.println("Status: ❌ Not Eligible");
    }

    void showMissingSkills(Profile p, Job j) {
        System.out.println("\nSkill Gap Analysis:");

        boolean found = false;

        for (String requiredSkill : j.getRequiredSkills()) {
            boolean match = false;

            for (String userSkill : p.skills) {
                if (requiredSkill.equalsIgnoreCase(userSkill)) {
                    match = true;
                    break;
                }
            }

            if (!match) {
                System.out.println("→ Missing: " + requiredSkill);
                found = true;
            }
        }

        if (!found) {
            System.out.println("No missing skills. Great match!");
        }
    }
}
package LinkedinAnalyzer;
import java.util.*;

public class Main {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        System.out.println("===== SmartHire System =====");
        System.out.println("1. Analyze Resume Profile");
        System.out.println("2. Analyze LinkedIn Profile");
        System.out.print("Enter your choice: ");

        int choice = sc.nextInt();
        sc.nextLine(); 

        Profile p;

        if (choice == 1) {
            p = new ResumeProfile();
        } else {
            p = new LinkedInProfile();
        }

        // 🔥 Pass scanner here
        p.extractData(sc);

        Job job = new Job(
                "Java Developer",
                Arrays.asList("Java", "SQL", "Spring")
        );

        Analyzer analyzer = new Analyzer();

        int score = analyzer.calculateScore(p, job);

        System.out.println("\n===== ANALYSIS RESULT =====");
        System.out.println("Name: " + p.name);
        System.out.println("Applied Role: " + job.getRole());
        System.out.println("Your Skills: " + p.skills);
        System.out.println("Match Score: " + score + "%");

        analyzer.checkEligibility(score);
        analyzer.showMissingSkills(p, job);

        sc.close(); // close ONLY once at end
    }
}
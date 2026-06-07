package LinkedinAnalyzer;
import java.util.*;

class ResumeProfile extends Profile {

    void extractData(Scanner sc) {

        System.out.print("Enter your name: ");
        name = sc.nextLine();

        System.out.print("Enter number of skills: ");
        int n = sc.nextInt();
        sc.nextLine(); // FIX: consume newline

        skills = new ArrayList<>();

        System.out.println("Enter your skills:");
        for (int i = 0; i < n; i++) {
            skills.add(sc.nextLine());
        }
    }
}
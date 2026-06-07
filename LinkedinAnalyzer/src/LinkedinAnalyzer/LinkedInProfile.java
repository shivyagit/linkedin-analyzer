package LinkedinAnalyzer;
import java.util.*;

class LinkedInProfile extends Profile {

    void extractData(Scanner sc) {

        System.out.print("Enter your LinkedIn name: ");
        name = sc.nextLine();

        System.out.print("Enter number of skills: ");
        int n = sc.nextInt();
        sc.nextLine();

        skills = new ArrayList<>();

        System.out.println("Enter your LinkedIn skills:");
        for (int i = 0; i < n; i++) {
            skills.add(sc.nextLine());
        }
    }
}
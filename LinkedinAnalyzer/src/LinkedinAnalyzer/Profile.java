package LinkedinAnalyzer;
import java.util.*;

abstract class Profile {
    String name;
    List<String> skills;

    abstract void extractData(Scanner sc);
}
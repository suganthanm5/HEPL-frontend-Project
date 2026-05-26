import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class UpdateDB {
    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3307/oms?useSSL=false&allowPublicKeyRetrieval=true", "root", "root");
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("ALTER TABLE users MODIFY COLUMN role VARCHAR(50)");
            System.out.println("Success!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

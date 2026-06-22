import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;

public class TestDb2 {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:6543/postgres";
        Properties props = new Properties();
        props.setProperty("user", "postgres");
        props.setProperty("password", "Klth1639@@@");
        props.setProperty("sslmode", "require");
        
        try {
            System.out.println("Testando conexao...");
            Connection conn = DriverManager.getConnection(url, props);
            System.out.println("Conexao OK!");
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

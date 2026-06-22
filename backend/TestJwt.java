import com.dacarto.matrizes.security.JwtTokenProvider;

public class TestJwt {
    public static void main(String[] args) {
        try {
            JwtTokenProvider provider = new JwtTokenProvider();
            String token = provider.generateToken("admin", "ADMIN");
            System.out.println("Generated token: " + token);
            boolean isValid = provider.validateToken(token);
            System.out.println("Is valid: " + isValid);
            String username = provider.getUsernameFromJWT(token);
            System.out.println("Username: " + username);
            String role = provider.getRoleFromJWT(token);
            System.out.println("Role: " + role);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

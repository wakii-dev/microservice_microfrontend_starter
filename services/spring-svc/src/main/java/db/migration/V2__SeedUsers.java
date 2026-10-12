package db.migration;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.util.UUID;

/**
 * V2 — seed bảng users ĐỌC contracts/auth/users.json qua env USERS_FIXTURE_PATH
 * (compose mount /app/contracts/auth/users.json — cùng file auth-mock đọc runtime).
 * Id phải khớp fixture 100% — assert trong SeedMatchIntegrationTest.
 * Fail-fast khi thiếu/sai file/malformed (platform/conventions/06 rule 6).
 * Fixture evolution: thêm user mới sau khi V2 đã applied = V3 migration riêng (README ADR).
 */
public class V2__SeedUsers extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        String fixturePath = System.getenv("USERS_FIXTURE_PATH");
        if (fixturePath == null || fixturePath.isBlank()) {
            throw new IllegalStateException(
                    "USERS_FIXTURE_PATH is required (seed đọc contracts/auth/users.json — conventions/06)");
        }
        Path path = Path.of(fixturePath);
        if (!Files.exists(path)) {
            throw new IllegalStateException("users fixture not found at " + fixturePath);
        }

        // FAIL_ON_UNKNOWN_PROPERTIES=false — fixture có key "$comment"
        ObjectMapper mapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        JsonNode users = mapper.readTree(path.toFile()).get("users");
        if (users == null || !users.isArray() || users.isEmpty()) {
            throw new IllegalStateException("users fixture malformed: expected non-empty users[] at " + fixturePath);
        }

        String sql = "INSERT INTO users (id, email, display_name, roles) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = context.getConnection().prepareStatement(sql)) {
            for (JsonNode u : users) {
                stmt.setObject(1, UUID.fromString(required(u, "id").asText()));
                stmt.setString(2, required(u, "email").asText());
                stmt.setString(3, required(u, "displayName").asText());
                JsonNode roles = required(u, "roles");
                String[] roleArray = new String[roles.size()];
                for (int i = 0; i < roles.size(); i++) {
                    roleArray[i] = roles.get(i).asText();
                }
                stmt.setArray(4, context.getConnection().createArrayOf("text", roleArray));
                stmt.addBatch();
            }
            stmt.executeBatch();
        }
    }

    private static JsonNode required(JsonNode user, String field) {
        JsonNode value = user.get(field);
        if (value == null || value.isNull()) {
            throw new IllegalStateException("users fixture entry missing required field: " + field);
        }
        return value;
    }
}

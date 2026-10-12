package com.example.springsvc.seed;

import com.example.springsvc.domain.User;
import com.example.springsvc.domain.UserRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * THE acceptance exit criterion (sf-3.md #4): users trong DB có id trùng khớp
 * contracts/auth/users.json 100%. Đọc CÙNG file thật qua USERS_FIXTURE_PATH
 * (CI trỏ về contracts/auth/users.json tuyệt đối; compose mount vào container).
 * KHÔNG @Transactional — assert trạng thái seed thuần, không phụ thuộc test khác.
 */
@SpringBootTest(properties = "app.jwt-secret=test-secret-for-jwt-filter-0123456789abcdef")
class SeedMatchIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Value("${app.users-fixture-path:}")
    private String fixturePath;

    @Test
    void seededUsersMatchFixture100Percent() throws Exception {
        assertThat(fixturePath).as("USERS_FIXTURE_PATH must be set for the seed-match test").isNotBlank();
        Path fixture = Path.of(fixturePath);
        assertThat(Files.exists(fixture)).as("fixture exists at " + fixture).isTrue();

        ObjectMapper mapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        JsonNode fixtureUsers = mapper.readTree(Files.readString(fixture)).get("users");

        List<User> dbUsers = userRepository.findAll();
        assertThat(dbUsers).hasSameSizeAs(fixtureUsers);

        Map<UUID, User> dbById = dbUsers.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        for (JsonNode fixtureUser : fixtureUsers) {
            UUID id = UUID.fromString(fixtureUser.get("id").asText());
            User dbUser = dbById.get(id);
            assertThat(dbUser)
                    .as("fixture user %s must exist in DB with the SAME id", id)
                    .isNotNull();
            assertThat(dbUser.getEmail()).isEqualTo(fixtureUser.get("email").asText());
            assertThat(dbUser.getDisplayName()).isEqualTo(fixtureUser.get("displayName").asText());
            assertThat(new HashSet<>(dbUser.getRoles()))
                    .containsExactlyInAnyOrderElementsOf(
                            mapper.convertValue(fixtureUser.get("roles"), List.class));
        }
    }
}

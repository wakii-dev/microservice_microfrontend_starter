package com.example.springsvc.web;

import com.example.springsvc.api.UsersApi;
import com.example.springsvc.api.model.CreateUserRequest;
import com.example.springsvc.api.model.HealthStatus;
import com.example.springsvc.api.model.Role;
import com.example.springsvc.api.model.UpdateUserRequest;
import com.example.springsvc.api.model.User;
import com.example.springsvc.api.model.UserList;
import com.example.springsvc.domain.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Users API — implement generated UsersApi (codegen từ snapshot users.yaml).
 * interfaceOnly KHÔNG gắn class-level base path → implementor tự gắn
 * (property openapi.usersAPI.base-path, default /api/users khớp FINAL path table §4.5).
 * Mirrors getHealthz/getReadyz → /api/users/healthz|readyz (probe thật dùng naked — HealthController).
 */
@RestController
@RequestMapping("${openapi.usersAPI.base-path:/api/users}")
public class UserController implements UsersApi {

    private final UserRepository users;
    private final Validator validator;

    @PersistenceContext
    private EntityManager em;

    public UserController(UserRepository users, Validator validator) {
        this.users = users;
        this.validator = validator;
    }

    @Override
    public ResponseEntity<UserList> listUsers(Integer limit, Integer offset) {
        int safeLimit = limit == null ? 50 : limit;
        int safeOffset = offset == null ? 0 : offset;
        if (safeLimit < 1 || safeLimit > 100) {
            throw ApiException.badRequest("limit must be between 1 and 100");
        }
        if (safeOffset < 0) {
            throw ApiException.badRequest("offset must be >= 0");
        }
        // raw offset (không divisible-safe như PageRequest) — đúng nghĩa query param của contract
        List<com.example.springsvc.domain.User> items = em
                .createQuery("select u from User u order by u.email", com.example.springsvc.domain.User.class)
                .setFirstResult(safeOffset)
                .setMaxResults(safeLimit)
                .getResultList();
        UserList list = new UserList();
        list.setItems(items.stream().map(UserController::toApi).toList());
        list.setTotal(Math.toIntExact(users.count()));
        return ResponseEntity.ok(list);
    }

    @Override
    @Transactional
    public ResponseEntity<User> createUser(CreateUserRequest createUserRequest) {
        validate(createUserRequest);
        String email = createUserRequest.getEmail();
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("Email already exists: " + mask(email));
        }
        // Contract default: [user] — server-side apply (codegen không apply khi deserialize)
        List<Role> roles = createUserRequest.getRoles() == null || createUserRequest.getRoles().isEmpty()
                ? List.of(Role.USER)
                : createUserRequest.getRoles();
        // ⚠️ import collision: User (imported) = api.model.User — entity phải fully-qualify
        com.example.springsvc.domain.User user = new com.example.springsvc.domain.User(
                UUID.randomUUID(), email,
                createUserRequest.getDisplayName(), roles.stream().map(Role::getValue).toList());
        users.save(user);
        return ResponseEntity.status(201).body(toApi(user));
    }

    @Override
    public ResponseEntity<User> getUser(UUID userId) {
        return ResponseEntity.ok(toApi(find(userId)));
    }

    @Override
    @Transactional
    public ResponseEntity<User> updateUser(UUID userId, UpdateUserRequest updateUserRequest) {
        // Constraint trên generated model (displayName minLength 1...) — @Valid trên interface
        // param KHÔNG inherit xuống impl → validate thủ công như createUser (review P1)
        var violations = validator.validate(updateUserRequest);
        if (!violations.isEmpty()) {
            ConstraintViolation<UpdateUserRequest> first = violations.iterator().next();
            throw ApiException.badRequest(first.getPropertyPath() + " " + first.getMessage());
        }
        boolean hasDisplayName = updateUserRequest.getDisplayName() != null;
        // roles: [] hợp lệ (set rỗng) — chỉ coi absent khi null (contract minProperties tính key)
        boolean hasRoles = updateUserRequest.getRoles() != null;
        if (!hasDisplayName && !hasRoles) {
            // contract minProperties: 1
            throw ApiException.badRequest("At least one of displayName, roles is required");
        }
        com.example.springsvc.domain.User user = find(userId);
        if (hasDisplayName) {
            user.setDisplayName(updateUserRequest.getDisplayName());
        }
        if (hasRoles) {
            user.setRoles(updateUserRequest.getRoles().stream().map(Role::getValue).toList());
        }
        users.save(user);
        return ResponseEntity.ok(toApi(user));
    }

    // ---- mirrors của healthz/readyz theo spec §4.5 (probe thật = naked path) ----

    @Override
    public ResponseEntity<HealthStatus> getHealthz() {
        return ResponseEntity.ok(okStatus());
    }

    @Override
    public ResponseEntity<HealthStatus> getReadyz() {
        return ResponseEntity.ok(okStatus());
    }

    // ---- helpers ----

    private void validate(CreateUserRequest request) {
        var violations = validator.validate(request);
        if (!violations.isEmpty()) {
            ConstraintViolation<CreateUserRequest> first = violations.iterator().next();
            throw ApiException.badRequest(first.getPropertyPath() + " " + first.getMessage());
        }
    }

    private com.example.springsvc.domain.User find(UUID id) {
        return users.findById(id)
                .orElseThrow(() -> ApiException.notFound("User " + id + " not found"));
    }

    private static HealthStatus okStatus() {
        HealthStatus status = new HealthStatus();
        status.setStatus(HealthStatus.StatusEnum.OK);
        return status;
    }

    private static User toApi(com.example.springsvc.domain.User entity) {
        User user = new User();
        user.setId(entity.getId());
        user.setEmail(entity.getEmail());
        user.setDisplayName(entity.getDisplayName());
        user.setRoles(entity.getRoles().stream().map(Role::fromValue).toList());
        return user;
    }

    private static String mask(String email) {
        int at = email.indexOf('@');
        return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }
}

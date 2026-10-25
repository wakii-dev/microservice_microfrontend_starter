package com.example.springsvc.service;

import com.example.springsvc.domain.Team;
import com.example.springsvc.domain.TeamRepository;
import com.example.springsvc.domain.UserRepository;
import com.example.springsvc.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

/**
 * TeamService — service layer (SF-4, FI-78): demo Situation A.
 *
 * Situation A — nhiều step CÙNG 1 DB: 1 transaction là đủ. Method tạo team qua
 * N lệnh ghi riêng biệt (teams.save + team_members từng dòng qua repository),
 * có step GIỮA có thể fail → @Transactional rollback TOÀN BỘ (team + members
 * đã insert trước đó cùng biến mất). So sánh Situation B (cross-service —
 * Kafka saga, xem docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md):
 * 1 transaction KHÔNG phủ được service khác → cần outbox + compensation.
 */
@Service
public class TeamService {

    /**
     * Rollback trigger DEMO — deterministic, dùng fixture CÓ SẴN trong
     * contracts/auth/users.json (không cần user mới). Member có email này
     * KHÔNG thể thêm vào team → step insert member đó throw giữa chừng.
     */
    public static final String ROLLBACK_TRIGGER_EMAIL = "alice@demo.local";

    private final TeamRepository teams;
    private final UserRepository users;

    public TeamService(TeamRepository teams, UserRepository users) {
        this.teams = teams;
        this.users = users;
    }

    /**
     * Tạo team + members qua N step trong MỘT transaction:
     * step 1 — INSERT teams row (flush ngay để FK team_members thấy row);
     * step 2..n — INSERT team_members từng dòng qua repository; member trùng
     * trigger email → throw 409 → rollback toàn bộ các step trước.
     *
     * // Tạo team + members qua N step — fail giữa chừng = rollback toàn bộ
     * // Create team + members in N steps — mid-fail rolls back everything
     */
    @Transactional
    public CreatedTeam createTeam(String name, List<UUID> memberIds) {
        if (name == null || name.isBlank()) {
            throw ApiException.badRequest("name không được trống");
        }
        // dedupe giữ insertion order (team_members PK (team_id, user_id)) — "vị trí giữa" deterministic
        LinkedHashSet<UUID> deduped = new LinkedHashSet<>(
                memberIds == null ? List.of() : memberIds);

        // Step 1 — lệnh ghi 1: team row
        Team team = teams.saveAndFlush(new Team(name));

        // Step 2..n — lệnh ghi 2+: từng member, insert line-by-line qua repository
        for (UUID memberId : deduped) {
            users.findById(memberId)
                    .filter(user -> ROLLBACK_TRIGGER_EMAIL.equals(user.getEmail()))
                    .ifPresent(user -> {
                        throw ApiException.conflict("Member " + user.getEmail()
                                + " không thể thêm vào team (rollback demo trigger)");
                    });
            teams.insertMember(team.getId(), memberId);
        }
        return new CreatedTeam(team, List.copyOf(deduped));
    }

    /**
     * Kết quả create — memberIds là danh sách ĐÃ dedupe (echo contract);
     * KHÔNG đọc qua entity collection vì members được insert native
     * (không nằm trong persistence context — mutate managed collection sẽ
     * khiến flush cascade ghi trùng PK).
     */
    public record CreatedTeam(Team team, List<UUID> memberIds) {
    }
}

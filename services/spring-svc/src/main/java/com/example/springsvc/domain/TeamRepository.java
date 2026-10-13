package com.example.springsvc.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {

    /**
     * Insert team_members TỪNG DÒNG — mỗi lần gọi là 1 lệnh ghi riêng trong
     * transaction của TeamService (demo @Transactional N-step, Situation A).
     * Gọi SAU khi team row đã flush (FK team_members → teams).
     */
    @Modifying
    @Query(value = "INSERT INTO team_members (team_id, user_id) VALUES (:teamId, :userId)",
            nativeQuery = true)
    int insertMember(@Param("teamId") UUID teamId, @Param("userId") UUID userId);

    // Rollback assert qua repository (Rule 0 — không chỉ nhìn response code)
    boolean existsByName(String name);

    @Query(value = "SELECT COUNT(*) FROM team_members tm "
            + "WHERE tm.team_id IN (SELECT id FROM teams WHERE name = :name)", nativeQuery = true)
    long countMembersByTeamName(@Param("name") String name);

    // Test cleanup (test non-transactional commit thật) — DB cascade dọn team_members
    long deleteByName(String name);
}

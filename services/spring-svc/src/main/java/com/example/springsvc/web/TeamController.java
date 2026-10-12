package com.example.springsvc.web;

import com.example.springsvc.api.TeamsApi;
import com.example.springsvc.api.model.CreateTeamRequest;
import com.example.springsvc.api.model.Team;
import com.example.springsvc.api.model.TeamList;
import com.example.springsvc.domain.TeamRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

/**
 * Teams API — implement generated TeamsApi. FINAL path (contract-resolved):
 * /api/users/teams, /api/users/teams/{teamId}. interfaceOnly KHÔNG gắn base path
 * → class-level @RequestMapping như UserController. memberIds dedupe trước insert
 * (team_members PK (team_id, user_id) — tránh 500 vi phạm PK).
 */
@RestController
@RequestMapping("${openapi.usersAPI.base-path:/api/users}")
public class TeamController implements TeamsApi {

    private final TeamRepository teams;
    private final Validator validator;

    public TeamController(TeamRepository teams, Validator validator) {
        this.teams = teams;
        this.validator = validator;
    }

    @Override
    public ResponseEntity<TeamList> listTeams() {
        List<com.example.springsvc.domain.Team> all = teams.findAll();
        TeamList list = new TeamList();
        list.setItems(all.stream().map(TeamController::toApi).toList());
        list.setTotal(all.size());
        return ResponseEntity.ok(list);
    }

    @Override
    @Transactional
    public ResponseEntity<Team> createTeam(CreateTeamRequest createTeamRequest) {
        var violations = validator.validate(createTeamRequest);
        if (!violations.isEmpty()) {
            ConstraintViolation<CreateTeamRequest> first = violations.iterator().next();
            throw ApiException.badRequest(first.getPropertyPath() + " " + first.getMessage());
        }
        com.example.springsvc.domain.Team team = new com.example.springsvc.domain.Team(createTeamRequest.getName());
        if (createTeamRequest.getMemberIds() != null) {
            team.setMemberIds(new LinkedHashSet<>(createTeamRequest.getMemberIds()));
        }
        teams.save(team);
        return ResponseEntity.status(201).body(toApi(team));
    }

    @Override
    public ResponseEntity<Team> getTeam(UUID teamId) {
        com.example.springsvc.domain.Team team = teams.findById(teamId)
                .orElseThrow(() -> ApiException.notFound("Team " + teamId + " not found"));
        return ResponseEntity.ok(toApi(team));
    }

    private static Team toApi(com.example.springsvc.domain.Team entity) {
        Team team = new Team();
        team.setId(entity.getId());
        team.setName(entity.getName());
        team.setMemberIds(List.copyOf(entity.getMemberIds()));
        return team;
    }
}

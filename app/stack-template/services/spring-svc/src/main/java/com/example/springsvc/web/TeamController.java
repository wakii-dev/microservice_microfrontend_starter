package com.example.springsvc.web;

import com.example.springsvc.api.TeamsApi;
import com.example.springsvc.api.model.CreateTeamRequest;
import com.example.springsvc.api.model.Team;
import com.example.springsvc.api.model.TeamList;
import com.example.springsvc.domain.TeamRepository;
import com.example.springsvc.service.TeamService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Teams API — implement generated TeamsApi. FINAL path (contract-resolved):
 * /api/users/teams, /api/users/teams/{teamId}. interfaceOnly KHÔNG gắn base path
 * → class-level @RequestMapping như UserController. memberIds dedupe trước insert
 * (team_members PK (team_id, user_id) — tránh 500 vi phạm PK).
 * SF-4 (FI-78): createTeam DELEGATE sang TeamService — @Transactional N-step
 * rollback demo nằm ở service layer (không ở controller).
 */
@RestController
@RequestMapping("${openapi.usersAPI.base-path:/api/users}")
public class TeamController implements TeamsApi {

    private final TeamRepository teams;
    private final TeamService teamService;
    private final Validator validator;

    public TeamController(TeamRepository teams, TeamService teamService, Validator validator) {
        this.teams = teams;
        this.teamService = teamService;
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
    public ResponseEntity<Team> createTeam(CreateTeamRequest createTeamRequest) {
        var violations = validator.validate(createTeamRequest);
        if (!violations.isEmpty()) {
            ConstraintViolation<CreateTeamRequest> first = violations.iterator().next();
            throw ApiException.badRequest(first.getPropertyPath() + " " + first.getMessage());
        }
        TeamService.CreatedTeam created = teamService.createTeam(
                createTeamRequest.getName(), createTeamRequest.getMemberIds());
        Team team = new Team();
        team.setId(created.team().getId());
        team.setName(created.team().getName());
        team.setMemberIds(created.memberIds());
        return ResponseEntity.status(201).body(team);
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

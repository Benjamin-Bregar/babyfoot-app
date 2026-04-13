import { Match, initMatchModel } from "./match.model";
import { MatchPlayer, initMatchPlayerModel } from "./matchPlayer.model";
import { MatchTeam, initMatchTeamModel } from "./matchTeam.model";
import { Team, initTeamModel } from "./team.model";
import { Tournament, initTournamentModel } from "./tournament.model";
import { TournamentTeam, initTournamentTeamModel } from "./tournamentTeam.model";
import { User, initUserModel } from "./user.model";
import { sequelize } from "../services/database";

let initialized = false;

export const initializeModels = (): void => {
  if (initialized) {
    return;
  }

  initTeamModel(sequelize);
  initUserModel(sequelize);
  initTournamentModel(sequelize);
  initMatchModel(sequelize);
  initMatchTeamModel(sequelize);
  initMatchPlayerModel(sequelize);
  initTournamentTeamModel(sequelize);

  Team.hasMany(User, { foreignKey: "teamId", as: "users" });
  User.belongsTo(Team, { foreignKey: "teamId", as: "team" });

  Tournament.hasMany(Match, { foreignKey: "tournamentId", as: "matches" });
  Match.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });

  Match.belongsToMany(Team, {
    through: MatchTeam,
    foreignKey: "matchId",
    otherKey: "teamId",
    as: "teams",
  });
  Team.belongsToMany(Match, {
    through: MatchTeam,
    foreignKey: "teamId",
    otherKey: "matchId",
    as: "matches",
  });

  Match.belongsToMany(User, {
    through: MatchPlayer,
    foreignKey: "matchId",
    otherKey: "playerId",
    as: "players",
  });
  User.belongsToMany(Match, {
    through: MatchPlayer,
    foreignKey: "playerId",
    otherKey: "matchId",
    as: "playedMatches",
  });

  Tournament.belongsToMany(Team, {
    through: TournamentTeam,
    foreignKey: "tournamentId",
    otherKey: "teamId",
    as: "teams",
  });
  Team.belongsToMany(Tournament, {
    through: TournamentTeam,
    foreignKey: "teamId",
    otherKey: "tournamentId",
    as: "tournaments",
  });

  initialized = true;
};

export const models = {
  Team,
  User,
  Tournament,
  Match,
  MatchTeam,
  MatchPlayer,
  TournamentTeam,
};

import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class TournamentTeam extends Model<
  InferAttributes<TournamentTeam>,
  InferCreationAttributes<TournamentTeam>
> {
  declare id: CreationOptional<number>;
  declare tournamentId: number;
  declare teamId: number;
  declare played: number;
  declare won: number;
  declare drawn: number;
  declare lost: number;
  declare points: number;
}

export const initTournamentTeamModel = (sequelize: Sequelize): void => {
  TournamentTeam.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tournamentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "tournament_id",
        references: {
          model: "tournament",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "team_id",
        references: {
          model: "team",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      played: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      won: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      drawn: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      lost: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      sequelize,
      modelName: "TournamentTeam",
      tableName: "tournament_team",
      indexes: [
        {
          unique: true,
          fields: ["tournament_id", "team_id"],
          name: "unique_tournament_team",
        },
      ],
    }
  );
};

import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class MatchTeam extends Model<
  InferAttributes<MatchTeam>,
  InferCreationAttributes<MatchTeam>
> {
  declare id: CreationOptional<number>;
  declare matchId: number;
  declare teamId: number;
  declare score: number | null;
}

export const initMatchTeamModel = (sequelize: Sequelize): void => {
  MatchTeam.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      matchId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "match_id",
        references: {
          model: "match",
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
      score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
    },
    {
      sequelize,
      modelName: "MatchTeam",
      tableName: "match_team",
      indexes: [
        {
          unique: true,
          fields: ["match_id", "team_id"],
          name: "unique_match_team",
        },
      ],
    }
  );
};

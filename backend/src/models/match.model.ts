import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export type MatchStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export class Match extends Model<InferAttributes<Match>, InferCreationAttributes<Match>> {
  declare id: CreationOptional<number>;
  declare tournamentId: number;
  declare matchDate: Date | null;
  declare round: string | null;
  declare status: MatchStatus;
}

export const initMatchModel = (sequelize: Sequelize): void => {
  Match.init(
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
      },
      matchDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "match_date",
      },
      round: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("scheduled", "in_progress", "completed", "cancelled"),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Match",
      tableName: "match",
    }
  );
};

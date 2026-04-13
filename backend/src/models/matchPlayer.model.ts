import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class MatchPlayer extends Model<
  InferAttributes<MatchPlayer>,
  InferCreationAttributes<MatchPlayer>
> {
  declare id: CreationOptional<number>;
  declare matchId: number;
  declare playerId: number;
  declare goals: number;
}

export const initMatchPlayerModel = (sequelize: Sequelize): void => {
  MatchPlayer.init(
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
      playerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "player_id",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      goals: {
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
      modelName: "MatchPlayer",
      tableName: "match_player",
      indexes: [
        {
          unique: true,
          fields: ["match_id", "player_id"],
          name: "unique_match_player",
        },
      ],
    }
  );
};

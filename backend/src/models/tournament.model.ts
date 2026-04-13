import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class Tournament extends Model<
  InferAttributes<Tournament>,
  InferCreationAttributes<Tournament>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare startDate: string;
  declare endDate: string | null;
  declare description: string | null;
}

export const initTournamentModel = (sequelize: Sequelize): void => {
  Tournament.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "start_date",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "end_date",
        validate: {
          isAfterStartDate(this: Tournament, value: string | null): void {
            if (value && this.startDate && value < this.startDate) {
              throw new Error("endDate must be greater than or equal to startDate");
            }
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Tournament",
      tableName: "tournament",
    }
  );
};

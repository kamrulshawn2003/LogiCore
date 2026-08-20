module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define('Driver', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    license_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    vehicle_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    vehicle_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('AVAILABLE', 'ASSIGNED', 'ON_DELIVERY', 'OFF_DUTY', 'INACTIVE'),
      defaultValue: 'AVAILABLE'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00
    },
    total_deliveries: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completed_deliveries: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'drivers',
    timestamps: true,
    underscored: true
  });

  Driver.associate = (models) => {
    Driver.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Driver.hasMany(models.Shipment, {
      foreignKey: 'driver_id',
      as: 'shipments'
    });
  };

  return Driver;
};
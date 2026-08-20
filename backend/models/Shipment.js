module.exports = (sequelize, DataTypes) => {
  const Shipment = sequelize.define('Shipment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    shipment_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'drivers',
        key: 'id'
      }
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    status: {
      type: DataTypes.ENUM(
        'READY',
        'ASSIGNED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
        'RETURNED'
      ),
      defaultValue: 'READY'
    },
    pickup_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shipped_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estimated_delivery: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actual_delivery: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivery_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recipient_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    recipient_signature: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'shipments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['order_id']
      },
      {
        fields: ['driver_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  Shipment.associate = (models) => {
    Shipment.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });
    Shipment.belongsTo(models.Warehouse, {
      foreignKey: 'warehouse_id',
      as: 'warehouse'
    });
    Shipment.belongsTo(models.Driver, {
      foreignKey: 'driver_id',
      as: 'driver'
    });
  };

  return Shipment;
};
module.exports = (sequelize, DataTypes) => {
  const Warehouse = sequelize.define('Warehouse', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    capacity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    }
  }, {
    tableName: 'warehouses',
    timestamps: true,
    underscored: true
  });

  Warehouse.associate = (models) => {
    Warehouse.belongsTo(models.User, {
      foreignKey: 'manager_id',
      as: 'manager'
    });
    Warehouse.hasMany(models.Inventory, {
      foreignKey: 'warehouse_id',
      as: 'inventory'
    });
    Warehouse.hasMany(models.PurchaseOrder, {
      foreignKey: 'warehouse_id',
      as: 'purchaseOrders'
    });
    Warehouse.hasMany(models.Order, {
      foreignKey: 'warehouse_id',
      as: 'orders'
    });
    Warehouse.hasMany(models.Shipment, {
      foreignKey: 'warehouse_id',
      as: 'shipments'
    });
    Warehouse.hasMany(models.User, {
      foreignKey: 'warehouse_id',
      as: 'workers'
    });
    Warehouse.hasMany(models.InventoryMovement, {
      foreignKey: 'warehouse_id',
      as: 'movements'
    });
  };

  return Warehouse;
};
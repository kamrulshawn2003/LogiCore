module.exports = (sequelize, DataTypes) => {
  const InventoryMovement = sequelize.define('InventoryMovement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'RETURN'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true
      }
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'inventory_movements',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['product_id']
      },
      {
        fields: ['warehouse_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['reference_type', 'reference_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  InventoryMovement.associate = (models) => {
    InventoryMovement.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
    InventoryMovement.belongsTo(models.Warehouse, {
      foreignKey: 'warehouse_id',
      as: 'warehouse'
    });
    InventoryMovement.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  return InventoryMovement;
};
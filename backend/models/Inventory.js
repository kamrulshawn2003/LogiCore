module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define('Inventory', {
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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    reserved_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    reorder_level: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: 0
      }
    },
    last_counted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'inventory',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'warehouse_id']
      }
    ],
    hooks: {
      beforeUpdate: async (inventory) => {
        if (inventory.reserved_quantity > inventory.quantity) {
          throw new Error('Reserved quantity cannot exceed total quantity');
        }
      }
    }
  });

  Inventory.prototype.getAvailableQuantity = function() {
    return this.quantity - this.reserved_quantity;
  };

  Inventory.prototype.isLowStock = function() {
    return this.getAvailableQuantity() <= this.reorder_level;
  };

  Inventory.associate = (models) => {
    Inventory.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
    Inventory.belongsTo(models.Warehouse, {
      foreignKey: 'warehouse_id',
      as: 'warehouse'
    });
  };

  return Inventory;
};
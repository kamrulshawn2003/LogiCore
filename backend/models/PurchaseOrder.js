module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    po_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'suppliers',
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
    status: {
      type: DataTypes.ENUM(
        'DRAFT', 
        'SUBMITTED', 
        'APPROVED', 
        'ACCEPTED', 
        'PARTIALLY_RECEIVED', 
        'RECEIVED', 
        'CANCELLED', 
        'REJECTED'
      ),
      defaultValue: 'DRAFT',
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    expected_delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
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
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['supplier_id']
      },
      {
        fields: ['warehouse_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier'
    });
    PurchaseOrder.belongsTo(models.Warehouse, {
      foreignKey: 'warehouse_id',
      as: 'warehouse'
    });
    PurchaseOrder.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    PurchaseOrder.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });
    PurchaseOrder.hasMany(models.PurchaseOrderItem, {
      foreignKey: 'purchase_order_id',
      as: 'items'
    });
  };

  return PurchaseOrder;
};
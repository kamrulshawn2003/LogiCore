module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURN_REQUESTED',
        'RETURNED'
      ),
      defaultValue: 'PENDING',
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shipping_city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    shipping_state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    shipping_zip: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    shipping_country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    payment_status: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
      defaultValue: 'PENDING'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['customer_id']
      },
      {
        fields: ['warehouse_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['payment_status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, {
      foreignKey: 'customer_id',
      as: 'customer'
    });
    Order.belongsTo(models.Warehouse, {
      foreignKey: 'warehouse_id',
      as: 'warehouse'
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'items'
    });
    Order.hasOne(models.Shipment, {
      foreignKey: 'order_id',
      as: 'shipment'
    });
  };

  return Order;
};
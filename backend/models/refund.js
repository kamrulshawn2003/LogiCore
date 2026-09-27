module.exports = (sequelize, DataTypes) => {
  const Refund = sequelize.define('Refund', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    refund_number: {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('REFUND', 'RETURN'),
      allowNull: false,
      defaultValue: 'REFUND'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    admin_note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decided_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'refunds',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['order_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  Refund.associate = (models) => {
    Refund.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });
    Refund.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'customer'
    });
    Refund.belongsTo(models.User, {
      foreignKey: 'decided_by',
      as: 'decidedBy'
    });
  };

  return Refund;
};

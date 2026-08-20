const { Driver, User, Shipment, sequelize } = require('../models');
const { Op } = require('sequelize');

class DriverService {
  async getAllDrivers(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (status) {
      where.status = status;
    }

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { rows, count } = await Driver.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: ['id', 'name', 'email', 'phone', 'status']
        },
        {
          model: Shipment,
          as: 'shipments',
          attributes: ['id', 'shipment_number', 'status', 'created_at'],
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    // Add delivery statistics
    const driversWithStats = rows.map(driver => ({
      ...driver.toJSON(),
      statistics: {
        total_shipments: driver.total_deliveries || 0,
        completed_shipments: driver.completed_deliveries || 0,
        completion_rate: driver.total_deliveries > 0 ? 
          (driver.completed_deliveries / driver.total_deliveries) * 100 : 0
      }
    }));

    return {
      drivers: driversWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getDriverById(id) {
    const driver = await Driver.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'status']
        },
        {
          model: Shipment,
          as: 'shipments',
          attributes: [
            'id', 'shipment_number', 'tracking_number', 'status',
            'pickup_time', 'estimated_delivery', 'actual_delivery', 'created_at'
          ],
          limit: 20,
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Calculate statistics
    const totalShipments = await Shipment.count({ where: { driver_id: id } });
    const completedShipments = await Shipment.count({ 
      where: { driver_id: id, status: 'DELIVERED' } 
    });
    const activeShipments = await Shipment.count({ 
      where: { 
        driver_id: id, 
        status: { [Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } 
      } 
    });
    
    return {
      ...driver.toJSON(),
      statistics: {
        total_shipments: totalShipments,
        completed_shipments: completedShipments,
        active_shipments: activeShipments,
        completion_rate: totalShipments > 0 ? 
          (completedShipments / totalShipments) * 100 : 0
      }
    };
  }

  async createDriver(driverData) {
    const { user_id, license_number, vehicle_number, vehicle_type } = driverData;
    
    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is already a driver
    const existingDriver = await Driver.findOne({ where: { user_id } });
    if (existingDriver) {
      throw new Error('User is already registered as a driver');
    }
    
    // Check if license number is unique
    const existingLicense = await Driver.findOne({ where: { license_number } });
    if (existingLicense) {
      throw new Error('License number already exists');
    }
    
    // Create driver
    const driver = await Driver.create({
      user_id,
      license_number,
      vehicle_number,
      vehicle_type,
      status: 'AVAILABLE'
    });
    
    // Update user role if needed
    if (user.role !== 'driver') {
      await user.update({ role: 'driver' });
    }
    
    return driver;
  }

  async updateDriver(id, driverData) {
    const driver = await Driver.findByPk(id);
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    const { license_number, vehicle_number, vehicle_type, status } = driverData;
    
    // Check license uniqueness if being changed
    if (license_number && license_number !== driver.license_number) {
      const existingLicense = await Driver.findOne({ 
        where: { 
          license_number,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingLicense) {
        throw new Error('License number already exists');
      }
    }
    
    await driver.update({
      license_number: license_number || driver.license_number,
      vehicle_number: vehicle_number !== undefined ? vehicle_number : driver.vehicle_number,
      vehicle_type: vehicle_type !== undefined ? vehicle_type : driver.vehicle_type,
      status: status || driver.status
    });
    
    return driver;
  }

  async deleteDriver(id) {
    const driver = await Driver.findByPk(id);
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Check if driver has active shipments
    const activeShipments = await Shipment.count({
      where: {
        driver_id: id,
        status: { [Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] }
      }
    });
    
    if (activeShipments > 0) {
      throw new Error('Cannot delete driver with active shipments');
    }
    
    // Soft delete - deactivate driver
    await driver.update({ status: 'INACTIVE' });
    
    // Update user status
    await User.update(
      { status: 'inactive' },
      { where: { id: driver.user_id } }
    );
    
    return { message: 'Driver deactivated successfully' };
  }

  async updateDriverStatus(id, status) {
    const driver = await Driver.findByPk(id);
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    const validStatuses = ['AVAILABLE', 'ASSIGNED', 'ON_DELIVERY', 'OFF_DUTY', 'INACTIVE'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid driver status');
    }
    
    await driver.update({ status });
    
    return driver;
  }

  async getDriverShipments(driverId, query = {}) {
    const {
      page = 1,
      limit = 10,
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = { driver_id: driverId };
    
    if (status) {
      where.status = status;
    }

    const { rows, count } = await Shipment.findAndCountAll({
      where,
      include: [
        {
          model: require('../models').Order,
          as: 'order',
          attributes: ['id', 'order_number', 'shipping_address', 'shipping_city', 'shipping_state']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      shipments: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getDriverStatistics() {
    const totalDrivers = await Driver.count();
    const availableDrivers = await Driver.count({ where: { status: 'AVAILABLE' } });
    const assignedDrivers = await Driver.count({ where: { status: 'ASSIGNED' } });
    const onDeliveryDrivers = await Driver.count({ where: { status: 'ON_DELIVERY' } });
    const offDutyDrivers = await Driver.count({ where: { status: 'OFF_DUTY' } });
    
    const topDrivers = await Driver.findAll({
      attributes: [
        'id',
        'license_number',
        'total_deliveries',
        'completed_deliveries',
        'rating'
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ],
      order: [['completed_deliveries', 'DESC']],
      limit: 10
    });
    
    return {
      total_drivers: totalDrivers,
      available_drivers: availableDrivers,
      assigned_drivers: assignedDrivers,
      on_delivery_drivers: onDeliveryDrivers,
      off_duty_drivers: offDutyDrivers,
      top_drivers: topDrivers
    };
  }
}

module.exports = new DriverService();
const { UserAddress } = require('../models');
const { Op } = require('sequelize');

class AddressService {
  async listAddresses(userId) {
    return UserAddress.findAll({
      where: { user_id: userId },
      order: [
        ['is_default', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
  }

  async createAddress(userId, data) {
    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      country,
      is_default
    } = data;

    const count = await UserAddress.count({ where: { user_id: userId } });

    const makeDefault = is_default || count === 0;

    if (makeDefault) {
      await UserAddress.update(
        { is_default: false },
        { where: { user_id: userId } }
      );
    }

    const address = await UserAddress.create({
      user_id: userId,
      full_name,
      phone,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state: state || null,
      zip: zip || null,
      country: country || 'China',
      is_default: makeDefault
    });

    return address;
  }

  async updateAddress(userId, id, data) {
    const address = await UserAddress.findOne({
      where: { id, user_id: userId }
    });

    if (!address) {
      const err = new Error('Address not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      country,
      is_default
    } = data;

    await address.update({
      full_name: full_name !== undefined ? full_name : address.full_name,
      phone: phone !== undefined ? phone : address.phone,
      address_line1: address_line1 !== undefined ? address_line1 : address.address_line1,
      address_line2: address_line2 !== undefined ? address_line2 : address.address_line2,
      city: city !== undefined ? city : address.city,
      state: state !== undefined ? state : address.state,
      zip: zip !== undefined ? zip : address.zip,
      country: country !== undefined ? country : address.country,
      is_default: is_default !== undefined ? is_default : address.is_default
    });

    if (is_default) {
      await UserAddress.update(
        { is_default: false },
        { where: { user_id: userId, id: { [Op.ne]: address.id } } }
      );
    }

    return address;
  }

  async setDefault(userId, id) {
    const address = await UserAddress.findOne({
      where: { id, user_id: userId }
    });

    if (!address) {
      const err = new Error('Address not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    await UserAddress.update(
      { is_default: false },
      { where: { user_id: userId } }
    );

    await address.update({ is_default: true });
    return address;
  }

  async deleteAddress(userId, id) {
    const address = await UserAddress.findOne({
      where: { id, user_id: userId }
    });

    if (!address) {
      const err = new Error('Address not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    await address.destroy();

    // If the deleted address was default, promote the most recent one
    const remaining = await UserAddress.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    if (remaining.length && remaining[0].is_default === false) {
      await remaining[0].update({ is_default: true });
    }

    return { message: 'Address deleted' };
  }
}

module.exports = new AddressService();

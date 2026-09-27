import React, { useState, useEffect } from 'react';
import { addressService } from '../../services/addressService';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  zip: '',
  country: 'China',
};

const AddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const result = await addressService.getAll();
      setAddresses(result);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditing(addr);
    setForm({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state || '',
      zip: addr.zip || '',
      country: addr.country || 'China',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await addressService.update(editing.id, form);
        toast.success('Address updated');
      } else {
        await addressService.create(form);
        toast.success('Address added');
      }
      setShowForm(false);
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressService.remove(id);
      toast.success('Address deleted');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiMapPin className="h-6 w-6 text-brand-600" /> My Addresses
        </h1>
        <button
          onClick={openCreate}
          className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-brand-700 transition-colors flex items-center gap-1"
        >
          <FiPlus className="h-4 w-4" /> New Address
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <h2 className="md:col-span-2 font-bold text-gray-900">
            {editing ? 'Edit Address' : 'Add New Address'}
          </h2>
          <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input required placeholder="Address line 1" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input placeholder="Address line 2 (optional)" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input placeholder="State / Province" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input placeholder="ZIP / Postal code" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="bg-brand-600 text-white font-medium py-2.5 px-6 rounded-md hover:bg-brand-700 text-sm">
              {editing ? 'Save Changes' : 'Add Address'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-gray-300 text-gray-600 font-medium py-2.5 px-6 rounded-md hover:border-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <FiMapPin className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-3 text-gray-500">No addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white rounded-xl border border-gray-100 p-5 relative"
            >
              {addr.is_default && (
                <span className="absolute top-4 right-4 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded flex items-center gap-1">
                  <FiCheckCircle className="h-3 w-3" /> Default
                </span>
              )}
              <p className="font-semibold text-gray-900">{addr.full_name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
              <p className="text-sm text-gray-600 mt-2">
                {addr.address_line1}
                {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                <br />
                {addr.city}
                {addr.state ? `, ${addr.state}` : ''} {addr.zip || ''}, {addr.country}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <button onClick={() => handleSetDefault(addr.id)} className="text-gray-500 hover:text-brand-600">
                  Set as default
                </button>
                <button onClick={() => openEdit(addr)} className="text-gray-500 hover:text-brand-600 flex items-center gap-1">
                  <FiEdit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(addr.id)} className="text-gray-500 hover:text-red-500 flex items-center gap-1">
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;

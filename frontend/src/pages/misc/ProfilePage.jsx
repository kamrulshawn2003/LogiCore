import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

const ProfilePage = () => {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const handleChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{user?.phone || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Role</label>
              <p className="mt-1 text-sm text-gray-900">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-4">
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              register={register}
              error={errors.currentPassword?.message}
              validation={{ required: 'Current password is required' }}
            />
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              register={register}
              error={errors.newPassword?.message}
              validation={{
                required: 'New password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
              }}
            />
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              register={register}
              error={errors.confirmPassword?.message}
              validation={{ required: 'Please confirm your password' }}
            />
            <Button type="submit">Change Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
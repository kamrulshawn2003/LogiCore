import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';

const RegisterPage = () => {
  const { register: registerUser, loading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    await registerUser(data);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center">Create your account</h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Or{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          sign in to your account
        </Link>
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            label="Full name"
            name="name"
            type="text"
            placeholder="John Doe"
            register={register}
            error={errors.name?.message}
            validation={{ required: 'Name is required' }}
          />
          <Input
            label="Email address"
            name="email"
            type="email"
            placeholder="you@example.com"
            register={register}
            error={errors.email?.message}
            validation={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            }}
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            placeholder="+1234567890"
            register={register}
            error={errors.phone?.message}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            register={register}
            error={errors.password?.message}
            validation={{
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                message: 'Must contain uppercase, lowercase, number, and special character',
              },
            }}
          />
          <Select
            label="Role"
            name="role"
            register={register}
            error={errors.role?.message}
            options={[
              { value: 'customer', label: 'Customer' },
              { value: 'supplier', label: 'Supplier' },
              { value: 'driver', label: 'Driver' },
            ]}
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </div>
  );
};

export default RegisterPage;
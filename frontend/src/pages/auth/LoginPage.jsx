import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FiMail, FiLock } from 'react-icons/fi';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    await login(data.email, data.password);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center">Sign in to your account</h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Or{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
          create a new account
        </Link>
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
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
            icon={<FiMail className="h-5 w-5 text-gray-400" />}
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
            }}
            icon={<FiLock className="h-5 w-5 text-gray-400" />}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Demo accounts</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-600">
          <div className="bg-gray-50 p-2 rounded">
            <strong>Admin:</strong> admin@logicore.com / Password123!
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <strong>Manager:</strong> manager@logicore.com / Password123!
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <strong>Customer:</strong> customer@logicore.com / Password123!
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
        data: { must_change_password: false },
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully! Welcome aboard.');
      router.push('/');
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Passwords match', met: formData.password.length > 0 && formData.password === formData.confirmPassword },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-indigo-600 p-3 rounded-lg">
                <FiLock className="h-10 w-10 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-white mb-2">
              Set Your Password
            </h2>
            <p className="text-center text-gray-400 text-sm mb-8">
              Welcome! Your account was created by your store admin. Please set your own personal password to secure your account.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your new password"
                    className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter your new password"
                    className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                  >
                    {showConfirm ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Requirements */}
              {formData.password.length > 0 && (
                <ul className="space-y-1">
                  {requirements.map((req) => (
                    <li key={req.label} className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-400' : 'text-gray-400'}`}>
                      <FiCheck className={`h-3.5 w-3.5 flex-shrink-0 ${req.met ? 'text-green-400' : 'text-gray-600'}`} />
                      {req.label}
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
                  loading ? 'bg-indigo-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Set Password & Continue'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

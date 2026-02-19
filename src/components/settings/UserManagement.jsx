'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import {
  FiUserPlus, FiEdit2, FiTrash2, FiUser, FiLock,
  FiCopy, FiCheck, FiEye, FiEyeOff, FiAlertCircle,
} from 'react-icons/fi';

const ROLES = [
  { value: 'cashier', label: 'Cashier' },
  { value: 'manager', label: 'Manager' },
];

export default function UserManagement({ storeId }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'cashier',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId) fetchUsers();
  }, [storeId]);

  const resetForm = () => {
    setFormData({ email: '', first_name: '', last_name: '', role: 'cashier', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    const cashierCount = users.filter((u) => u.role === 'cashier').length;
    if (formData.role === 'cashier' && cashierCount >= 3) {
      toast.error('You can only have up to 3 cashier accounts');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          store_id: storeId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setUsers([result.user, ...users]);
      setCreatedUser({ ...formData });
      setShowUserForm(false);
      resetForm();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id)
        .select()
        .single();

      if (error) throw error;

      setUsers(users.map((u) => (u.id === data.id ? data : u)));
      setShowUserForm(false);
      resetForm();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, authUserId: user.auth_user_id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setUsers(users.filter((u) => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdUser) return;
    const text = `Email: ${createdUser.email}\nPassword: ${createdUser.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">User Management</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowUserForm(true);
          }}
          disabled={users.filter((u) => u.role === 'cashier').length >= 3}
        >
          <FiUserPlus className="mr-2" /> Add User
        </Button>
      </div>

      {users.filter((u) => u.role === 'cashier').length >= 3 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mb-6">
          <div className="flex">
            <FiLock className="h-5 w-5 text-yellow-400 dark:text-yellow-300 flex-shrink-0 mt-0.5" />
            <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
              You've reached the maximum of 3 cashier accounts. Upgrade your plan to add more users.
            </p>
          </div>
        </div>
      )}

      {isLoading && users.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <FiUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No users found</h3>
          <p className="mt-1 text-gray-500">Get started by adding a new user to your store</p>
          <div className="mt-6">
            <Button onClick={() => { resetForm(); setShowUserForm(true); }}>
              <FiUserPlus className="mr-2" /> Add User
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : user.role === 'manager'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {ROLES.find((r) => r.value === user.role)?.label || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setFormData({
                            email: user.email,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            role: user.role,
                            password: '',
                            confirmPassword: '',
                          });
                          setShowUserForm(true);
                        }}
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'admin'}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>

              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                {!editingUser && (
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="staff@yourbusiness.com"
                    required
                    disabled={isLoading}
                  />
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                    disabled={isLoading}
                  />
                  <Input
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    required
                    disabled={isLoading}
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                {/* Password fields — only shown when creating */}
                {!editingUser && (
                  <>
                    {/* Guidance banner */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 flex gap-2">
                      <FiAlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <span className="font-semibold">Choose a professional, memorable password</span> — for example <span className="font-mono">Staff@2024</span>. You'll share this directly with the staff member. They'll be required to change it when they first log in.
                      </p>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Temporary Password
                      </label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleChange}
                          required
                          placeholder="Min. 8 characters"
                          disabled={isLoading}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm pr-10 py-2 px-3"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          placeholder="Re-enter password"
                          disabled={isLoading}
                          className={`block w-full rounded-md border shadow-sm focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm pr-10 py-2 px-3 ${
                            formData.confirmPassword.length > 0
                              ? passwordsMatch
                                ? 'border-green-400 focus:border-green-500 dark:border-green-600'
                                : 'border-red-400 focus:border-red-500 dark:border-red-600'
                              : 'border-gray-300 focus:border-blue-500 dark:border-gray-600'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formData.confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => { setShowUserForm(false); resetForm(); }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingUser ? 'Save Changes' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && createdUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Created</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {createdUser.first_name}'s account is ready to use immediately.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Login Credentials to Share
                </p>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{createdUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Temporary Password</p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white mt-0.5">{createdUser.password}</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-5 flex gap-2">
                <FiLock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {createdUser.first_name} can log in right away — no email confirmation needed. They'll be prompted to set their own personal password on first login.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={copyCredentials}>
                  {copied ? (
                    <><FiCheck className="mr-2 h-4 w-4 text-green-500" /> Copied!</>
                  ) : (
                    <><FiCopy className="mr-2 h-4 w-4" /> Copy Credentials</>
                  )}
                </Button>
                <Button className="flex-1" onClick={() => { setShowSuccessModal(false); setCreatedUser(null); }}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

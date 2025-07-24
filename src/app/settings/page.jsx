'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import StoreSettings from '@/components/settings/StoreSettings';
import UserManagement from '@/components/settings/UserManagement';
import EmailMarketing from '@/components/settings/EmailMarketing';
import { FiSettings, FiUsers, FiMail } from 'react-icons/fi';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [storeData, setStoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('cashier');

  // Fetch store data and user role
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Get user profile to determine role and store ID
        const { data: userProfile } = await supabase
          .from('users')
          .select('role, store_id')
          .eq('auth_user_id', user.id)
          .single();
          
        if (userProfile) {
          setUserRole(userProfile.role);
          
          // Get store data
          const { data: store } = await supabase
            .from('stores')
            .select('*')
            .eq('id', userProfile.store_id)
            .single();
            
          setStoreData(store);
        }
      } catch (error) {
        console.error('Error fetching settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <p className="text-gray-500">Manage your store configuration and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('store')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'store'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
            }`}
          >
            <FiSettings /> Store Settings
          </button>
          
          {userRole === 'owner' && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                <FiUsers /> User Management
              </button>
              
              <button
                onClick={() => setActiveTab('email')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'email'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                <FiMail /> Email Marketing
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {activeTab === 'store' && <StoreSettings storeData={storeData} />}
        {activeTab === 'users' && userRole === 'owner' && <UserManagement storeId={storeData?.id} />}
        {activeTab === 'email' && userRole === 'owner' && <EmailMarketing storeId={storeData?.id} />}
      </div>
    </div>
  );
}
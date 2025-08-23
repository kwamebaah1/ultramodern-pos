'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import StoreSettings from '@/components/settings/StoreSettings';
import UserManagement from '@/components/settings/UserManagement';
import EmailMarketing from '@/components/settings/EmailMarketing';
import PasswordSettings from '@/components/settings/PasswordSettings';
import { FiSettings, FiUsers, FiMail, FiKey, FiChevronDown } from 'react-icons/fi';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [storeData, setStoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('cashier');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  // Function to get tab display name
  const getTabName = (tabId) => {
    switch(tabId) {
      case 'store': return 'Store Settings';
      case 'password': return 'Password';
      case 'users': return 'User Management';
      case 'email': return 'Email Marketing';
      default: return tabId;
    }
  };

  // Function to get tab icon
  const getTabIcon = (tabId) => {
    switch(tabId) {
      case 'store': return <FiSettings />;
      case 'password': return <FiKey />;
      case 'users': return <FiUsers />;
      case 'email': return <FiMail />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold">Store Settings</h1>
        <p className="text-gray-500 text-sm md:text-base">Manage your store configuration and preferences</p>
      </div>

      {/* Mobile Dropdown Navigation */}
      <div className="md:hidden mb-4 relative">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full flex justify-between items-center p-3 border border-gray-300 rounded-lg bg-white shadow-sm"
        >
          <div className="flex items-center gap-2">
            {getTabIcon(activeTab)}
            <span>{getTabName(activeTab)}</span>
          </div>
          <FiChevronDown className={`transform transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
        </button>
        
        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            <button
              onClick={() => {
                setActiveTab('store');
                setShowMobileMenu(false);
              }}
              className={`w-full text-left p-3 flex items-center gap-2 ${
                activeTab === 'store' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <FiSettings /> Store Settings
            </button>
            
            <button
              onClick={() => {
                setActiveTab('password');
                setShowMobileMenu(false);
              }}
              className={`w-full text-left p-3 flex items-center gap-2 ${
                activeTab === 'password' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <FiKey /> Password
            </button>
            
            {userRole === 'owner' && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('users');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left p-3 flex items-center gap-2 ${
                    activeTab === 'users' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <FiUsers /> User Management
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('email');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left p-3 flex items-center gap-2 ${
                    activeTab === 'email' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <FiMail /> Email Marketing
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden md:block border-b border-gray-200 dark:border-gray-700 mb-6">
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
          
          <button
            onClick={() => setActiveTab('password')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
            }`}
          >
            <FiKey /> Password
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden p-4 md:p-6">
        {activeTab === 'store' && <StoreSettings storeData={storeData} />}
        {activeTab === 'password' && <PasswordSettings />}
        {activeTab === 'users' && userRole === 'owner' && <UserManagement storeId={storeData?.id} />}
        {activeTab === 'email' && userRole === 'owner' && <EmailMarketing storeId={storeData?.id} />}
      </div>
    </div>
  );
}
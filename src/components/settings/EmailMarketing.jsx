'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiZap } from 'react-icons/fi';

export default function EmailMarketing({ storeId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [emailContent, setEmailContent] = useState({
    subject: '',
    body: '',
  });

  useEffect(() => {
    const checkSubscription = async () => {
      const { data } = await supabase
        .from('stores')
        .select('email_marketing_enabled')
        .eq('id', storeId)
        .single();
        
      setIsSubscribed(data?.email_marketing_enabled || false);
    };
    
    if (storeId) checkSubscription();
  }, [storeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailContent(prev => ({ ...prev, [name]: value }));
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (!emailContent.subject || !emailContent.body) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, you would integrate with an email service
      // This is just a mock implementation
      const { error } = await supabase
        .from('email_campaigns')
        .insert({
          store_id: storeId,
          subject: emailContent.subject,
          body: emailContent.body,
          status: 'pending',
        });
        
      if (error) throw error;
      
      toast.success('Email campaign created successfully! It will be sent shortly.');
      setEmailContent({ subject: '', body: '' });
    } catch (error) {
      console.error('Error creating email campaign:', error);
      toast.error('Failed to create email campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!confirm('Email marketing costs $9.99/month. Continue?')) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, you would process payment here
      const { error } = await supabase
        .from('stores')
        .update({
          email_marketing_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);
        
      if (error) throw error;
      
      setIsSubscribed(true);
      toast.success('Email marketing enabled successfully!');
    } catch (error) {
      console.error('Error enabling email marketing:', error);
      toast.error('Failed to enable email marketing');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium">Email Marketing</h2>
        <p className="text-gray-500 mt-1">
          Send promotional emails to your customers
        </p>
      </div>
      
      {!isSubscribed ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <FiLock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="mt-3 text-lg font-medium">Email Marketing Locked</h3>
            <p className="mt-2 text-sm text-gray-500">
              Upgrade your plan to unlock email marketing features and reach your customers directly.
            </p>
            <div className="mt-6">
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="inline-flex items-center"
              >
                <FiZap className="mr-2" /> 
                {isLoading ? 'Processing...' : 'Unlock for $9.99/month'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendEmail} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                id="subject"
                value={emailContent.subject}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                required
              />
            </div>
            
            <div className="mt-4">
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Content
              </label>
              <textarea
                name="body"
                id="body"
                rows={8}
                value={emailContent.body}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                required
              />
            </div>
            
            <div className="mt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">
                    This email will be sent to all your customers. You can preview before sending.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
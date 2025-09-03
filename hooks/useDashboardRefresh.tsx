'use client';

import { useEffect } from 'react';
import { dashboardRefreshManager, RefreshTrigger } from '@/lib/refresh-utils';

/**
 * Hook to subscribe to dashboard refresh events
 * @param trigger - Type of refresh to listen for ('students', 'events', or 'all')
 * @param callback - Function to call when refresh is triggered
 */
export const useDashboardRefresh = (trigger: RefreshTrigger, callback: () => void) => {
  useEffect(() => {
    const unsubscribe = dashboardRefreshManager.subscribe(trigger, callback);
    return unsubscribe;
  }, [trigger, callback]);
};

/**
 * Hook for components that need to refresh on any data change
 * @param callback - Function to call when any data changes
 */
export const useAllDataRefresh = (callback: () => void) => {
  useDashboardRefresh('all', callback);
};

/**
 * Hook for components that need to refresh when student data changes
 * @param callback - Function to call when student data changes
 */
export const useStudentDataRefresh = (callback: () => void) => {
  useDashboardRefresh('students', callback);
};

/**
 * Hook for components that need to refresh when event data changes
 * @param callback - Function to call when event data changes
 */
export const useEventDataRefresh = (callback: () => void) => {
  useDashboardRefresh('events', callback);
};
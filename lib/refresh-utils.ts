// Utility for refreshing dashboard data after CRUD operations
export type RefreshTrigger = 'students' | 'events' | 'all';

// Simple event emitter for dashboard refresh
class DashboardRefreshManager {
  private listeners: Map<RefreshTrigger, Set<() => void>> = new Map();

  constructor() {
    this.listeners.set('students', new Set());
    this.listeners.set('events', new Set());
    this.listeners.set('all', new Set());
  }

  subscribe(trigger: RefreshTrigger, callback: () => void) {
    const callbacks = this.listeners.get(trigger);
    if (callbacks) {
      callbacks.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(trigger);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  triggerRefresh(trigger: RefreshTrigger) {
    // Trigger specific listeners
    const specificCallbacks = this.listeners.get(trigger);
    if (specificCallbacks) {
      specificCallbacks.forEach(callback => callback());
    }

    // Also trigger 'all' listeners
    const allCallbacks = this.listeners.get('all');
    if (allCallbacks) {
      allCallbacks.forEach(callback => callback());
    }
  }
}

// Global instance
export const dashboardRefreshManager = new DashboardRefreshManager();

// Helper functions for common CRUD operations
export const triggerStudentRefresh = () => {
  dashboardRefreshManager.triggerRefresh('students');
};

export const triggerEventRefresh = () => {
  dashboardRefreshManager.triggerRefresh('events');
};

export const triggerAllRefresh = () => {
  dashboardRefreshManager.triggerRefresh('all');
};
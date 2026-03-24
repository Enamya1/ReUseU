/**
 * useToast Hook
 * Provides toast notification functionality
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
  visible: boolean;
}

interface ToastContextType {
  toasts: ToastMessage[];
  toast: (options: { title: string; description?: string; type?: ToastType; duration?: number }) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((options: {
    title: string;
    description?: string;
    type?: ToastType;
    duration?: number;
  }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = {
      id,
      title: options.title,
      description: options.description,
      type: options.type || 'default',
      duration: options.duration || 4000,
      visible: true,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, newToast.duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience functions matching web platform
export const toast = {
  success: (title: string, description?: string) => {
    // This is a placeholder - actual implementation needs context
    console.log(`[SUCCESS] ${title}${description ? `: ${description}` : ''}`);
  },
  error: (title: string, description?: string) => {
    console.log(`[ERROR] ${title}${description ? `: ${description}` : ''}`);
  },
  warning: (title: string, description?: string) => {
    console.log(`[WARNING] ${title}${description ? `: ${description}` : ''}`);
  },
  info: (title: string, description?: string) => {
    console.log(`[INFO] ${title}${description ? `: ${description}` : ''}`);
  },
};

import { useEffect, useRef, useState } from 'react';

/**
 * Hook for managing focus trapping within modals or dialogs
 */
export const useFocusTrap = (isOpen: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the first focusable element in the container
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }

      // Handle tab key navigation
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          const focusableElements = containerRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<HTMLElement>;

          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            // Shift+Tab - move to previous element
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            // Tab - move to next element
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }

        // Close on Escape key
        if (event.key === 'Escape') {
          event.preventDefault();
          // You can add an onClose callback here if needed
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus to the previously active element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  return containerRef;
};

/**
 * Hook for screen reader announcements
 */
export const useAnnouncements = () => {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Set aria-live priority for screen readers
    const liveRegion = document.querySelector(`[aria-live="${priority}"]`) as HTMLElement;
    if (liveRegion) {
      liveRegion.textContent = message;
    }
    
    setAnnouncement(message);
    
    // Clear announcement after a short delay to allow re-announcement of the same message
    setTimeout(() => setAnnouncement(''), 100);
  };

  return { announce, announcement };
};

/**
 * Hook for keyboard navigation detection
 */
export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.setAttribute('data-keyboard-navigation', 'true');
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.removeAttribute('data-keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
};

/**
 * Hook for managing reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for toast notifications with screen reader support
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>>([]);

  const { announce } = useAnnouncements();

  const addToast = (
    message: string, 
    type: 'success' | 'error' | 'info' = 'info',
    duration = 5000
  ) => {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    // Announce to screen readers
    announce(`${type}: ${message}`, type === 'error' ? 'assertive' : 'polite');

    // Auto-remove toast
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { addToast, removeToast, toasts };
};

/**
 * Hook for managing loading states with accessibility
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const { announce } = useAnnouncements();

  const setLoading = (loading: boolean, message?: string) => {
    setIsLoading(loading);
    if (loading && message) {
      announce(`Loading: ${message}`);
    } else if (!loading) {
      announce('Loading complete');
    }
  };

  return { isLoading, setLoading };
};

/**
 * Hook for form validation with accessibility
 */
export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announce } = useAnnouncements();

  const validateField = (name: string, value: string, rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  }) => {
    let error = '';

    if (rules.required && !value.trim()) {
      error = `${name} is required`;
    } else if (rules.minLength && value.length < rules.minLength) {
      error = `${name} must be at least ${rules.minLength} characters`;
    } else if (rules.maxLength && value.length > rules.maxLength) {
      error = `${name} must be no more than ${rules.maxLength} characters`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = `${name} format is invalid`;
    } else if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) error = customError;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    if (error) {
      announce(`Validation error: ${error}`, 'assertive');
    }

    return !error;
  };

  const clearErrors = () => setErrors({});

  const getFieldProps = (name: string) => ({
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return { errors, validateField, clearErrors, getFieldProps };
};

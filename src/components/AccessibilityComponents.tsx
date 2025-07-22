import React from 'react';
import { useFocusTrap, useAnnouncements } from '../hooks/useAccessibility';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const containerRef = useFocusTrap(isOpen);
  const { announce } = useAnnouncements();

  React.useEffect(() => {
    if (isOpen) {
      announce(`Dialog opened: ${title}`);
    }
  }, [isOpen, title, announce]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={containerRef}
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AccessibleFormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  multiline = false,
  rows = 3
}) => {
  const inputId = `field-${name}`;
  const errorId = `${name}-error`;

  const InputComponent = multiline ? 'textarea' : 'input';
  const inputProps = {
    id: inputId,
    name,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e.target.value),
    className: `form-input ${error ? 'form-input-error' : ''}`,
    placeholder,
    disabled,
    required,
    'aria-invalid': error ? ('true' as const) : ('false' as const),
    'aria-describedby': error ? errorId : undefined,
    ...(multiline ? { rows } : { type })
  };

  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span className="required-indicator" aria-label="required"> *</span>}
      </label>
      <InputComponent {...inputProps} />
      {error && (
        <div id={errorId} className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

interface AccessibleButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  ariaLabel,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''}`}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading && (
        <span className="loading-spinner" aria-hidden="true"></span>
      )}
      <span className={loading ? 'loading-text' : ''}>
        {children}
      </span>
    </button>
  );
};

interface AccessibleTableProps {
  caption: string;
  headers: string[];
  data: Record<string, any>[];
  sortable?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  headers,
  data,
  sortable = false,
  onSort,
  sortColumn,
  sortDirection
}) => {
  const handleSort = (column: string) => {
    if (!sortable || !onSort) return;
    
    const newDirection = 
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column, newDirection);
  };

  return (
    <table className="table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              onClick={() => sortable && handleSort(header)}
              className={sortable ? 'sortable' : ''}
              aria-sort={
                sortColumn === header
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : sortable
                  ? 'none'
                  : undefined
              }
              tabIndex={sortable ? 0 : undefined}
              onKeyDown={(e) => {
                if (sortable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleSort(header);
                }
              }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {headers.map((header) => (
              <td key={header}>{row[header]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

interface SkipLinksProps {
  links?: Array<{ href: string; label: string }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ 
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' }
  ]
}) => {
  return (
    <nav className="skip-links" aria-label="Skip links">
      {links.map((link) => (
        <a key={link.href} href={link.href} className="skip-link">
          {link.label}
        </a>
      ))}
    </nav>
  );
};

interface AnnouncementRegionProps {
  announcement: string;
  priority?: 'polite' | 'assertive';
}

export const AnnouncementRegion: React.FC<AnnouncementRegionProps> = ({
  announcement,
  priority = 'polite'
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
};

interface ToastNotificationProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastNotificationProps> = ({
  toasts,
  onRemove
}) => {
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
          <span>{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => onRemove(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 'medium'
}) => {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <span 
        className={`loading-spinner loading-spinner-${size}`} 
        aria-hidden="true"
      ></span>
      <span className="loading-text">{message}</span>
    </div>
  );
};

interface ErrorMessageProps {
  name: string;
  error: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ name, error }) => (
  <div id={`${name}-error`} className="form-error" role="alert">
    {error}
  </div>
);

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  children,
  dismissible = false,
  onDismiss
}) => {
  const role = type === 'error' ? 'alert' : 'status';
  
  return (
    <div className={`status-message status-${type}`} role={role}>
      <div className="status-icon" aria-hidden="true">
        {type === 'success' && '✓'}
        {type === 'error' && '⚠'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </div>
      <div className="status-content">{children}</div>
      {dismissible && onDismiss && (
        <button
          className="status-close"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  );
};

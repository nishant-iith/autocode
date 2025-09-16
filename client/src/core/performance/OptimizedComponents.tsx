/**
 * Optimized React Components
 * Provides memoized and performance-optimized React components
 */

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { performanceMonitor } from './PerformanceMonitor';

/**
 * Memoized chat message component for better list performance
 */
interface OptimizedChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: number;
    isStreaming?: boolean;
  };
  isLast: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}

export const OptimizedChatMessage = memo<OptimizedChatMessageProps>(
  ({ message, isLast, onEdit, onDelete }) => {
    const handleEdit = useCallback(() => {
      if (onEdit) {
        performanceMonitor.incrementCounter('ui.message.edit');
        onEdit(message.id, message.content);
      }
    }, [message.id, message.content, onEdit]);

    const handleDelete = useCallback(() => {
      if (onDelete) {
        performanceMonitor.incrementCounter('ui.message.delete');
        onDelete(message.id);
      }
    }, [message.id, onDelete]);

    const formattedTime = useMemo(() => {
      return new Date(message.timestamp).toLocaleTimeString();
    }, [message.timestamp]);

    const messageClass = useMemo(() => {
      const baseClass = 'message-container';
      const roleClass = `message-${message.role}`;
      const lastClass = isLast ? 'message-last' : '';
      const streamingClass = message.isStreaming ? 'message-streaming' : '';

      return [baseClass, roleClass, lastClass, streamingClass].filter(Boolean).join(' ');
    }, [message.role, isLast, message.isStreaming]);

    return (
      <div className={messageClass}>
        <div className="message-header">
          <span className="message-role">{message.role}</span>
          <span className="message-time">{formattedTime}</span>
        </div>
        <div className="message-content">
          {message.content}
        </div>
        {(onEdit || onDelete) && (
          <div className="message-actions">
            {onEdit && (
              <button onClick={handleEdit} className="message-action-edit">
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={handleDelete} className="message-action-delete">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for better memoization
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.isStreaming === nextProps.message.isStreaming &&
      prevProps.isLast === nextProps.isLast
    );
  }
);

OptimizedChatMessage.displayName = 'OptimizedChatMessage';

/**
 * Virtualized list component for handling large datasets
 */
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = ''
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange.start, visibleRange.end]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    performanceMonitor.recordMetric({
      name: 'ui.virtualizedList.itemsRendered',
      value: visibleItems.length,
      timestamp: Date.now(),
      category: 'count'
    });
  }, [visibleItems.length]);

  return (
    <div
      className={`virtualized-list ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleRange.start + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Throttled input component for search and filtering
 */
interface ThrottledInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export const ThrottledInput = memo<ThrottledInputProps>(
  ({ value, onChange, placeholder, delay = 300, className = '' }) => {
    const [localValue, setLocalValue] = useState(value);

    const debouncedOnChange = useMemo(() => {
      let timeoutId: NodeJS.Timeout;

      return (newValue: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          performanceMonitor.incrementCounter('ui.input.debounced');
          onChange(newValue);
        }, delay);
      };
    }, [onChange, delay]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    }, [debouncedOnChange]);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    return (
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }
);

ThrottledInput.displayName = 'ThrottledInput';

/**
 * Lazy loaded component wrapper
 */
interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ComponentNode;
  [key: string]: any;
}

export function LazyComponent({ loader, fallback = <div>Loading...</div>, ...props }: LazyComponentProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    performanceMonitor.startTiming('ui.lazyComponent.load');

    loader()
      .then((module) => {
        if (mounted) {
          setComponent(() => module.default);
          setLoading(false);
          performanceMonitor.endTiming('ui.lazyComponent.load');
          performanceMonitor.incrementCounter('ui.lazyComponent.success');
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
          performanceMonitor.endTiming('ui.lazyComponent.load');
          performanceMonitor.incrementCounter('ui.lazyComponent.error');
        }
      });

    return () => {
      mounted = false;
    };
  }, [loader]);

  if (error) {
    return <div>Error loading component: {error.message}</div>;
  }

  if (loading || !Component) {
    return <>{fallback}</>;
  }

  return <Component {...props} />;
}

/**
 * Memoized data table component
 */
interface OptimizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
  }>;
  keyExtractor: (item: T) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function OptimizedTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className = ''
}: OptimizedTableProps<T>) {
  const memoizedRows = useMemo(() => {
    return data.map((row) => ({
      key: keyExtractor(row),
      row,
      cells: columns.map((column) => ({
        key: column.key,
        value: row[column.key],
        rendered: column.render ? column.render(row[column.key], row) : row[column.key]
      }))
    }));
  }, [data, columns, keyExtractor]);

  const handleRowClick = useCallback((row: T) => {
    if (onRowClick) {
      performanceMonitor.incrementCounter('ui.table.rowClick');
      onRowClick(row);
    }
  }, [onRowClick]);

  useEffect(() => {
    performanceMonitor.recordMetric({
      name: 'ui.table.rowsRendered',
      value: data.length,
      timestamp: Date.now(),
      category: 'count'
    });
  }, [data.length]);

  return (
    <table className={`optimized-table ${className}`}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {memoizedRows.map(({ key, row, cells }) => (
          <tr
            key={key}
            onClick={() => handleRowClick(row)}
            className={onRowClick ? 'clickable' : ''}
          >
            {cells.map((cell) => (
              <td key={String(cell.key)}>{cell.rendered}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Performance monitoring wrapper component
 */
interface PerformanceWrapperProps {
  name: string;
  children: React.ReactNode;
  trackRender?: boolean;
  trackMount?: boolean;
}

export function PerformanceWrapper({
  name,
  children,
  trackRender = true,
  trackMount = true
}: PerformanceWrapperProps) {
  useEffect(() => {
    if (trackMount) {
      performanceMonitor.incrementCounter(`ui.component.mount.${name}`);

      return () => {
        performanceMonitor.incrementCounter(`ui.component.unmount.${name}`);
      };
    }
  }, [name, trackMount]);

  useEffect(() => {
    if (trackRender) {
      performanceMonitor.incrementCounter(`ui.component.render.${name}`);
    }
  });

  return <>{children}</>;
}
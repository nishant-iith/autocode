/**
 * Performance Monitor
 * Tracks and analyzes application performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'timing' | 'memory' | 'count' | 'size';
  tags?: Record<string, string>;
}

export interface TimingMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  timings: Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    recentSamples: number[];
  }>;
  memory: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  operations: Record<string, number>;
  errors: Record<string, number>;
  timestamp: number;
}

/**
 * Performance monitoring and metrics collection service
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timings = new Map<string, TimingMetric>();
  private counters = new Map<string, number>();
  private maxMetricsHistory = 10000;
  private startTime = Date.now();

  /**
   * Start timing an operation
   */
  startTiming(name: string, tags?: Record<string, string>): void {
    this.timings.set(name, {
      name,
      startTime: performance.now(),
      tags
    });
  }

  /**
   * End timing an operation
   */
  endTiming(name: string): number | undefined {
    const timing = this.timings.get(name);
    if (!timing) {
      console.warn(`No timing started for: ${name}`);
      return undefined;
    }

    const endTime = performance.now();
    const duration = endTime - timing.startTime;

    timing.endTime = endTime;
    timing.duration = duration;

    // Record metric
    this.recordMetric({
      name: `timing.${name}`,
      value: duration,
      timestamp: Date.now(),
      category: 'timing',
      tags: timing.tags
    });

    this.timings.delete(name);
    return duration;
  }

  /**
   * Measure execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    this.startTiming(name, tags);
    try {
      const result = await fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      this.incrementCounter(`error.${name}`);
      throw error;
    }
  }

  /**
   * Measure execution time of a synchronous function
   */
  measure<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    this.startTiming(name, tags);
    try {
      const result = fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      this.incrementCounter(`error.${name}`);
      throw error;
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Trim old metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, value = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);

    this.recordMetric({
      name: `counter.${name}`,
      value: current + value,
      timestamp: Date.now(),
      category: 'count'
    });
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric({
        name: 'memory.used',
        value: memory.usedJSHeapSize,
        timestamp: Date.now(),
        category: 'memory'
      });
      this.recordMetric({
        name: 'memory.total',
        value: memory.totalJSHeapSize,
        timestamp: Date.now(),
        category: 'memory'
      });
    }
  }

  /**
   * Record file operation metrics
   */
  recordFileOperation(operation: string, fileSize?: number, success = true): void {
    this.incrementCounter(`file.${operation}.${success ? 'success' : 'error'}`);

    if (fileSize !== undefined) {
      this.recordMetric({
        name: `file.${operation}.size`,
        value: fileSize,
        timestamp: Date.now(),
        category: 'size'
      });
    }
  }

  /**
   * Record AI operation metrics
   */
  recordAIOperation(
    operation: string,
    tokens?: number,
    responseTime?: number,
    success = true
  ): void {
    this.incrementCounter(`ai.${operation}.${success ? 'success' : 'error'}`);

    if (tokens !== undefined) {
      this.recordMetric({
        name: `ai.${operation}.tokens`,
        value: tokens,
        timestamp: Date.now(),
        category: 'count'
      });
    }

    if (responseTime !== undefined) {
      this.recordMetric({
        name: `ai.${operation}.responseTime`,
        value: responseTime,
        timestamp: Date.now(),
        category: 'timing'
      });
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes

    // Aggregate timing metrics
    const timings: Record<string, any> = {};
    const timingMetrics = recentMetrics.filter(m => m.category === 'timing');

    for (const metric of timingMetrics) {
      const name = metric.name.replace('timing.', '');
      if (!timings[name]) {
        timings[name] = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: -Infinity,
          recentSamples: []
        };
      }

      timings[name].count++;
      timings[name].totalTime += metric.value;
      timings[name].minTime = Math.min(timings[name].minTime, metric.value);
      timings[name].maxTime = Math.max(timings[name].maxTime, metric.value);
      timings[name].recentSamples.push(metric.value);

      // Keep only recent samples
      if (timings[name].recentSamples.length > 100) {
        timings[name].recentSamples = timings[name].recentSamples.slice(-50);
      }
    }

    // Calculate averages
    for (const timing of Object.values(timings)) {
      (timing as any).averageTime = (timing as any).totalTime / (timing as any).count;
    }

    // Get memory info
    const memory: any = {};
    if ('memory' in performance) {
      const perfMemory = (performance as any).memory;
      memory.usedJSHeapSize = perfMemory.usedJSHeapSize;
      memory.totalJSHeapSize = perfMemory.totalJSHeapSize;
      memory.jsHeapSizeLimit = perfMemory.jsHeapSizeLimit;
    }

    // Get operation counts
    const operations: Record<string, number> = {};
    const errors: Record<string, number> = {};

    for (const [name, count] of this.counters) {
      if (name.includes('.error')) {
        errors[name] = count;
      } else {
        operations[name] = count;
      }
    }

    return {
      timings,
      memory,
      operations,
      errors,
      timestamp: now
    };
  }

  /**
   * Get metrics by category and time range
   */
  getMetrics(
    category?: 'timing' | 'memory' | 'count' | 'size',
    timeRangeMs = 300000 // Default 5 minutes
  ): PerformanceMetric[] {
    const now = Date.now();
    let filtered = this.metrics.filter(m => now - m.timestamp <= timeRangeMs);

    if (category) {
      filtered = filtered.filter(m => m.category === category);
    }

    return filtered;
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanMs = 3600000): void { // Default 1 hour
    const cutoffTime = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, any> {
    const report = this.generateReport();
    const uptime = Date.now() - this.startTime;

    return {
      uptime,
      totalMetrics: this.metrics.length,
      activeTimings: this.timings.size,
      counters: this.counters.size,
      memoryUsage: report.memory,
      operationCounts: Object.keys(report.operations).length,
      errorCounts: Object.keys(report.errors).length,
      averageResponseTimes: Object.fromEntries(
        Object.entries(report.timings).map(([name, data]) => [
          name,
          Math.round((data as any).averageTime * 100) / 100
        ])
      )
    };
  }

  /**
   * Clear all metrics and counters
   */
  reset(): void {
    this.metrics = [];
    this.timings.clear();
    this.counters.clear();
    this.startTime = Date.now();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring method execution time
 */
export function measurePerformance(name?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function(...args: any[]) {
      return performanceMonitor.measure(metricName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Decorator for measuring async method execution time
 */
export function measureAsyncPerformance(name?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function(...args: any[]) {
      return performanceMonitor.measureAsync(metricName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
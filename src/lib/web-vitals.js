import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

/**
 * Initialize Web Vitals monitoring
 * Sends metrics to /api/vitals endpoint using sendBeacon
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Send metric to analytics endpoint
  function sendToAnalytics(metric) {
    const body = JSON.stringify({
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      page: window.location.pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : undefined
    });

    // Use sendBeacon for reliability (non-blocking, works on page unload)
    const url = '/api/vitals';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      // Fallback to fetch with keepalive
      fetch(url, { 
        method: 'POST', 
        body, 
        keepalive: true,
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    }
  }

  // Monitor all Core Web Vitals (INP replaces FID in newer API)
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics); // Interaction to Next Paint (replaces FID)
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  // Additional: Monitor long tasks (if available)
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Report long tasks > 50ms
            sendToAnalytics({
              name: 'LongTask',
              value: Math.round(entry.duration),
              rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
              id: 'lt-' + Date.now()
            });
          }
        });
      }).observe({ type: 'longtask', buffered: true });
    } catch (e) {
      // Long task API not supported
    }
  }

  // Monitor resource loading performance
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          // Report slow resources (> 3s)
          if (entry.duration > 3000 && entry.initiatorType !== 'navigation') {
            sendToAnalytics({
              name: 'SlowResource',
              value: Math.round(entry.duration),
              rating: 'poor',
              id: 'sr-' + Date.now(),
              resourceType: entry.initiatorType,
              resourceName: entry.name
            });
          }
        });
      }).observe({ type: 'resource', buffered: true });
    } catch (e) {
      // Resource timing not supported
    }
  }

  console.log('[Web Vitals] Monitoring initialized (CLS, INP, FCP, LCP, TTFB)');
}

export default initWebVitals;
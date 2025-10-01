import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';

interface WebContainerContextType {
  webcontainer: WebContainer | null;
  isBooting: boolean;
  bootError: Error | null;
}

const WebContainerContext = createContext<WebContainerContextType>({
  webcontainer: null,
  isBooting: true,
  bootError: null,
});

/**
 * Custom hook to access WebContainer instance
 * @returns WebContainer context with instance, boot status, and errors
 */
export const useWebContainerInstance = () => useContext(WebContainerContext);

interface WebContainerProviderProps {
  children: React.ReactNode;
}

// Global flag to prevent any WebContainer.boot() calls after first boot
// This persists across HMR and React StrictMode double-mounting
declare global {
  interface Window {
    __WEBCONTAINER_INSTANCE__?: WebContainer;
    __WEBCONTAINER_BOOT_PROMISE__?: Promise<WebContainer>;
    __WEBCONTAINER_BOOTING__?: boolean;
  }
}

/**
 * Singleton manager for WebContainer instance
 * Ensures EXACTLY ONE instance per browser tab, even with:
 * - React StrictMode double-mounting
 * - Vite HMR (Hot Module Replacement)
 * - Multiple provider instances
 */
class WebContainerSingleton {
  /**
   * Get or boot the WebContainer instance (singleton pattern)
   * Thread-safe: multiple concurrent calls will wait for the same boot
   */
  static async getInstance(): Promise<WebContainer> {
    const timestamp = Date.now();
    console.log(`[${timestamp}] 📋 getInstance() called. Global state:`, {
      hasGlobalInstance: !!window.__WEBCONTAINER_INSTANCE__,
      hasBootPromise: !!window.__WEBCONTAINER_BOOT_PROMISE__,
      isBooting: !!window.__WEBCONTAINER_BOOTING__
    });

    // If already booted globally, return existing instance
    if (window.__WEBCONTAINER_INSTANCE__) {
      console.log(`[${timestamp}] ✅ Returning existing global instance`);
      return window.__WEBCONTAINER_INSTANCE__;
    }

    // If boot in progress globally, wait for it
    if (window.__WEBCONTAINER_BOOT_PROMISE__) {
      console.log(`[${timestamp}] ⏳ Global boot in progress, waiting...`);
      return window.__WEBCONTAINER_BOOT_PROMISE__;
    }

    // If already booting (race condition guard), wait a bit and retry
    if (window.__WEBCONTAINER_BOOTING__) {
      console.log(`[${timestamp}] 🔒 Boot flag set, waiting 100ms...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getInstance(); // Retry
    }

    // Start boot process
    window.__WEBCONTAINER_BOOTING__ = true;
    console.log(`[${timestamp}] 🚀 Starting WebContainer boot (GLOBAL)...`);

    window.__WEBCONTAINER_BOOT_PROMISE__ = (async () => {
      try {
        const instance = await WebContainer.boot();
        window.__WEBCONTAINER_INSTANCE__ = instance;
        window.__WEBCONTAINER_BOOTING__ = false;
        console.log(`[${timestamp}] ✅ WebContainer booted successfully (GLOBAL)!`);
        return instance;
      } catch (error) {
        window.__WEBCONTAINER_BOOTING__ = false;
        window.__WEBCONTAINER_BOOT_PROMISE__ = undefined;
        console.error(`[${timestamp}] ❌ Failed to boot WebContainer (GLOBAL):`, error);
        throw error;
      }
    })();

    return window.__WEBCONTAINER_BOOT_PROMISE__;
  }

  /**
   * Reset the singleton (useful for testing or manual retry)
   * DANGEROUS: Only use if you know what you're doing
   */
  static reset(): void {
    console.warn('🔄 Resetting WebContainer singleton (GLOBAL)');
    window.__WEBCONTAINER_INSTANCE__ = undefined;
    window.__WEBCONTAINER_BOOT_PROMISE__ = undefined;
    window.__WEBCONTAINER_BOOTING__ = false;
  }
}

/**
 * WebContainerProvider - Boots and provides WebContainer instance to the app
 *
 * Uses singleton pattern to ensure only ONE instance per page.
 * Handles React StrictMode double-mounting gracefully.
 *
 * @example
 * <WebContainerProvider>
 *   <App />
 * </WebContainerProvider>
 */
export const WebContainerProvider: React.FC<WebContainerProviderProps> = ({ children }) => {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [bootError, setBootError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const componentId = Math.random().toString(36).substring(7);
    console.log(`[Provider ${componentId}] 🔄 Component mounted, starting boot process`);

    async function bootContainer() {
      try {
        console.log(`[Provider ${componentId}] 📞 Calling WebContainerSingleton.getInstance()`);
        const instance = await WebContainerSingleton.getInstance();

        if (mounted) {
          console.log(`[Provider ${componentId}] ✅ Got instance, updating state`);
          setWebcontainer(instance);
          setIsBooting(false);
        } else {
          console.log(`[Provider ${componentId}] ⚠️ Component unmounted, skipping state update`);
        }
      } catch (error) {
        console.error(`[Provider ${componentId}] ❌ Boot error:`, error);
        if (mounted) {
          setBootError(error as Error);
          setIsBooting(false);
        }
      }
    }

    bootContainer();

    return () => {
      mounted = false;
      console.log(`[Provider ${componentId}] 🗑️ Component unmounted`);
      // Note: WebContainer singleton persists for page lifetime
    };
  }, []); // Empty deps - only boot once per provider lifecycle

  return (
    <WebContainerContext.Provider value={{ webcontainer, isBooting, bootError }}>
      {children}
    </WebContainerContext.Provider>
  );
};

/**
 * Zama FHE SDK Initialization and Instance Management
 * 
 * This module initializes the Zama Relayer SDK and provides a singleton instance
 * for encryption/decryption operations.
 * 
 * Uses CDN import for better Vite compatibility.
 */

// Import lodash to ensure it's available globally for SDK
import lodashDefault from 'lodash';
import map from 'lodash/map';

const lodashGlobal: any =
  (typeof lodashDefault !== 'undefined' ? lodashDefault : {}) || {};

console.log('🔍 [ZAMA SDK] lodashDefault typeof:', typeof lodashDefault);
console.log('🔍 [ZAMA SDK] lodashDefault has map:', typeof (lodashDefault as any)?.map);

// Ensure lodashGlobal is an object (some bundlers expose lodash as function)
const lodashAsAny: any = lodashGlobal;

// Attach map function from various sources
if (typeof lodashAsAny.map !== 'function' && typeof map === 'function') {
  lodashAsAny.map = map;
}

if (typeof lodashAsAny.map !== 'function' && typeof (lodashDefault as any)?.map === 'function') {
  lodashAsAny.map = (lodashDefault as any).map;
}

// Final fallback: implement minimal map shim
if (typeof lodashAsAny.map !== 'function') {
  console.warn('⚠️ [ZAMA SDK] Lodash map function not found, installing shim.');
  lodashAsAny.map = (collection: any, iteratee: (value: any, index: number) => any) => {
    const arr = Array.isArray(collection)
      ? collection
      : (collection && typeof collection === 'object')
        ? Object.values(collection)
        : [];
    if (typeof iteratee !== 'function') {
      return arr;
    }
    return arr.map((value, index) => iteratee(value, index));
  };
}

// Make lodash available globally for SDK
if (typeof window !== 'undefined') {
  (window as any)._ = lodashGlobal;
  console.log('✅ [ZAMA SDK] Lodash imported and set globally:', typeof (window as any)._ !== 'undefined');
  console.log('✅ [ZAMA SDK] Lodash map typeof:', typeof (window as any)._?.map);
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any)._ = lodashGlobal;
}

// Use global window object for CDN-loaded SDK
// The CDN script exposes the SDK in different ways depending on the build
declare global {
  interface Window {
    // ✅ Actual location: lowercase 'relayerSDK'
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: any) => Promise<any>;
      SepoliaConfig: any;
    };
    // Uppercase version (for compatibility)
    RelayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: any) => Promise<any>;
      SepoliaConfig: any;
    };
    // Alternative: SDK might be exposed directly
    initSDK?: () => Promise<void>;
    createInstance?: (config: any) => Promise<any>;
    SepoliaConfig?: any;
  }
  
  // UMD module might expose it this way
  const RelayerSDK: any;
  const relayerSDK: any;
}

type Instance = any; // SDK instance type (will be set dynamically)

let sdkInitialized = false;
let sdkInstance: Instance | null = null;
let initPromise: Promise<Instance> | null = null;

/**
 * Get SDK from global scope (CDN-loaded)
 * Logs all available globals for debugging
 */
function getSDK(): { initSDK: () => Promise<void>; createInstance: (config: any) => Promise<any>; SepoliaConfig: any } {
  if (typeof window === 'undefined') {
    throw new Error('SDK can only be loaded in browser environment');
  }

  // Debug: Log all possible SDK locations (only once)
  if (!(window as any).__zama_sdk_debug_done) {
    console.log('🔍 [ZAMA SDK] Checking for SDK in global scope...');
    console.log('🔍 [ZAMA SDK] window.RelayerSDK:', window.RelayerSDK);
    console.log('🔍 [ZAMA SDK] window.RelayerSDKJS:', (window as any).RelayerSDKJS);
    console.log('🔍 [ZAMA SDK] window.initSDK:', typeof window.initSDK);
    console.log('🔍 [ZAMA SDK] RelayerSDK (global):', typeof (globalThis as any).RelayerSDK);
    
    // List relevant window keys
    const relevantKeys = Object.keys(window).filter(k => 
      k.toLowerCase().includes('relayer') || 
      k.toLowerCase().includes('zama') || 
      k.toLowerCase().includes('fhe')
    );
    console.log('🔍 [ZAMA SDK] Relevant window keys:', relevantKeys);
    (window as any).__zama_sdk_debug_done = true;
  }

  // Try different ways the SDK might be exposed
  // ✅ FOUND: window.relayerSDK (lowercase 'r') - this is the actual location!
  if ((window as any).relayerSDK) {
    console.log('✅ [ZAMA SDK] Found SDK at window.relayerSDK');
    return (window as any).relayerSDK;
  }
  
  // Check uppercase version (for compatibility)
  if (window.RelayerSDK) {
    console.log('✅ [ZAMA SDK] Found SDK at window.RelayerSDK');
    return window.RelayerSDK;
  }
  
  // Check RelayerSDKJS (common UMD name)
  if ((window as any).RelayerSDKJS) {
    console.log('✅ [ZAMA SDK] Found SDK at window.RelayerSDKJS');
    return (window as any).RelayerSDKJS;
  }
  
  // Check if exposed directly on window
  if (window.initSDK && window.createInstance && window.SepoliaConfig) {
    console.log('✅ [ZAMA SDK] Found SDK methods directly on window');
    return {
      initSDK: window.initSDK,
      createInstance: window.createInstance,
      SepoliaConfig: window.SepoliaConfig,
    };
  }

  // Check UMD global (non-window scope)
  if (typeof (globalThis as any).RelayerSDK !== 'undefined') {
    console.log('✅ [ZAMA SDK] Found SDK at globalThis.RelayerSDK');
    return (globalThis as any).RelayerSDK;
  }
  
  // Check lowercase global
  if (typeof (globalThis as any).relayerSDK !== 'undefined') {
    console.log('✅ [ZAMA SDK] Found SDK at globalThis.relayerSDK');
    return (globalThis as any).relayerSDK;
  }

  throw new Error('Zama Relayer SDK not found. Check Network tab for CDN script loading errors.');
}

/**
 * Wait for SDK to be loaded from CDN
 */
async function waitForSDK(): Promise<void> {
  // First, check if script tag exists
  const scriptTag = document.querySelector('script[src*="relayer-sdk"]');
  if (!scriptTag) {
    throw new Error('Zama SDK script tag not found in HTML. Check index.html.');
  }

  // Wait for script to finish loading (check onload attribute)
  let checkCount = 0;
  const maxChecks = 100; // 10 seconds total
  while (!scriptTag.hasAttribute('data-loaded') && checkCount < maxChecks) {
    await new Promise(resolve => setTimeout(resolve, 100));
    checkCount++;
  }

  if (!scriptTag.hasAttribute('data-loaded')) {
    console.warn('⚠️ SDK script tag found but onload not fired. Checking if SDK is available anyway...');
  }

  // Wait for SDK to be available (max 10 seconds)
  const maxWait = 10000;
  const startTime = Date.now();
  
  while (true) {
    try {
      getSDK();
      return; // SDK is loaded
    } catch (e: any) {
      if (Date.now() - startTime > maxWait) {
        console.error('❌ [ZAMA SDK] Timeout waiting for SDK. Error:', e.message);
        console.error('💡 [ZAMA SDK] Troubleshooting:');
        console.error('   1. Check Network tab for CDN script loading errors');
        console.error('   2. Verify CDN URL is accessible: https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs');
        console.error('   3. Check browser console for script errors');
        throw new Error(`Zama Relayer SDK failed to load from CDN: ${e.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Initialize Zama SDK (loads WASM modules)
 * Must be called before creating instances
 * 
 * Note: If SDK fails to load, the app will continue with fallback mock encryption.
 * This allows the app to work while debugging SDK integration.
 */
export async function initializeZamaSDK(): Promise<void> {
  if (sdkInitialized) {
    return;
  }

  try {
    // CRITICAL: Ensure lodash is loaded BEFORE SDK initialization
    if (typeof window !== 'undefined' && typeof (window as any)._ === 'undefined') {
      console.error('❌ [ZAMA SDK] Lodash not found! SDK requires lodash to be loaded first.');
      console.error('❌ [ZAMA SDK] Please ensure lodash script is loaded before SDK script in index.html');
      throw new Error('Lodash is required but not found. Load lodash before SDK.');
    }
    
    console.log('✅ [ZAMA SDK] Lodash verified:', typeof (window as any)._ !== 'undefined');
    
    console.log('🔐 [ZAMA SDK] Waiting for SDK to load from CDN...');
    await waitForSDK();
    
    console.log('🔐 [ZAMA SDK] Initializing Zama Relayer SDK...');
    const sdk = getSDK();
    await sdk.initSDK();
    sdkInitialized = true;
    console.log('✅ [ZAMA SDK] SDK initialized successfully');
  } catch (error: any) {
    console.error('❌ [ZAMA SDK] Initialization failed:', error);
    console.warn('⚠️ [ZAMA SDK] App will continue with fallback mock encryption.');
    console.warn('⚠️ [ZAMA SDK] For Zama compliance, fix SDK loading (check CDN URL and network).');
    // Don't throw - allow app to continue with fallback
    // throw new Error(`Failed to initialize Zama SDK: ${error}`);
  }
}

/**
 * Get or create Zama SDK instance
 * Automatically initializes SDK if not already done
 */
export async function getZamaInstance(): Promise<Instance> {
  // If instance already exists, return it
  if (sdkInstance) {
    return sdkInstance;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    // Initialize SDK first
    await initializeZamaSDK();

    // Check if we have window.ethereum (Web3 provider)
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('window.ethereum not found. Please connect a wallet first.');
    }

    try {
      console.log('🔐 [ZAMA SDK] Creating instance with Sepolia config...');
      
      // Ensure SDK is loaded
      await waitForSDK();
      const sdk = getSDK();
      
      // Create instance with Sepolia configuration
      const config = {
        ...sdk.SepoliaConfig,
        network: window.ethereum,
      };

      const instance = await sdk.createInstance(config);
      sdkInstance = instance;
      
      console.log('✅ [ZAMA SDK] Instance created successfully');
      return instance;
    } catch (error) {
      console.error('❌ [ZAMA SDK] Failed to create instance:', error);
      throw new Error(`Failed to create Zama SDK instance: ${error}`);
    }
  })();

  return initPromise;
}

/**
 * Reset SDK instance (useful for testing or reconnection)
 */
export function resetZamaInstance(): void {
  sdkInstance = null;
  initPromise = null;
  sdkInitialized = false;
}


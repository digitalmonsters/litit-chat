/**
 * PWA Install Prompt Handler
 * 
 * Manages the "Add to Home Screen" prompt for PWA installation
 */

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Setup install prompt listener
 */
export function setupInstallPrompt(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the default mini-infobar
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('✅ PWA install prompt available');
    
    // Dispatch custom event for UI to show install button
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('⚠️ Install prompt not available');
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    console.log('✅ User accepted PWA install');
    
    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted PWA install');
      deferredPrompt = null;
      return true;
    } else {
      console.log('❌ User dismissed PWA install');
      return false;
    }
  } catch (error) {
    console.error('Error showing install prompt:', error);
    return false;
  }
}

/**
 * Check if PWA is installable
 */
export function isInstallable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Check if PWA is already installed
 */
export function isInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check if navigator.standalone is true (iOS)
  if ((window.navigator as { standalone?: boolean }).standalone === true) {
    return true;
  }

  return false;
}

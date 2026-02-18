// Configuration for WebSocket connection
// This file allows easy switching between development and production environments

const CONFIG = {
  // WebSocket URL Configuration
  WS_URL: (() => {
    // Check if running in production (Vercel)
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname !== 'localhost') {
      // Production: Use environment variable or default production URL
      // UPDATE THIS with your actual WebSocket server URL after deployment
      return window.ENV?.WS_URL || 'wss://your-websocket-server.railway.app';
    }
    // Development: Use local WebSocket server
    return `ws://${window.location.hostname}:3000`;
  })(),
  
  // Get WebSocket URL with protocol upgrade
  getWsUrl() {
    return this.WS_URL;
  }
};

// Make CONFIG globally available
window.ALIBI_CONFIG = CONFIG;

console.log('🔧 Alibi Config loaded. WebSocket URL:', CONFIG.WS_URL);

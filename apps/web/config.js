// Configuration for WebSocket connection
// This file allows easy switching between development and production environments

const CONFIG = {
  // WebSocket URL Configuration
  WS_URL: (() => {
    // Check if running in production (deployed on Vercel or similar)
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      // Production: Use your deployed WebSocket server URL
      // ⚠️ IMPORTANT: Update this URL after deploying your WebSocket server
      // Example: 'wss://alibi-server.railway.app'
      // Example: 'wss://alibi-server.onrender.com'
      
      const productionWsUrl = 'wss://YOUR-WEBSOCKET-SERVER-URL-HERE.railway.app';
      
      // Check if the URL has been updated from default
      if (productionWsUrl.includes('YOUR-WEBSOCKET-SERVER-URL-HERE')) {
        console.warn('⚠️ WebSocket URL not configured! Please update config.js with your server URL');
        console.warn('Falling back to same host...');
        // Fallback: try to connect to websocket on same domain
        return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
      }
      
      return productionWsUrl;
    }
    
    // Development: Use local WebSocket server
    return `ws://${window.location.hostname}:3000`;
  })(),
  
  // Get WebSocket URL
  getWsUrl() {
    return this.WS_URL;
  }
};

// Make CONFIG globally available
window.ALIBI_CONFIG = CONFIG;

console.log('🔧 Alibi Config loaded');
console.log('📡 WebSocket URL:', CONFIG.WS_URL);

// Warn if in production but URL not set
if (CONFIG.WS_URL.includes('YOUR-WEBSOCKET-SERVER-URL-HERE')) {
  console.error('❌ Production WebSocket URL not configured!');
  console.error('Please update apps/web/config.js with your actual WebSocket server URL');
}

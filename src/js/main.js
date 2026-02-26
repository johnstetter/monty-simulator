/**
 * Main Application for Monty Hall Simulator
 * Initializes and coordinates game, statistics, and UI components
 */

import { MontyHallGame } from './game.js';
import { GameStats } from './stats.js';
import { MontyHallUI } from './ui.js';
import { BatchSimulator } from './simulator.js';
import { StatisticalAnalyzer } from './statistics.js';
import { SimulationCharts } from './charts.js';

/**
 * Main Application Class
 */
class MontyHallApp {
  constructor() {
    this.game = null;
    this.stats = null;
    this.ui = null;
    this.batchSimulator = null;
    this.statisticalAnalyzer = null;
    this.simulationCharts = null;
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize core components
      this.game = new MontyHallGame();
      this.stats = new GameStats();
      this.batchSimulator = new BatchSimulator();
      this.statisticalAnalyzer = new StatisticalAnalyzer();
      this.simulationCharts = new SimulationCharts();

      // Wait for DOM to be ready
      await this.waitForDOM();

      // Initialize UI (this will handle all DOM interactions)
      this.ui = new MontyHallUI(this.game, this.stats, this.batchSimulator, this.statisticalAnalyzer, this.simulationCharts);

      // Set up global error handling
      this.setupErrorHandling();

      // Set up visibility change handling (for pausing animations)
      this.setupVisibilityHandling();

      this.initialized = true;

      console.log('Monty Hall Simulator initialized successfully!');

      // Show welcome message for first-time users
      this.showWelcomeMessage();

    } catch (error) {
      console.error('Failed to initialize Monty Hall Simulator:', error);
      this.showErrorMessage('Failed to initialize the simulator. Please refresh the page.');
    }
  }

  /**
   * Wait for DOM to be ready
   */
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Set up global error handling
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showErrorMessage('An unexpected error occurred. The simulator may not work correctly.');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showErrorMessage('A promise was rejected. Some features may not work correctly.');
    });
  }

  /**
   * Set up page visibility handling
   */
  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (this.ui) {
        // Reset any ongoing animations when page becomes hidden
        if (document.hidden) {
          this.ui.isAnimating = false;
        }
      }
    });
  }

  /**
   * Show welcome message for new users
   */
  showWelcomeMessage() {
    const stats = this.stats.getStats();

    if (stats.totalGames === 0) {
      // First time user
      setTimeout(() => {
        this.showInfoModal(
          'Welcome to the Monty Hall Problem!',
          `
            <p>This classic probability puzzle demonstrates counterintuitive mathematics.</p>
            <p><strong>How it works:</strong></p>
            <ul>
              <li>Choose one of three doors (one has a car, two have goats)</li>
              <li>The host opens a door with a goat</li>
              <li>Decide: stay with your choice or switch doors</li>
            </ul>
            <p>Try both strategies and see which works better!</p>
            <p><em>Keyboard shortcuts: 1-3 to select doors, S to stay, W to switch, R to reset</em></p>
          `
        );
      }, 1000);
    }
  }

  /**
   * Show informational modal
   */
  showInfoModal(title, content) {
    // Check if modal already exists
    let modal = document.getElementById('info-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'info-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="info-modal-title"></h3>
            <button class="modal-close" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body" id="info-modal-content"></div>
        </div>
      `;
      document.body.appendChild(modal);

      // Add close functionality
      const closeBtn = modal.querySelector('.modal-close');
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
          modal.style.display = 'none';
        }
      });
    }

    // Update content
    document.getElementById('info-modal-title').textContent = title;
    document.getElementById('info-modal-content').innerHTML = content;

    // Show modal
    modal.style.display = 'flex';
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    // Create or update error element
    let errorEl = document.getElementById('error-message');

    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'error-message';
      errorEl.className = 'error-message';
      document.body.appendChild(errorEl);
    }

    errorEl.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
        <button class="error-close">&times;</button>
      </div>
    `;

    errorEl.style.display = 'block';

    // Add close functionality
    const closeBtn = errorEl.querySelector('.error-close');
    closeBtn.addEventListener('click', () => {
      errorEl.style.display = 'none';
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorEl.style.display !== 'none') {
        errorEl.style.display = 'none';
      }
    }, 5000);
  }

  /**
   * Reset the entire application
   */
  reset() {
    if (this.game) {
      this.game.reset();
    }
    if (this.ui) {
      this.ui.updateDisplay();
    }
  }

  /**
   * Get application status for debugging
   */
  getStatus() {
    return {
      initialized: this.initialized,
      gamePhase: this.game ? this.game.gamePhase : null,
      totalGames: this.stats ? this.stats.getStats().totalGames : 0,
      version: '1.0.0'
    };
  }

  /**
   * Export application data (for debugging or sharing)
   */
  exportData() {
    if (!this.stats) return null;

    return {
      stats: this.stats.getStats(),
      exported: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

// Global application instance
let app = null;

/**
 * Initialize the application when page loads
 */
async function initializeApp() {
  try {
    app = new MontyHallApp();
    await app.init();

    // Make app globally available for debugging
    if (typeof window !== 'undefined') {
      window.montyHallApp = app;
    }

  } catch (error) {
    console.error('Failed to start Monty Hall Simulator:', error);

    // Show fallback error message
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        padding: 20px;
        background: #f0f0f0;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          max-width: 500px;
        ">
          <h1 style="color: #d32f2f; margin-bottom: 20px;">⚠️ Initialization Error</h1>
          <p style="margin-bottom: 20px;">
            The Monty Hall Simulator failed to initialize properly.
          </p>
          <button onclick="location.reload()" style="
            background: #1976d2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for potential module usage
export { MontyHallApp, initializeApp };
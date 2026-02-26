/**
 * Statistics Tracking for Monty Hall Simulator
 * Tracks win/loss rates for stay vs switch strategies using localStorage
 */

export class GameStats {
  constructor() {
    this.storageKey = 'montyHallStats';
    this.loadStats();
  }

  /**
   * Load statistics from localStorage
   */
  loadStats() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.stats = JSON.parse(stored);
      } else {
        this.resetStats();
      }
    } catch (error) {
      console.warn('Failed to load stats from localStorage:', error);
      this.resetStats();
    }

    // Ensure all required properties exist (for backwards compatibility)
    this.validateStats();
  }

  /**
   * Validate and fix stats object structure
   */
  validateStats() {
    const defaultStats = this.getDefaultStats();

    // Check if stats object has all required properties
    for (const key in defaultStats) {
      if (!this.stats.hasOwnProperty(key)) {
        this.stats[key] = defaultStats[key];
      }
    }

    // Ensure nested objects exist
    if (!this.stats.stay || typeof this.stats.stay !== 'object') {
      this.stats.stay = defaultStats.stay;
    }
    if (!this.stats.switch || typeof this.stats.switch !== 'object') {
      this.stats.switch = defaultStats.switch;
    }
  }

  /**
   * Get default stats structure
   */
  getDefaultStats() {
    return {
      totalGames: 0,
      stay: {
        played: 0,
        won: 0,
        winRate: 0
      },
      switch: {
        played: 0,
        won: 0,
        winRate: 0
      },
      lastPlayed: null,
      created: new Date().toISOString()
    };
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.stats = this.getDefaultStats();
    this.saveStats();
  }

  /**
   * Save statistics to localStorage
   */
  saveStats() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save stats to localStorage:', error);
    }
  }

  /**
   * Record a game result
   * @param {string} strategy - 'stay' or 'switch'
   * @param {boolean} won - true if player won, false if lost
   */
  recordGame(strategy, won) {
    if (!['stay', 'switch'].includes(strategy)) {
      console.error('Invalid strategy:', strategy);
      return;
    }

    // Update strategy-specific stats
    this.stats[strategy].played++;
    if (won) {
      this.stats[strategy].won++;
    }

    // Calculate win rate
    this.stats[strategy].winRate = this.stats[strategy].won / this.stats[strategy].played;

    // Update total games
    this.stats.totalGames++;
    this.stats.lastPlayed = new Date().toISOString();

    // Save to localStorage
    this.saveStats();
  }

  /**
   * Get current statistics
   * @returns {object} Current stats object
   */
  getStats() {
    return {
      ...this.stats,
      // Add computed fields
      gamesWithStay: this.stats.stay.played,
      gamesWithSwitch: this.stats.switch.played,
      overallWinRate: this.stats.totalGames > 0 ?
        (this.stats.stay.won + this.stats.switch.won) / this.stats.totalGames : 0
    };
  }

  /**
   * Get formatted statistics for display
   * @returns {object} Formatted stats ready for UI
   */
  getFormattedStats() {
    const stats = this.getStats();

    return {
      totalGames: stats.totalGames,
      stay: {
        played: stats.stay.played,
        won: stats.stay.won,
        lost: stats.stay.played - stats.stay.won,
        winRate: (stats.stay.winRate * 100).toFixed(1) + '%',
        winRateNumber: stats.stay.winRate
      },
      switch: {
        played: stats.switch.played,
        won: stats.switch.won,
        lost: stats.switch.played - stats.switch.won,
        winRate: (stats.switch.winRate * 100).toFixed(1) + '%',
        winRateNumber: stats.switch.winRate
      },
      overall: {
        winRate: (stats.overallWinRate * 100).toFixed(1) + '%',
        winRateNumber: stats.overallWinRate
      },
      lastPlayed: stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleString() : null,
      created: stats.created ? new Date(stats.created).toLocaleDateString() : null
    };
  }

  /**
   * Get strategy comparison for educational purposes
   * @returns {object} Comparison data showing which strategy is better
   */
  getStrategyComparison() {
    const stats = this.getStats();

    if (stats.stay.played === 0 && stats.switch.played === 0) {
      return {
        hasData: false,
        message: 'Play some games to see statistics!'
      };
    }

    const stayRate = stats.stay.winRate;
    const switchRate = stats.switch.winRate;

    let comparison = {
      hasData: true,
      stayWinRate: (stayRate * 100).toFixed(1),
      switchWinRate: (switchRate * 100).toFixed(1),
      better: null,
      difference: null,
      confidence: 'low'
    };

    if (stats.stay.played > 0 && stats.switch.played > 0) {
      if (switchRate > stayRate) {
        comparison.better = 'switch';
        comparison.difference = ((switchRate - stayRate) * 100).toFixed(1);
      } else if (stayRate > switchRate) {
        comparison.better = 'stay';
        comparison.difference = ((stayRate - switchRate) * 100).toFixed(1);
      } else {
        comparison.better = 'tie';
        comparison.difference = '0.0';
      }

      // Determine confidence level based on sample size
      const totalRelevantGames = Math.min(stats.stay.played, stats.switch.played);
      if (totalRelevantGames >= 50) {
        comparison.confidence = 'high';
      } else if (totalRelevantGames >= 20) {
        comparison.confidence = 'medium';
      }
    }

    return comparison;
  }

  /**
   * Export stats for sharing or backup
   * @returns {string} JSON string of stats
   */
  exportStats() {
    return JSON.stringify(this.stats, null, 2);
  }

  /**
   * Import stats from JSON string
   * @param {string} jsonString - Exported stats JSON
   * @returns {boolean} True if import successful
   */
  importStats(jsonString) {
    try {
      const imported = JSON.parse(jsonString);

      // Basic validation
      if (!imported.totalGames && imported.totalGames !== 0) {
        throw new Error('Invalid stats format');
      }

      this.stats = imported;
      this.validateStats();
      this.saveStats();
      return true;
    } catch (error) {
      console.error('Failed to import stats:', error);
      return false;
    }
  }

  /**
   * Check if user should be shown educational hints
   * @returns {object} Hints based on current statistics
   */
  getEducationalHints() {
    const stats = this.getStats();
    const hints = [];

    // First game hint
    if (stats.totalGames === 0) {
      hints.push({
        type: 'welcome',
        title: 'Welcome to the Monty Hall Problem!',
        message: 'Try both staying and switching to see which strategy works better.'
      });
    }

    // Early games hint (1-5 games)
    if (stats.totalGames > 0 && stats.totalGames <= 5) {
      hints.push({
        type: 'early',
        title: 'Keep Playing!',
        message: 'Play more games to see the probability patterns emerge.'
      });
    }

    // Strategy imbalance hint
    if (stats.totalGames >= 10) {
      const stayPlayed = stats.stay.played;
      const switchPlayed = stats.switch.played;
      const imbalance = Math.abs(stayPlayed - switchPlayed);

      if (imbalance >= 10) {
        const lessUsed = stayPlayed < switchPlayed ? 'staying' : 'switching';
        hints.push({
          type: 'balance',
          title: 'Try Both Strategies',
          message: `You've been ${lessUsed === 'staying' ? 'switching' : 'staying'} a lot. Try ${lessUsed} more to see the difference!`
        });
      }
    }

    // Theoretical vs actual hint
    if (stats.switch.played >= 20 && Math.abs(stats.switch.winRate - 0.667) > 0.1) {
      hints.push({
        type: 'theory',
        title: 'Probability Theory',
        message: 'The switching strategy should win about 66.7% of the time in the long run.'
      });
    }

    return hints;
  }
}
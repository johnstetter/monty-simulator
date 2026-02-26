/**
 * Batch Simulation Engine for Monty Hall Problem
 * Runs large numbers of games automatically and provides statistical analysis
 */

import { MontyHallGame } from './game.js';

export class BatchSimulator {
  constructor() {
    this.isRunning = false;
    this.currentSimulation = null;
    this.results = [];
    this.progressCallback = null;
    this.completionCallback = null;
  }

  /**
   * Run a batch simulation with specified parameters
   * @param {Object} options - Simulation configuration
   * @param {number} options.totalGames - Total number of games to simulate
   * @param {Array<string>} options.strategies - ['stay', 'switch'] or ['stay'] or ['switch']
   * @param {string} options.speed - 'slow', 'normal', 'fast' (for educational demonstration)
   * @param {Function} options.onProgress - Progress callback function
   * @param {Function} options.onComplete - Completion callback function
   * @returns {Object} - Simulation results or promise for async execution
   */
  async runSimulation(options = {}) {
    const {
      totalGames = 1000,
      strategies = ['stay', 'switch'],
      speed = 'fast',
      onProgress = null,
      onComplete = null,
      chunkSize = 100
    } = options;

    if (this.isRunning) {
      throw new Error('Simulation already running. Stop current simulation first.');
    }

    this.isRunning = true;
    this.progressCallback = onProgress;
    this.completionCallback = onComplete;

    const results = {
      totalGames,
      strategies,
      startTime: Date.now(),
      endTime: null,
      data: {
        stay: { played: 0, won: 0, games: [] },
        switch: { played: 0, won: 0, games: [] }
      },
      convergence: [],
      statistics: null
    };

    try {
      // Run simulations in chunks to prevent UI blocking
      const gamesPerStrategy = Math.floor(totalGames / strategies.length);
      let completedGames = 0;

      for (const strategy of strategies) {
        const strategyResults = await this.runStrategyBatch(
          strategy,
          gamesPerStrategy,
          speed,
          chunkSize,
          (progress) => {
            completedGames += progress.increment;
            const totalProgress = {
              completed: completedGames,
              total: totalGames,
              percentage: (completedGames / totalGames) * 100,
              strategy,
              currentResults: results
            };

            if (onProgress) onProgress(totalProgress);
          }
        );

        // Merge strategy results
        results.data[strategy] = strategyResults;

        // Update convergence data
        this.updateConvergenceData(results, strategy, strategyResults);
      }

      results.endTime = Date.now();
      results.duration = results.endTime - results.startTime;
      results.statistics = this.calculateStatistics(results);

      this.currentSimulation = results;
      this.isRunning = false;

      if (onComplete) onComplete(results);
      return results;

    } catch (error) {
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Run a batch of games for a specific strategy
   * @param {string} strategy - 'stay' or 'switch'
   * @param {number} gameCount - Number of games to run
   * @param {string} speed - Simulation speed
   * @param {number} chunkSize - Games per chunk (for progress updates)
   * @param {Function} onProgress - Progress callback
   * @returns {Object} - Strategy results
   */
  async runStrategyBatch(strategy, gameCount, speed, chunkSize, onProgress) {
    const results = {
      played: 0,
      won: 0,
      games: [],
      winRateHistory: []
    };

    const delayMs = this.getSpeedDelay(speed);

    for (let i = 0; i < gameCount; i += chunkSize) {
      if (!this.isRunning) break; // Allow cancellation

      const currentChunkSize = Math.min(chunkSize, gameCount - i);
      const chunkResults = this.runGameChunk(strategy, currentChunkSize);

      // Merge chunk results
      results.played += chunkResults.length;
      results.won += chunkResults.filter(game => game.won).length;
      results.games.push(...chunkResults);

      // Calculate running win rate
      const currentWinRate = results.won / results.played;
      results.winRateHistory.push({
        gameNumber: results.played,
        winRate: currentWinRate,
        wins: results.won
      });

      // Report progress
      if (onProgress) {
        onProgress({
          increment: chunkResults.length,
          totalForStrategy: results.played,
          winRate: currentWinRate
        });
      }

      // Add delay for visual demonstration (if not fast mode)
      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
    }

    results.winRate = results.won / results.played;
    return results;
  }

  /**
   * Run a chunk of games synchronously
   * @param {string} strategy - 'stay' or 'switch'
   * @param {number} count - Number of games in chunk
   * @returns {Array} - Array of game results
   */
  runGameChunk(strategy, count) {
    const results = [];

    for (let i = 0; i < count; i++) {
      const game = new MontyHallGame();

      // Always select door 0 for consistency
      game.selectDoor(0);

      // Apply strategy
      game.makeChoice(strategy);

      results.push({
        gameNumber: i,
        strategy,
        playerChoice: game.playerChoice,
        hostRevealedDoor: game.hostRevealedDoor,
        finalChoice: game.finalChoice,
        carDoor: game.carDoor,
        won: game.won
      });
    }

    return results;
  }

  /**
   * Update convergence data for visualization
   * @param {Object} results - Main results object
   * @param {string} strategy - Current strategy
   * @param {Object} strategyResults - Results for this strategy
   */
  updateConvergenceData(results, strategy, strategyResults) {
    strategyResults.winRateHistory.forEach(point => {
      const existingPoint = results.convergence.find(p =>
        p.gameNumber === point.gameNumber && p.strategy === strategy
      );

      if (!existingPoint) {
        results.convergence.push({
          gameNumber: point.gameNumber,
          strategy,
          winRate: point.winRate,
          wins: point.wins,
          theoretical: strategy === 'switch' ? 0.667 : 0.333
        });
      }
    });
  }

  /**
   * Calculate comprehensive statistics
   * @param {Object} results - Simulation results
   * @returns {Object} - Statistical analysis
   */
  calculateStatistics(results) {
    const stats = {
      summary: {},
      confidence: {},
      convergence: {},
      theoretical: {
        stay: 1/3,
        switch: 2/3
      }
    };

    // Calculate summary statistics for each strategy
    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      const theoretical = stats.theoretical[strategy];

      stats.summary[strategy] = {
        winRate: data.winRate,
        wins: data.won,
        losses: data.played - data.won,
        total: data.played,
        theoretical: theoretical,
        deviation: Math.abs(data.winRate - theoretical),
        deviationPercent: Math.abs(data.winRate - theoretical) * 100
      };

      // Calculate 95% confidence interval
      const p = data.winRate;
      const n = data.played;
      const standardError = Math.sqrt((p * (1 - p)) / n);
      const marginOfError = 1.96 * standardError; // 95% confidence

      stats.confidence[strategy] = {
        lower: p - marginOfError,
        upper: p + marginOfError,
        marginOfError,
        standardError,
        inTheoreticalRange: theoretical >= (p - marginOfError) && theoretical <= (p + marginOfError)
      };
    }

    // Overall convergence analysis
    stats.convergence = this.analyzeConvergence(results);

    return stats;
  }

  /**
   * Analyze convergence behavior
   * @param {Object} results - Simulation results
   * @returns {Object} - Convergence analysis
   */
  analyzeConvergence(results) {
    const analysis = {};

    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      const theoretical = strategy === 'switch' ? 0.667 : 0.333;

      if (data.winRateHistory.length === 0) continue;

      // Find when convergence stabilizes (within 5% of theoretical for last 10% of games)
      const stabilityThreshold = 0.05;
      const checkLastPercent = 0.1;
      const startCheckFrom = Math.floor(data.winRateHistory.length * (1 - checkLastPercent));

      let isStabilized = false;
      let stabilizationPoint = null;

      if (startCheckFrom > 0) {
        const recentRates = data.winRateHistory.slice(startCheckFrom).map(p => p.winRate);
        const allWithinThreshold = recentRates.every(rate =>
          Math.abs(rate - theoretical) <= stabilityThreshold
        );

        if (allWithinThreshold) {
          isStabilized = true;
          stabilizationPoint = data.winRateHistory[startCheckFrom].gameNumber;
        }
      }

      analysis[strategy] = {
        isStabilized,
        stabilizationPoint,
        finalDeviation: Math.abs(data.winRate - theoretical),
        maxDeviation: Math.max(...data.winRateHistory.map(p => Math.abs(p.winRate - theoretical))),
        convergenceRate: this.calculateConvergenceRate(data.winRateHistory, theoretical)
      };
    }

    return analysis;
  }

  /**
   * Calculate how quickly the win rate converges to theoretical value
   * @param {Array} history - Win rate history
   * @param {number} theoretical - Theoretical probability
   * @returns {number} - Convergence rate metric
   */
  calculateConvergenceRate(history, theoretical) {
    if (history.length < 2) return 0;

    const deviations = history.map(point => Math.abs(point.winRate - theoretical));

    // Calculate how much deviation decreases over time (simple linear regression slope)
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = deviations.length;

    deviations.forEach((deviation, index) => {
      const x = index + 1; // game number
      const y = deviation;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return -slope; // Negative slope means convergence (deviation decreasing)
  }

  /**
   * Get delay in milliseconds based on speed setting
   * @param {string} speed - 'slow', 'normal', 'fast'
   * @returns {number} - Delay in milliseconds
   */
  getSpeedDelay(speed) {
    const delays = {
      slow: 100,    // 100ms between chunks (for educational demonstration)
      normal: 50,   // 50ms between chunks
      fast: 0       // No delay (maximum speed)
    };
    return delays[speed] || 0;
  }

  /**
   * Stop the current simulation
   */
  stopSimulation() {
    this.isRunning = false;
  }

  /**
   * Get current simulation results
   * @returns {Object} - Current results or null
   */
  getCurrentResults() {
    return this.currentSimulation;
  }

  /**
   * Export results to different formats
   * @param {Object} results - Simulation results
   * @param {string} format - 'json', 'csv'
   * @returns {string} - Formatted data
   */
  exportResults(results, format = 'json') {
    if (!results) results = this.currentSimulation;
    if (!results) throw new Error('No simulation results to export');

    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCsv(results);
      case 'json':
        return JSON.stringify(results, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export results to CSV format
   * @param {Object} results - Simulation results
   * @returns {string} - CSV data
   */
  exportToCsv(results) {
    let csv = 'Game,Strategy,PlayerChoice,HostRevealed,FinalChoice,CarDoor,Won,WinRate\n';

    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      data.games.forEach((game, index) => {
        const winRate = data.winRateHistory.find(h => h.gameNumber >= index + 1)?.winRate || 0;
        csv += `${game.gameNumber + 1},${strategy},${game.playerChoice},${game.hostRevealedDoor},${game.finalChoice},${game.carDoor},${game.won},${winRate.toFixed(4)}\n`;
      });
    }

    return csv;
  }

  /**
   * Utility function for async delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export individual utility functions for testing
export { BatchSimulator as default };
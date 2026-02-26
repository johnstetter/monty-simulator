/**
 * Statistical Analysis Utilities for Monty Hall Batch Simulation
 * Provides comprehensive statistical analysis and educational insights
 */

export class StatisticalAnalyzer {
  constructor() {
    this.theoreticalProbabilities = {
      stay: 1/3,
      switch: 2/3
    };
  }

  /**
   * Perform comprehensive statistical analysis on simulation results
   * @param {Object} results - Batch simulation results
   * @returns {Object} - Complete statistical analysis
   */
  analyzeResults(results) {
    return {
      descriptive: this.calculateDescriptiveStats(results),
      inferential: this.calculateInferentialStats(results),
      convergence: this.analyzeConvergence(results),
      educational: this.generateEducationalInsights(results),
      visualization: this.prepareVisualizationData(results)
    };
  }

  /**
   * Calculate descriptive statistics
   * @param {Object} results - Simulation results
   * @returns {Object} - Descriptive statistics
   */
  calculateDescriptiveStats(results) {
    const stats = {};

    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      const theoretical = this.theoreticalProbabilities[strategy];

      stats[strategy] = {
        // Basic counts
        totalGames: data.played,
        wins: data.won,
        losses: data.played - data.won,

        // Proportions
        observedWinRate: data.winRate,
        theoreticalWinRate: theoretical,

        // Deviations
        absoluteDeviation: Math.abs(data.winRate - theoretical),
        relativeDeviation: Math.abs(data.winRate - theoretical) / theoretical,
        percentDeviation: Math.abs(data.winRate - theoretical) * 100,

        // Accuracy metrics
        accuracy: 1 - Math.abs(data.winRate - theoretical) / theoretical,
        withinExpectedRange: this.isWithinExpectedRange(data.winRate, theoretical, data.played)
      };
    }

    // Comparison between strategies
    if (results.strategies.includes('stay') && results.strategies.includes('switch')) {
      const stayRate = results.data.stay.winRate;
      const switchRate = results.data.switch.winRate;

      stats.comparison = {
        switchAdvantage: switchRate - stayRate,
        switchAdvantagePercent: ((switchRate - stayRate) / stayRate) * 100,
        theoreticalAdvantage: this.theoreticalProbabilities.switch - this.theoreticalProbabilities.stay,
        advantageAccuracy: Math.abs((switchRate - stayRate) - (this.theoreticalProbabilities.switch - this.theoreticalProbabilities.stay)),
        correctRelationship: switchRate > stayRate
      };
    }

    return stats;
  }

  /**
   * Calculate inferential statistics (confidence intervals, hypothesis tests)
   * @param {Object} results - Simulation results
   * @returns {Object} - Inferential statistics
   */
  calculateInferentialStats(results) {
    const stats = {};

    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      const theoretical = this.theoreticalProbabilities[strategy];

      // Confidence intervals
      const ci95 = this.calculateConfidenceInterval(data.winRate, data.played, 0.95);
      const ci99 = this.calculateConfidenceInterval(data.winRate, data.played, 0.99);

      // Hypothesis test: H0: p = theoretical, H1: p ≠ theoretical
      const zTest = this.performZTest(data.winRate, data.played, theoretical);

      stats[strategy] = {
        confidenceIntervals: {
          ci95: {
            lower: ci95.lower,
            upper: ci95.upper,
            marginOfError: ci95.marginOfError,
            containsTheoretical: theoretical >= ci95.lower && theoretical <= ci95.upper
          },
          ci99: {
            lower: ci99.lower,
            upper: ci99.upper,
            marginOfError: ci99.marginOfError,
            containsTheoretical: theoretical >= ci99.lower && theoretical <= ci99.upper
          }
        },
        hypothesisTest: {
          nullHypothesis: `Win rate = ${theoretical.toFixed(3)}`,
          alternativeHypothesis: `Win rate ≠ ${theoretical.toFixed(3)}`,
          testStatistic: zTest.zScore,
          pValue: zTest.pValue,
          significance: zTest.significance,
          rejectNull: zTest.rejectNull
        },
        sampleSize: {
          actual: data.played,
          powerAnalysis: this.calculateRequiredSampleSize(theoretical, 0.05, 0.8), // 5% difference, 80% power
          adequacy: this.assessSampleSizeAdequacy(data.played, theoretical)
        }
      };
    }

    return stats;
  }

  /**
   * Analyze convergence patterns
   * @param {Object} results - Simulation results
   * @returns {Object} - Convergence analysis
   */
  analyzeConvergence(results) {
    const analysis = {};

    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      const theoretical = this.theoreticalProbabilities[strategy];

      if (!data.winRateHistory || data.winRateHistory.length === 0) continue;

      analysis[strategy] = {
        convergence: this.measureConvergence(data.winRateHistory, theoretical),
        stability: this.assessStability(data.winRateHistory, theoretical),
        milestones: this.findConvergenceMilestones(data.winRateHistory, theoretical),
        forecast: this.forecastConvergence(data.winRateHistory, theoretical)
      };
    }

    return analysis;
  }

  /**
   * Generate educational insights
   * @param {Object} results - Simulation results
   * @returns {Object} - Educational insights and explanations
   */
  generateEducationalInsights(results) {
    const insights = {
      lawOfLargeNumbers: this.analyzeLawOfLargeNumbers(results),
      probabilityDemonstration: this.generateProbabilityExplanation(results),
      commonMisconceptions: this.addressCommonMisconceptions(results),
      practicalApplications: this.suggestPracticalApplications(results),
      nextSteps: this.suggestNextSteps(results)
    };

    return insights;
  }

  /**
   * Calculate 95% confidence interval for a proportion
   * @param {number} p - Observed proportion
   * @param {number} n - Sample size
   * @param {number} confidence - Confidence level (0.95 for 95%)
   * @returns {Object} - Confidence interval
   */
  calculateConfidenceInterval(p, n, confidence = 0.95) {
    const z = this.getZScore(confidence);
    const standardError = Math.sqrt((p * (1 - p)) / n);
    const marginOfError = z * standardError;

    return {
      lower: Math.max(0, p - marginOfError),
      upper: Math.min(1, p + marginOfError),
      marginOfError,
      standardError
    };
  }

  /**
   * Perform z-test for proportion
   * @param {number} observedP - Observed proportion
   * @param {number} n - Sample size
   * @param {number} expectedP - Expected proportion (null hypothesis)
   * @returns {Object} - Z-test results
   */
  performZTest(observedP, n, expectedP) {
    const standardError = Math.sqrt((expectedP * (1 - expectedP)) / n);
    const zScore = (observedP - expectedP) / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore))); // Two-tailed test

    return {
      zScore,
      pValue,
      significance: pValue < 0.05 ? 'significant' : 'not significant',
      rejectNull: pValue < 0.05
    };
  }

  /**
   * Check if observed rate is within expected range for sample size
   * @param {number} observed - Observed win rate
   * @param {number} theoretical - Theoretical win rate
   * @param {number} sampleSize - Sample size
   * @returns {boolean} - True if within expected range
   */
  isWithinExpectedRange(observed, theoretical, sampleSize) {
    const ci95 = this.calculateConfidenceInterval(theoretical, sampleSize, 0.95);
    return observed >= ci95.lower && observed <= ci95.upper;
  }

  /**
   * Measure how well the observed values converge to theoretical
   * @param {Array} history - Win rate history
   * @param {number} theoretical - Theoretical probability
   * @returns {Object} - Convergence metrics
   */
  measureConvergence(history, theoretical) {
    if (history.length === 0) return null;

    const deviations = history.map(point => Math.abs(point.winRate - theoretical));
    const finalDeviation = deviations[deviations.length - 1];
    const maxDeviation = Math.max(...deviations);
    const minDeviation = Math.min(...deviations);

    // Calculate trend (is convergence improving over time?)
    const improvementTrend = this.calculateLinearTrend(deviations.map((dev, i) => ({ x: i, y: dev })));

    return {
      finalDeviation,
      maxDeviation,
      minDeviation,
      averageDeviation: deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length,
      convergenceRate: -improvementTrend.slope, // Negative slope = improving convergence
      isConverging: improvementTrend.slope < 0,
      stabilityScore: this.calculateStabilityScore(deviations)
    };
  }

  /**
   * Assess stability of recent results
   * @param {Array} history - Win rate history
   * @param {number} theoretical - Theoretical probability
   * @returns {Object} - Stability assessment
   */
  assessStability(history, theoretical) {
    if (history.length < 10) return { stable: false, reason: 'Insufficient data' };

    // Check last 10% of results
    const checkCount = Math.max(10, Math.floor(history.length * 0.1));
    const recentHistory = history.slice(-checkCount);
    const recentDeviations = recentHistory.map(point => Math.abs(point.winRate - theoretical));

    const stabilityThreshold = 0.05; // 5% deviation threshold
    const stable = recentDeviations.every(dev => dev <= stabilityThreshold);

    return {
      stable,
      recentDeviations,
      averageRecentDeviation: recentDeviations.reduce((sum, dev) => sum + dev, 0) / recentDeviations.length,
      stabilityThreshold,
      gamesAnalyzed: checkCount
    };
  }

  /**
   * Find important convergence milestones
   * @param {Array} history - Win rate history
   * @param {number} theoretical - Theoretical probability
   * @returns {Object} - Convergence milestones
   */
  findConvergenceMilestones(history, theoretical) {
    const milestones = {
      firstWithin10Percent: null,
      firstWithin5Percent: null,
      firstWithin1Percent: null,
      longestStableStreak: { start: null, end: null, length: 0 },
      worstDeviation: { gameNumber: null, deviation: 0 }
    };

    let currentStableStreak = 0;
    let stableStreakStart = null;

    for (let i = 0; i < history.length; i++) {
      const point = history[i];
      const deviation = Math.abs(point.winRate - theoretical);
      const percentDeviation = deviation * 100;

      // Find first time within percentage thresholds
      if (!milestones.firstWithin10Percent && percentDeviation <= 10) {
        milestones.firstWithin10Percent = point.gameNumber;
      }
      if (!milestones.firstWithin5Percent && percentDeviation <= 5) {
        milestones.firstWithin5Percent = point.gameNumber;
      }
      if (!milestones.firstWithin1Percent && percentDeviation <= 1) {
        milestones.firstWithin1Percent = point.gameNumber;
      }

      // Track worst deviation
      if (deviation > milestones.worstDeviation.deviation) {
        milestones.worstDeviation = {
          gameNumber: point.gameNumber,
          deviation: deviation,
          winRate: point.winRate
        };
      }

      // Track stability streaks (within 5% for consecutive games)
      if (percentDeviation <= 5) {
        if (currentStableStreak === 0) {
          stableStreakStart = point.gameNumber;
        }
        currentStableStreak++;
      } else {
        if (currentStableStreak > milestones.longestStableStreak.length) {
          milestones.longestStableStreak = {
            start: stableStreakStart,
            end: history[i - 1].gameNumber,
            length: currentStableStreak
          };
        }
        currentStableStreak = 0;
      }
    }

    // Check final streak
    if (currentStableStreak > milestones.longestStableStreak.length) {
      milestones.longestStableStreak = {
        start: stableStreakStart,
        end: history[history.length - 1].gameNumber,
        length: currentStableStreak
      };
    }

    return milestones;
  }

  /**
   * Analyze Law of Large Numbers demonstration
   * @param {Object} results - Simulation results
   * @returns {Object} - Law of Large Numbers analysis
   */
  analyzeLawOfLargeNumbers(results) {
    const analysis = {
      demonstrated: false,
      explanation: '',
      evidence: {}
    };

    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      const theoretical = this.theoreticalProbabilities[strategy];

      if (data.played >= 100) { // Minimum sample size for demonstration
        const finalDeviation = Math.abs(data.winRate - theoretical);
        const isClose = finalDeviation < 0.1; // Within 10%

        analysis.evidence[strategy] = {
          sampleSize: data.played,
          finalDeviation,
          isClose,
          demonstratesLaw: isClose && data.played >= 1000
        };

        if (isClose) {
          analysis.demonstrated = true;
        }
      }
    }

    analysis.explanation = this.generateLawOfLargeNumbersExplanation(analysis.evidence);
    return analysis;
  }

  /**
   * Generate explanation for Law of Large Numbers
   * @param {Object} evidence - Evidence from analysis
   * @returns {string} - Educational explanation
   */
  generateLawOfLargeNumbersExplanation(evidence) {
    const hasEvidence = Object.values(evidence).some(e => e.demonstratesLaw);

    if (hasEvidence) {
      return "The Law of Large Numbers is clearly demonstrated! As the number of games increased, " +
             "the observed win rates converged toward the theoretical probabilities. This shows that " +
             "while individual games are random, the average outcome becomes predictable with large samples.";
    } else {
      return "To better demonstrate the Law of Large Numbers, try running more games (1000+). " +
             "You'll see that as the sample size increases, the observed win rates get closer " +
             "to the theoretical probabilities (33.3% for staying, 66.7% for switching).";
    }
  }

  /**
   * Get Z-score for confidence level
   * @param {number} confidence - Confidence level (e.g., 0.95)
   * @returns {number} - Z-score
   */
  getZScore(confidence) {
    const zScores = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
      0.999: 3.291
    };
    return zScores[confidence] || 1.96;
  }

  /**
   * Calculate required sample size for desired precision
   * @param {number} expectedP - Expected proportion
   * @param {number} marginOfError - Desired margin of error
   * @param {number} confidence - Confidence level
   * @returns {number} - Required sample size
   */
  calculateRequiredSampleSize(expectedP, marginOfError, confidence = 0.95) {
    const z = this.getZScore(confidence);
    const n = (z * z * expectedP * (1 - expectedP)) / (marginOfError * marginOfError);
    return Math.ceil(n);
  }

  /**
   * Assess sample size adequacy
   * @param {number} actualSize - Actual sample size
   * @param {number} expectedP - Expected proportion
   * @returns {Object} - Sample size assessment
   */
  assessSampleSizeAdequacy(actualSize, expectedP) {
    const recommendedFor5Percent = this.calculateRequiredSampleSize(expectedP, 0.05);
    const recommendedFor1Percent = this.calculateRequiredSampleSize(expectedP, 0.01);

    return {
      adequate: actualSize >= recommendedFor5Percent,
      adequacyLevel: actualSize >= recommendedFor1Percent ? 'excellent' :
                    actualSize >= recommendedFor5Percent ? 'good' :
                    actualSize >= recommendedFor5Percent * 0.5 ? 'fair' : 'insufficient',
      recommendedFor5Percent,
      recommendedFor1Percent,
      currentPrecision: this.calculateCurrentPrecision(actualSize, expectedP)
    };
  }

  /**
   * Calculate current precision (margin of error) for given sample size
   * @param {number} sampleSize - Sample size
   * @param {number} expectedP - Expected proportion
   * @returns {number} - Margin of error
   */
  calculateCurrentPrecision(sampleSize, expectedP) {
    const z = this.getZScore(0.95);
    return z * Math.sqrt((expectedP * (1 - expectedP)) / sampleSize);
  }

  /**
   * Linear trend calculation
   * @param {Array} points - Array of {x, y} points
   * @returns {Object} - Slope and intercept
   */
  calculateLinearTrend(points) {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate stability score (lower variance = more stable)
   * @param {Array} values - Array of values
   * @returns {number} - Stability score (0-1, higher = more stable)
   */
  calculateStabilityScore(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Convert to 0-1 score (lower stddev = higher stability)
    return Math.max(0, 1 - standardDeviation);
  }

  /**
   * Normal cumulative distribution function approximation
   * @param {number} z - Z-score
   * @returns {number} - Cumulative probability
   */
  normalCDF(z) {
    // Approximation of the normal CDF using error function
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return z > 0 ? 1 - prob : prob;
  }

  /**
   * Prepare data for visualization components
   * @param {Object} results - Simulation results
   * @returns {Object} - Data formatted for charts
   */
  prepareVisualizationData(results) {
    const visualData = {
      convergenceData: [],
      comparisonData: [],
      distributionData: [],
      confidenceIntervals: {}
    };

    // Prepare convergence chart data
    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      const theoretical = this.theoreticalProbabilities[strategy];

      if (data.winRateHistory) {
        data.winRateHistory.forEach(point => {
          visualData.convergenceData.push({
            gameNumber: point.gameNumber,
            strategy,
            winRate: point.winRate,
            theoretical,
            deviation: Math.abs(point.winRate - theoretical)
          });
        });
      }

      // Confidence intervals for visualization
      const ci = this.calculateConfidenceInterval(data.winRate, data.played, 0.95);
      visualData.confidenceIntervals[strategy] = {
        observed: data.winRate,
        theoretical,
        lower: ci.lower,
        upper: ci.upper,
        marginOfError: ci.marginOfError
      };
    }

    return visualData;
  }

  /**
   * Generate practical applications suggestions
   * @param {Object} results - Simulation results
   * @returns {Array} - Array of practical applications
   */
  suggestPracticalApplications(results) {
    return [
      {
        title: "Medical Testing",
        description: "Understanding false positive/negative rates in medical tests",
        relevance: "Like the Monty Hall problem, medical test accuracy depends on prior probabilities"
      },
      {
        title: "Quality Control",
        description: "Manufacturing defect rates and sample testing",
        relevance: "Large sample sizes give more reliable estimates of true defect rates"
      },
      {
        title: "A/B Testing",
        description: "Comparing website or app versions with statistical confidence",
        relevance: "Sample size determines how confident we can be in observed differences"
      },
      {
        title: "Weather Prediction",
        description: "Understanding probability in weather forecasting",
        relevance: "Percentage chances reflect long-term frequency of events"
      }
    ];
  }

  /**
   * Suggest next steps based on results
   * @param {Object} results - Simulation results
   * @returns {Array} - Array of suggested next steps
   */
  suggestNextSteps(results) {
    const suggestions = [];

    // Check if more games would help
    const totalGames = results.strategies.reduce((sum, strategy) =>
      sum + results.data[strategy].played, 0);

    if (totalGames < 1000) {
      suggestions.push({
        action: "Run more simulations",
        reason: `With ${totalGames} games, try 1000+ for clearer convergence patterns`,
        priority: "high"
      });
    }

    // Check if both strategies were tested
    if (results.strategies.length === 1) {
      const missingStrategy = results.strategies[0] === 'stay' ? 'switch' : 'stay';
      suggestions.push({
        action: `Test ${missingStrategy} strategy`,
        reason: "Compare both strategies to see the full Monty Hall effect",
        priority: "high"
      });
    }

    // Educational suggestions
    suggestions.push({
      action: "Explore the mathematics",
      reason: "Learn why switching gives 2/3 probability using conditional probability",
      priority: "medium"
    });

    suggestions.push({
      action: "Try variations",
      reason: "What happens with 4 doors? 10 doors? How does the advantage scale?",
      priority: "low"
    });

    return suggestions;
  }

  /**
   * Address common misconceptions about the Monty Hall problem
   * @param {Object} results - Simulation results
   * @returns {Array} - Array of misconception clarifications
   */
  addressCommonMisconceptions(results) {
    const misconceptions = [
      {
        misconception: "It's 50-50 after a door is opened",
        reality: "Your original choice still has 1/3 probability",
        evidence: results.strategies.includes('stay') ?
          `Stay strategy won ${(results.data.stay.winRate * 100).toFixed(1)}% (close to 33.3%)` :
          "Run the stay strategy to see it wins about 1/3 of the time"
      },
      {
        misconception: "The host's knowledge doesn't matter",
        reality: "The host always reveals a goat, which provides information",
        evidence: "If the host opened doors randomly, the probabilities would indeed be 50-50"
      },
      {
        misconception: "Small samples are just as reliable as large samples",
        reality: "Larger samples give more reliable estimates of true probabilities",
        evidence: `${results.totalGames} games helped demonstrate the theoretical probabilities`
      }
    ];

    return misconceptions;
  }
}

export default StatisticalAnalyzer;
/**
 * User Interface for Monty Hall Simulator
 * Handles DOM manipulation, animations, and user interactions
 */

export class MontyHallUI {
  constructor(game, stats, batchSimulator, statisticalAnalyzer, simulationCharts) {
    this.game = game;
    this.stats = stats;
    this.batchSimulator = batchSimulator;
    this.statisticalAnalyzer = statisticalAnalyzer;
    this.simulationCharts = simulationCharts;
    this.elements = {};
    this.isAnimating = false;
    this.isSimulating = false;
    this.currentSimulationResults = null;

    this.init();
  }

  /**
   * Initialize the UI
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.updateDisplay();
    this.showEducationalHints();
  }

  /**
   * Cache commonly used DOM elements
   */
  cacheElements() {
    this.elements = {
      // Game area
      doors: document.querySelectorAll('.door'),
      door0: document.getElementById('door-0'),
      door1: document.getElementById('door-1'),
      door2: document.getElementById('door-2'),

      // Game controls
      gamePhase: document.getElementById('game-phase'),
      gameInstructions: document.getElementById('game-instructions'),
      choiceButtons: document.getElementById('choice-buttons'),
      stayButton: document.getElementById('stay-button'),
      switchButton: document.getElementById('switch-button'),
      resetButton: document.getElementById('reset-button'),

      // Statistics
      statsPanel: document.getElementById('stats-panel'),
      totalGames: document.getElementById('total-games'),
      stayStats: document.getElementById('stay-stats'),
      switchStats: document.getElementById('switch-stats'),
      comparison: document.getElementById('comparison'),

      // Educational content
      hintsPanel: document.getElementById('hints-panel'),
      explanation: document.getElementById('explanation'),

      // Modal/overlay elements
      resultModal: document.getElementById('result-modal'),
      resultMessage: document.getElementById('result-message'),
      resultDetails: document.getElementById('result-details'),

      // Batch simulation elements
      simulationStatus: document.getElementById('simulation-status'),
      gameCountInput: document.getElementById('game-count-input'),
      presetButtons: document.querySelectorAll('.preset-button'),
      strategyOptions: document.querySelectorAll('.strategy-option'),
      speedOptions: document.querySelectorAll('.speed-option'),
      startSimulationBtn: document.getElementById('start-simulation'),
      stopSimulationBtn: document.getElementById('stop-simulation'),
      resetSimulationBtn: document.getElementById('reset-simulation'),
      exportResultsBtn: document.getElementById('export-results'),
      simulationProgress: document.getElementById('simulation-progress'),
      progressCompleted: document.getElementById('progress-completed'),
      progressTotal: document.getElementById('progress-total'),
      progressRate: document.getElementById('progress-rate'),
      progressBar: document.getElementById('progress-bar'),
      progressText: document.getElementById('progress-text'),
      simulationResults: document.getElementById('simulation-results'),
      resultsSummary: document.getElementById('results-summary'),
      chartsSection: document.getElementById('charts-section'),
      convergenceChart: document.getElementById('convergence-chart'),
      insightsContent: document.getElementById('insights-content'),
      exportModal: document.getElementById('export-modal'),
      exportModalClose: document.getElementById('export-modal-close'),
      exportOptions: document.querySelectorAll('.export-option')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Door click events
    this.elements.doors.forEach((door, index) => {
      door.addEventListener('click', () => this.handleDoorClick(index));
      door.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleDoorClick(index);
        }
      });
    });

    // Choice button events
    this.elements.stayButton?.addEventListener('click', () => this.handleChoice('stay'));
    this.elements.switchButton?.addEventListener('click', () => this.handleChoice('switch'));

    // Reset button
    this.elements.resetButton?.addEventListener('click', () => this.resetGame());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.isAnimating) return;

      switch(e.key) {
        case '1':
        case '2':
        case '3':
          const doorIndex = parseInt(e.key) - 1;
          this.handleDoorClick(doorIndex);
          break;
        case 's':
        case 'S':
          if (this.game.canMakeChoice()) {
            this.handleChoice('stay');
          }
          break;
        case 'w':
        case 'W':
          if (this.game.canMakeChoice()) {
            this.handleChoice('switch');
          }
          break;
        case 'r':
        case 'R':
          this.resetGame();
          break;
      }
    });

    // Statistics reset (hidden feature - long press on stats)
    let resetTimeout;
    this.elements.statsPanel?.addEventListener('mousedown', () => {
      resetTimeout = setTimeout(() => {
        if (confirm('Reset all statistics? This cannot be undone.')) {
          this.stats.resetStats();
          this.updateStatsDisplay();
          this.showMessage('Statistics reset successfully!', 'info');
        }
      }, 2000);
    });

    this.elements.statsPanel?.addEventListener('mouseup', () => {
      clearTimeout(resetTimeout);
    });

    // Batch simulation events
    this.bindSimulationEvents();
  }

  /**
   * Handle door click/selection
   */
  async handleDoorClick(doorIndex) {
    if (this.isAnimating || !this.game.getAvailableDoors().includes(doorIndex)) {
      return;
    }

    this.isAnimating = true;

    // Animate door selection
    await this.animateDoorSelection(doorIndex);

    // Make the selection in the game
    const success = this.game.selectDoor(doorIndex);

    if (success) {
      // Update display to show host revealed door
      await this.animateHostReveal();
      this.updateDisplay();
    }

    this.isAnimating = false;
  }

  /**
   * Handle stay or switch choice
   */
  async handleChoice(strategy) {
    if (this.isAnimating || !this.game.canMakeChoice()) {
      return;
    }

    this.isAnimating = true;

    // Animate the choice
    await this.animateChoice(strategy);

    // Make the choice in the game
    const success = this.game.makeChoice(strategy);

    if (success) {
      // Record statistics
      this.stats.recordGame(strategy, this.game.won);

      // Animate final reveal
      await this.animateFinalReveal();

      // Show result
      this.showGameResult();

      // Update all displays
      this.updateDisplay();
      this.updateStatsDisplay();
      this.showEducationalHints();
    }

    this.isAnimating = false;
  }

  /**
   * Reset the game to initial state
   */
  resetGame() {
    if (this.isAnimating) return;

    this.game.reset();
    this.updateDisplay();
    this.closeResultModal();

    // Reset door styles
    this.elements.doors.forEach(door => {
      door.className = 'door';
      door.setAttribute('aria-label', 'Door - Click to select');
    });
  }

  /**
   * Update the entire display based on game state
   */
  updateDisplay() {
    this.updateGamePhase();
    this.updateInstructions();
    this.updateDoors();
    this.updateChoiceButtons();
    this.updateStatsDisplay();
  }

  /**
   * Update game phase indicator
   */
  updateGamePhase() {
    const phases = {
      'selecting': 'Choose a Door',
      'revealed': 'Make Your Choice',
      'choosing': 'Processing...',
      'finished': 'Game Complete'
    };

    if (this.elements.gamePhase) {
      this.elements.gamePhase.textContent = phases[this.game.gamePhase] || 'Ready to Play';
    }
  }

  /**
   * Update game instructions
   */
  updateInstructions() {
    const instructions = {
      'selecting': 'Pick one of the three doors. One hides a car, two hide goats.',
      'revealed': 'The host has opened a door with a goat. Will you stay with your choice or switch?',
      'choosing': 'Revealing the final result...',
      'finished': 'Click Reset to play again, or check the statistics below!'
    };

    if (this.elements.gameInstructions) {
      this.elements.gameInstructions.textContent = instructions[this.game.gamePhase] || '';
    }
  }

  /**
   * Update door appearances based on game state
   */
  updateDoors() {
    const gameState = this.game.getGameState();
    const doors = gameState.doors || [];

    this.elements.doors.forEach((doorElement, index) => {
      const doorState = doors[index];
      if (!doorState) return;

      // Reset classes
      doorElement.className = 'door';

      // Add state classes
      if (doorState.isPlayerChoice) {
        doorElement.classList.add('selected');
      }

      if (doorState.isHostRevealed) {
        doorElement.classList.add('revealed', 'goat');
      }

      if (doorState.isFinalChoice && this.game.gamePhase === 'finished') {
        doorElement.classList.add('final-choice');
        if (doorState.content === 'car') {
          doorElement.classList.add('winner');
        }
      }

      if (this.game.gamePhase === 'finished' && doorState.content === 'car') {
        doorElement.classList.add('car');
      }

      // Update accessibility
      let label = `Door ${index + 1}`;
      if (doorState.isPlayerChoice) {
        label += ' - Your choice';
      }
      if (doorState.isHostRevealed) {
        label += ' - Revealed: Goat';
      }
      if (doorState.isFinalChoice && this.game.gamePhase === 'finished') {
        label += ` - Final choice: ${doorState.content}`;
      }

      doorElement.setAttribute('aria-label', label);

      // Update content
      this.updateDoorContent(doorElement, doorState);
    });
  }

  /**
   * Update door content (car/goat icons)
   */
  updateDoorContent(doorElement, doorState) {
    let contentHtml = '<div class="door-number">' + (doorState.index + 1) + '</div>';

    if (doorState.isRevealed || this.game.gamePhase === 'finished') {
      if (doorState.content === 'car') {
        contentHtml += '<div class="door-icon car-icon">🚗</div>';
      } else {
        contentHtml += '<div class="door-icon goat-icon">🐐</div>';
      }
    }

    doorElement.innerHTML = contentHtml;
  }

  /**
   * Update choice buttons visibility and state
   */
  updateChoiceButtons() {
    if (!this.elements.choiceButtons) return;

    if (this.game.canMakeChoice()) {
      this.elements.choiceButtons.style.display = 'flex';

      // Update button text with context
      const remainingDoor = this.game.getRemainingDoor();
      if (this.elements.stayButton) {
        this.elements.stayButton.textContent = `Stay with Door ${this.game.playerChoice + 1}`;
      }
      if (this.elements.switchButton) {
        this.elements.switchButton.textContent = `Switch to Door ${remainingDoor + 1}`;
      }
    } else {
      this.elements.choiceButtons.style.display = 'none';
    }
  }

  /**
   * Update statistics display
   */
  updateStatsDisplay() {
    const formattedStats = this.stats.getFormattedStats();
    const comparison = this.stats.getStrategyComparison();

    // Update total games
    if (this.elements.totalGames) {
      this.elements.totalGames.textContent = formattedStats.totalGames;
    }

    // Update stay strategy stats
    if (this.elements.stayStats) {
      this.elements.stayStats.innerHTML = `
        <div class="strategy-name">Stay Strategy</div>
        <div class="strategy-details">
          <span class="win-rate">${formattedStats.stay.winRate}</span>
          <span class="games-played">${formattedStats.stay.won}/${formattedStats.stay.played} wins</span>
        </div>
      `;
    }

    // Update switch strategy stats
    if (this.elements.switchStats) {
      this.elements.switchStats.innerHTML = `
        <div class="strategy-name">Switch Strategy</div>
        <div class="strategy-details">
          <span class="win-rate">${formattedStats.switch.winRate}</span>
          <span class="games-played">${formattedStats.switch.won}/${formattedStats.switch.played} wins</span>
        </div>
      `;
    }

    // Update comparison
    if (this.elements.comparison && comparison.hasData) {
      let comparisonHtml = '';

      if (comparison.better === 'switch') {
        comparisonHtml = `<span class="better-strategy">Switching is ${comparison.difference}% better!</span>`;
      } else if (comparison.better === 'stay') {
        comparisonHtml = `<span class="worse-strategy">Staying is ${comparison.difference}% better (unexpected!)</span>`;
      } else if (comparison.better === 'tie') {
        comparisonHtml = `<span class="tie-strategy">Both strategies are tied</span>`;
      }

      if (comparison.confidence === 'low' && formattedStats.totalGames < 20) {
        comparisonHtml += '<div class="confidence-note">Play more games for reliable statistics</div>';
      }

      this.elements.comparison.innerHTML = comparisonHtml;
    }
  }

  /**
   * Show educational hints based on current statistics
   */
  showEducationalHints() {
    const hints = this.stats.getEducationalHints();

    if (hints.length > 0 && this.elements.hintsPanel) {
      const latestHint = hints[hints.length - 1];

      this.elements.hintsPanel.innerHTML = `
        <div class="hint ${latestHint.type}">
          <h4>${latestHint.title}</h4>
          <p>${latestHint.message}</p>
        </div>
      `;

      this.elements.hintsPanel.style.display = 'block';
    }
  }

  /**
   * Show game result modal
   */
  showGameResult() {
    if (!this.elements.resultModal) return;

    const won = this.game.won;
    const strategy = this.game.playerStrategy;
    const gameState = this.game.getGameState();

    const resultHtml = `
      <div class="result-icon">${won ? '🎉' : '😔'}</div>
      <h3>${won ? 'You Won!' : 'You Lost'}</h3>
      <p>You chose to <strong>${strategy}</strong> and ${won ? 'found the car!' : 'got a goat.'}</p>
      <div class="result-details">
        <p>Your final choice: Door ${gameState.finalChoice + 1} (${gameState.doors[gameState.finalChoice].content})</p>
        <p>The car was behind Door ${gameState.carDoor + 1}</p>
      </div>
    `;

    if (this.elements.resultMessage) {
      this.elements.resultMessage.innerHTML = resultHtml;
    }

    this.elements.resultModal.style.display = 'flex';

    // Auto-close after 3 seconds
    setTimeout(() => {
      this.closeResultModal();
    }, 3000);
  }

  /**
   * Close result modal
   */
  closeResultModal() {
    if (this.elements.resultModal) {
      this.elements.resultModal.style.display = 'none';
    }
  }

  /**
   * Animation: Door selection
   */
  async animateDoorSelection(doorIndex) {
    const door = this.elements.doors[doorIndex];
    if (!door) return;

    door.classList.add('selecting');
    await this.wait(300);
    door.classList.remove('selecting');
    door.classList.add('selected');
  }

  /**
   * Animation: Host reveals a door
   */
  async animateHostReveal() {
    const hostDoor = this.elements.doors[this.game.hostRevealedDoor];
    if (!hostDoor) return;

    hostDoor.classList.add('revealing');
    await this.wait(500);
    hostDoor.classList.remove('revealing');
    hostDoor.classList.add('revealed', 'goat');

    // Update door content
    const doorState = this.game.getGameState().doors[this.game.hostRevealedDoor];
    this.updateDoorContent(hostDoor, doorState);
  }

  /**
   * Animation: Player makes choice
   */
  async animateChoice(strategy) {
    const choiceButton = strategy === 'stay' ? this.elements.stayButton : this.elements.switchButton;
    if (!choiceButton) return;

    choiceButton.classList.add('chosen');
    await this.wait(200);
  }

  /**
   * Animation: Final reveal
   */
  async animateFinalReveal() {
    // Animate final choice door
    const finalChoiceDoor = this.elements.doors[this.game.finalChoice];
    if (finalChoiceDoor) {
      finalChoiceDoor.classList.add('final-revealing');
      await this.wait(800);
      finalChoiceDoor.classList.remove('final-revealing');
    }

    // Show all doors
    this.elements.doors.forEach((door, index) => {
      const doorState = this.game.getGameState().doors[index];
      if (doorState) {
        this.updateDoorContent(door, doorState);

        if (doorState.content === 'car') {
          door.classList.add('car');
        }

        if (doorState.isFinalChoice) {
          door.classList.add('final-choice');
          if (this.game.won) {
            door.classList.add('winner');
          }
        }
      }
    });

    await this.wait(500);
  }

  /**
   * Show a temporary message
   */
  showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('temp-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'temp-message';
      messageEl.className = 'temp-message';
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = message;
    messageEl.className = `temp-message ${type} visible`;

    setTimeout(() => {
      messageEl.classList.remove('visible');
    }, 2000);
  }

  /**
   * Utility: Wait for specified milliseconds
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Bind batch simulation event listeners
   */
  bindSimulationEvents() {
    // Preset buttons for game count
    this.elements.presetButtons?.forEach(button => {
      button.addEventListener('click', () => {
        const count = parseInt(button.dataset.count);
        if (this.elements.gameCountInput) {
          this.elements.gameCountInput.value = count;
        }

        // Update active state
        this.elements.presetButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });

    // Strategy option toggles
    this.elements.strategyOptions?.forEach(option => {
      option.addEventListener('click', () => {
        option.classList.toggle('selected');
        const checkbox = option.querySelector('.strategy-checkbox');
        if (checkbox) {
          checkbox.classList.toggle('checked');
        }
      });
    });

    // Speed option selection
    this.elements.speedOptions?.forEach(option => {
      option.addEventListener('click', () => {
        this.elements.speedOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
      });
    });

    // Simulation control buttons
    this.elements.startSimulationBtn?.addEventListener('click', () => this.startBatchSimulation());
    this.elements.stopSimulationBtn?.addEventListener('click', () => this.stopBatchSimulation());
    this.elements.resetSimulationBtn?.addEventListener('click', () => this.resetBatchSimulation());
    this.elements.exportResultsBtn?.addEventListener('click', () => this.showExportModal());

    // Export modal
    this.elements.exportModalClose?.addEventListener('click', () => this.hideExportModal());
    this.elements.exportOptions?.forEach(option => {
      option.addEventListener('click', () => {
        const format = option.dataset.format;
        this.exportSimulationResults(format);
      });
    });
  }

  /**
   * Start batch simulation
   */
  async startBatchSimulation() {
    if (this.isSimulating) return;

    // Get simulation parameters
    const gameCount = parseInt(this.elements.gameCountInput?.value || '1000');
    const selectedStrategies = Array.from(this.elements.strategyOptions || [])
      .filter(option => option.classList.contains('selected'))
      .map(option => option.dataset.strategy);
    const speed = Array.from(this.elements.speedOptions || [])
      .find(option => option.classList.contains('selected'))?.dataset.speed || 'fast';

    if (selectedStrategies.length === 0) {
      this.showMessage('Please select at least one strategy to test.', 'error');
      return;
    }

    this.isSimulating = true;
    this.updateSimulationStatus('running');
    this.updateSimulationControls();
    this.showProgressSection();

    try {
      const results = await this.batchSimulator.runSimulation({
        totalGames: gameCount,
        strategies: selectedStrategies,
        speed: speed,
        onProgress: (progress) => this.updateSimulationProgress(progress),
        onComplete: (results) => this.handleSimulationComplete(results)
      });

      this.currentSimulationResults = results;

    } catch (error) {
      console.error('Simulation error:', error);
      this.showMessage('Simulation failed: ' + error.message, 'error');
    } finally {
      this.isSimulating = false;
      this.updateSimulationStatus('ready');
      this.updateSimulationControls();
    }
  }

  /**
   * Stop batch simulation
   */
  stopBatchSimulation() {
    if (!this.isSimulating) return;

    this.batchSimulator.stopSimulation();
    this.isSimulating = false;
    this.updateSimulationStatus('stopped');
    this.updateSimulationControls();
    this.showMessage('Simulation stopped by user.', 'info');
  }

  /**
   * Reset batch simulation
   */
  resetBatchSimulation() {
    if (this.isSimulating) {
      this.stopBatchSimulation();
    }

    this.currentSimulationResults = null;
    this.hideProgressSection();
    this.hideResultsSection();
    this.updateSimulationStatus('ready');
    this.updateSimulationControls();
    this.showMessage('Simulation results cleared.', 'info');
  }

  /**
   * Update simulation status display
   */
  updateSimulationStatus(status) {
    const statusTexts = {
      'ready': 'Ready',
      'running': 'Running...',
      'stopped': 'Stopped',
      'completed': 'Completed'
    };

    if (this.elements.simulationStatus) {
      this.elements.simulationStatus.textContent = statusTexts[status] || 'Ready';
      this.elements.simulationStatus.className = `simulation-status ${status}`;
    }
  }

  /**
   * Update simulation control button states
   */
  updateSimulationControls() {
    if (this.elements.startSimulationBtn) {
      this.elements.startSimulationBtn.disabled = this.isSimulating;
    }
    if (this.elements.stopSimulationBtn) {
      this.elements.stopSimulationBtn.disabled = !this.isSimulating;
    }
    if (this.elements.exportResultsBtn) {
      this.elements.exportResultsBtn.disabled = !this.currentSimulationResults;
    }
  }

  /**
   * Update simulation progress
   */
  updateSimulationProgress(progress) {
    if (this.elements.progressCompleted) {
      this.elements.progressCompleted.textContent = progress.completed.toLocaleString();
    }
    if (this.elements.progressTotal) {
      this.elements.progressTotal.textContent = progress.total.toLocaleString();
    }
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${progress.percentage}%`;
    }
    if (this.elements.progressText) {
      this.elements.progressText.textContent = `${progress.completed} of ${progress.total} games (${progress.percentage.toFixed(1)}%)`;
    }

    // Update games per second
    const now = Date.now();
    if (this.lastProgressUpdate) {
      const deltaTime = now - this.lastProgressUpdate;
      const deltaGames = progress.completed - (this.lastProgressCompleted || 0);
      const gamesPerSecond = Math.round((deltaGames / deltaTime) * 1000);

      if (this.elements.progressRate) {
        this.elements.progressRate.textContent = gamesPerSecond.toLocaleString();
      }
    }

    this.lastProgressUpdate = now;
    this.lastProgressCompleted = progress.completed;
  }

  /**
   * Handle simulation completion
   */
  handleSimulationComplete(results) {
    this.currentSimulationResults = results;
    this.updateSimulationStatus('completed');
    this.showResultsSection();
    this.displaySimulationResults(results);
    this.showMessage('Simulation completed successfully!', 'success');
  }

  /**
   * Display simulation results
   */
  displaySimulationResults(results) {
    // Generate summary cards
    this.displayResultsSummary(results);

    // Generate charts
    this.displayCharts(results);

    // Generate educational insights
    this.displayInsights(results);
  }

  /**
   * Display results summary cards
   */
  displayResultsSummary(results) {
    if (!this.elements.resultsSummary) return;

    const summaryCards = [];

    for (const strategy of results.strategies) {
      const data = results.data[strategy];
      const stats = results.statistics.summary[strategy];
      const confidence = results.statistics.confidence[strategy];

      summaryCards.push(`
        <div class="summary-card">
          <div class="summary-value">${(stats.winRate * 100).toFixed(1)}%</div>
          <div class="summary-label">${strategy} Strategy</div>
          <div class="summary-detail">
            ${data.won.toLocaleString()} wins out of ${data.played.toLocaleString()} games
          </div>
          <div class="summary-detail">
            95% confidence: ${(confidence.lower * 100).toFixed(1)}% - ${(confidence.upper * 100).toFixed(1)}%
          </div>
        </div>
      `);
    }

    // Add convergence summary
    const convergenceStats = this.statisticalAnalyzer.analyzeConvergence(results);
    summaryCards.push(`
      <div class="summary-card">
        <div class="summary-value">${(results.duration / 1000).toFixed(1)}s</div>
        <div class="summary-label">Simulation Time</div>
        <div class="summary-detail">
          ${results.totalGames.toLocaleString()} total games
        </div>
        <div class="summary-detail">
          ${Math.round(results.totalGames / (results.duration / 1000))} games/sec
        </div>
      </div>
    `);

    this.elements.resultsSummary.innerHTML = summaryCards.join('');
  }

  /**
   * Display simulation charts
   */
  displayCharts(results) {
    if (!this.elements.convergenceChart) return;

    // Generate convergence chart
    const chartSvg = this.simulationCharts.createConvergenceChart('convergence-chart', results);
    this.elements.convergenceChart.innerHTML = chartSvg;
  }

  /**
   * Display educational insights
   */
  displayInsights(results) {
    if (!this.elements.insightsContent) return;

    const insights = this.statisticalAnalyzer.generateEducationalInsights(results);

    const insightsHtml = insights.map(insight => `
      <div class="insight-item">
        <div class="insight-title">${insight.title}</div>
        <div class="insight-description">${insight.description}</div>
      </div>
    `).join('');

    this.elements.insightsContent.innerHTML = insightsHtml;
  }

  /**
   * Show progress section
   */
  showProgressSection() {
    if (this.elements.simulationProgress) {
      this.elements.simulationProgress.classList.add('visible');
    }
  }

  /**
   * Hide progress section
   */
  hideProgressSection() {
    if (this.elements.simulationProgress) {
      this.elements.simulationProgress.classList.remove('visible');
    }
  }

  /**
   * Show results section
   */
  showResultsSection() {
    if (this.elements.simulationResults) {
      this.elements.simulationResults.classList.add('visible');
    }
  }

  /**
   * Hide results section
   */
  hideResultsSection() {
    if (this.elements.simulationResults) {
      this.elements.simulationResults.classList.remove('visible');
    }
  }

  /**
   * Show export modal
   */
  showExportModal() {
    if (!this.currentSimulationResults) {
      this.showMessage('No simulation results to export.', 'error');
      return;
    }

    if (this.elements.exportModal) {
      this.elements.exportModal.classList.add('visible');
    }
  }

  /**
   * Hide export modal
   */
  hideExportModal() {
    if (this.elements.exportModal) {
      this.elements.exportModal.classList.remove('visible');
    }
  }

  /**
   * Export simulation results
   */
  exportSimulationResults(format) {
    if (!this.currentSimulationResults) return;

    try {
      const data = this.batchSimulator.exportResults(this.currentSimulationResults, format);
      const filename = `monty-hall-simulation-${Date.now()}.${format}`;

      this.downloadFile(data, filename, format === 'json' ? 'application/json' : 'text/csv');
      this.hideExportModal();
      this.showMessage(`Results exported as ${filename}`, 'success');

    } catch (error) {
      console.error('Export error:', error);
      this.showMessage('Export failed: ' + error.message, 'error');
    }
  }

  /**
   * Download file helper
   */
  downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
/**
 * User Interface for Monty Hall Simulator
 * Handles DOM manipulation, animations, and user interactions
 */

export class MontyHallUI {
  constructor(game, stats) {
    this.game = game;
    this.stats = stats;
    this.elements = {};
    this.isAnimating = false;

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
      resultDetails: document.getElementById('result-details')
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
}
/**
 * Monty Hall Game Logic
 * Implements the classic Monty Hall problem simulation
 */

export class MontyHallGame {
  constructor() {
    this.reset();
  }

  /**
   * Reset the game to initial state
   */
  reset() {
    this.carDoor = Math.floor(Math.random() * 3); // Random door 0, 1, or 2 has the car
    this.playerChoice = null; // Player's initial choice
    this.hostRevealedDoor = null; // Door opened by host (always has goat)
    this.finalChoice = null; // Player's final choice (stay or switch)
    this.gamePhase = 'selecting'; // 'selecting', 'revealed', 'choosing', 'finished'
    this.playerStrategy = null; // 'stay' or 'switch'
    this.won = null; // true if player won, false if lost, null if game not finished
  }

  /**
   * Player makes initial door selection
   * @param {number} doorIndex - Door index (0, 1, or 2)
   * @returns {boolean} - True if valid selection
   */
  selectDoor(doorIndex) {
    if (this.gamePhase !== 'selecting' || doorIndex < 0 || doorIndex > 2) {
      return false;
    }

    this.playerChoice = doorIndex;
    this.gamePhase = 'revealed';

    // Host reveals a door with a goat (not the car, not the player's choice)
    this.hostRevealedDoor = this.getHostRevealedDoor();

    return true;
  }

  /**
   * Get the door the host should reveal (always has a goat)
   * @returns {number} - Door index to reveal
   */
  getHostRevealedDoor() {
    const availableDoors = [];

    for (let i = 0; i < 3; i++) {
      // Host cannot reveal the car door or the player's chosen door
      if (i !== this.carDoor && i !== this.playerChoice) {
        availableDoors.push(i);
      }
    }

    // If multiple options, randomly choose one
    return availableDoors[Math.floor(Math.random() * availableDoors.length)];
  }

  /**
   * Player makes final choice (stay or switch)
   * @param {string} strategy - 'stay' or 'switch'
   * @returns {boolean} - True if valid choice
   */
  makeChoice(strategy) {
    if (this.gamePhase !== 'revealed' || !['stay', 'switch'].includes(strategy)) {
      return false;
    }

    this.playerStrategy = strategy;
    this.gamePhase = 'choosing';

    if (strategy === 'stay') {
      this.finalChoice = this.playerChoice;
    } else {
      // Switch to the remaining unopened door
      this.finalChoice = this.getRemainingDoor();
    }

    // Determine if player won
    this.won = this.finalChoice === this.carDoor;
    this.gamePhase = 'finished';

    return true;
  }

  /**
   * Get the remaining unopened door (for switching)
   * @returns {number} - Door index
   */
  getRemainingDoor() {
    for (let i = 0; i < 3; i++) {
      if (i !== this.playerChoice && i !== this.hostRevealedDoor) {
        return i;
      }
    }
    return null; // Should never happen
  }

  /**
   * Get current game state
   * @returns {object} - Complete game state
   */
  getGameState() {
    return {
      carDoor: this.carDoor,
      playerChoice: this.playerChoice,
      hostRevealedDoor: this.hostRevealedDoor,
      finalChoice: this.finalChoice,
      gamePhase: this.gamePhase,
      playerStrategy: this.playerStrategy,
      won: this.won,
      doors: this.getDoorsState()
    };
  }

  /**
   * Get the state of all three doors
   * @returns {Array} - Array of door objects with content and status
   */
  getDoorsState() {
    const doors = [];

    for (let i = 0; i < 3; i++) {
      doors.push({
        index: i,
        content: i === this.carDoor ? 'car' : 'goat',
        isPlayerChoice: i === this.playerChoice,
        isHostRevealed: i === this.hostRevealedDoor,
        isFinalChoice: i === this.finalChoice,
        isRevealed: this.gamePhase === 'finished' || i === this.hostRevealedDoor
      });
    }

    return doors;
  }

  /**
   * Check if the game is finished
   * @returns {boolean} - True if game is complete
   */
  isFinished() {
    return this.gamePhase === 'finished';
  }

  /**
   * Check if player can make a choice (stay or switch)
   * @returns {boolean} - True if choice can be made
   */
  canMakeChoice() {
    return this.gamePhase === 'revealed';
  }

  /**
   * Get doors available for initial selection
   * @returns {Array} - Array of available door indices
   */
  getAvailableDoors() {
    if (this.gamePhase === 'selecting') {
      return [0, 1, 2];
    }
    return [];
  }
}

// For testing in Node.js environment (when run directly)
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  // Simple test function
  function testGame() {
    console.log('Testing Monty Hall Game Logic...\n');

    // Test basic game flow
    const game = new MontyHallGame();
    console.log('Initial state:', game.getGameState());

    // Player selects door 0
    console.log('\nPlayer selects door 0...');
    game.selectDoor(0);
    console.log('After selection:', game.getGameState());

    // Player stays with original choice
    console.log('\nPlayer stays...');
    game.makeChoice('stay');
    console.log('Final state (stay):', game.getGameState());

    // Test switching
    const game2 = new MontyHallGame();
    game2.selectDoor(1);
    game2.makeChoice('switch');
    console.log('\nFinal state (switch):', game2.getGameState());

    // Run simulation to test probability
    console.log('\n--- Running Simulation (1000 games) ---');
    let stayWins = 0;
    let switchWins = 0;
    const simulations = 1000;

    for (let i = 0; i < simulations; i++) {
      // Test staying
      const stayGame = new MontyHallGame();
      stayGame.selectDoor(0);
      stayGame.makeChoice('stay');
      if (stayGame.won) stayWins++;

      // Test switching
      const switchGame = new MontyHallGame();
      switchGame.selectDoor(0);
      switchGame.makeChoice('switch');
      if (switchGame.won) switchWins++;
    }

    console.log(`Stay strategy wins: ${stayWins}/${simulations} (${(stayWins/simulations*100).toFixed(1)}%)`);
    console.log(`Switch strategy wins: ${switchWins}/${simulations} (${(switchWins/simulations*100).toFixed(1)}%)`);
    console.log('\nExpected: Stay ~33.3%, Switch ~66.7%');
  }

  testGame();
}
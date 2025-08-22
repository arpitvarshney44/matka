const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const SessionResult = require('../models/SessionResult');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get all games with latest results
router.get('/', async (req, res) => {
  try {
    // Only fetch active games for users
    const games = await Game.find({ isActive: true });
    
    // Get today's date for fetching latest results
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch latest results for each game
    const gamesWithResults = await Promise.all(
      games.map(async (game) => {
        // Get the latest session results for this game
        const latestResults = await SessionResult.find({
          gameId: game._id,
          gameDate: { $gte: today }
        }).sort({ createdAt: -1 }).limit(2);
        
        // Format result string based on available session results
        let resultString = '***-**-***';
        
        if (latestResults.length > 0) {
          const openResult = latestResults.find(r => r.session === 'open');
          const closeResult = latestResults.find(r => r.session === 'close');
          
          if (openResult && closeResult) {
            // Both sessions available
            resultString = `${openResult.pana}-${openResult.digit}-${closeResult.pana}`;
          } else if (openResult) {
            // Only open session available
            resultString = `${openResult.pana}-${openResult.digit}-***`;
          } else if (closeResult) {
            // Only close session available (unusual but handle it)
            resultString = `***-**-${closeResult.pana}`;
          }
        }
        
        return {
          ...game.toObject(),
          result: resultString,
          latestResults: latestResults
        };
      })
    );
    
    res.json(gamesWithResults);
  } catch (error) {
    console.error('Error fetching games with results:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new game
router.post('/', async (req, res) => {
  try {
    const { gameName, gameNameHindi, schedule, isActive = true, description, openTime, closeTime } = req.body;

    if (!gameName) {
      return res.status(400).json({ message: 'Game name is required' });
    }

    // If schedule is not provided, create a basic default schedule
    let gameSchedule = schedule;
    if (!Array.isArray(schedule) || schedule.length !== 7) {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      gameSchedule = daysOfWeek.map(day => ({
        day,
        openTime: openTime || '10:00',
        closeTime: closeTime || '18:00',
        isActive: true
      }));
    }

    // Validate each day's entry if schedule was provided
    if (Array.isArray(schedule) && schedule.length === 7) {
      const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      for (let i = 0; i < 7; i++) {
        const dayObj = schedule[i];
        if (!dayObj.day || !dayObj.openTime || !dayObj.closeTime) {
          return res.status(400).json({ message: `Each day must have day, openTime, and closeTime. Problem on ${daysOfWeek[i]}` });
        }
        if (dayObj.day !== daysOfWeek[i]) {
          return res.status(400).json({ message: `Schedule days must be in order: ${daysOfWeek.join(', ')}` });
        }
      }
    }

    // Set createdBy from authenticated user
    const createdBy = req.user && req.user._id ? req.user._id : (req.user ? req.user : undefined);
    if (!createdBy) {
      return res.status(400).json({ message: 'createdBy is required and must be set by authentication middleware.' });
    }

    const newGame = new Game({
      gameName,
      gameNameHindi,
      schedule: gameSchedule,
      isActive,
      description,
      createdBy
    });

    const savedGame = await newGame.save();
    res.status(201).json(savedGame);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update game
router.put('/:id', async (req, res) => {
  try {
    const { gameName, gameNameHindi, schedule, isActive, description } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    if (gameName) game.gameName = gameName;
    if (gameNameHindi) game.gameNameHindi = gameNameHindi;
    if (Array.isArray(schedule) && schedule.length === 7) game.schedule = schedule;
    if (typeof isActive === 'boolean') game.isActive = isActive;
    if (description) game.description = description;
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle game status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    game.isActive = !game.isActive;
    const updatedGame = await game.save();
    
    res.json({
      message: `Game ${updatedGame.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: updatedGame.isActive
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete game
router.delete('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    await game.remove();
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
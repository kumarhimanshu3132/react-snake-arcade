const express = require('express');
const Score = require('../models/Score'); 
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// 1. SAVE SCORE: Naya high score save karne ke liye
router.post('/save', authMiddleware, async (req, res) => {
    try {
        const { playerName, score, playTime, gameType } = req.body;
        
        if (score === undefined || !playTime || !gameType || !playerName) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newScore = new Score({
            userId: req.user.userId,
            playerName,
            score,
            playTime,
            gameType
        });

        await newScore.save();
        res.status(201).json({ message: "High Score Saved Successfully!", data: newScore });

    } catch (error) {
        console.error("Score Save Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. GET ALL SCORES: Specific user's scores for dashboard
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const userScores = await Score.find({ userId: req.user.userId });
        res.status(200).json(userScores);
    } catch (error) {
        console.error("Fetch All Scores Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 3. GET TOP SCORES: Specific user's top scores
router.get('/top', authMiddleware, async (req, res) => {
    try {
        const topScores = await Score.find({ userId: req.user.userId, gameType: "Classical Snake" })
                                     .sort({ score: -1 })
                                     .limit(10);
        
        res.status(200).json(topScores);
    } catch (error) {
        console.error("Fetch Score Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 4. GET LEADERBOARD BY MODE
router.get('/leaderboard/:mode', authMiddleware, async (req, res) => {
    try {
        const { mode } = req.params;
        
        const leaderboard = await Score.find({ gameType: mode })
                                       .sort({ score: -1 })
                                       .limit(100);
                                       
        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("Fetch Leaderboard Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
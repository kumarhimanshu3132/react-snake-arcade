const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    playerName: { 
        type: String, 
        required: true 
    },
    score: { 
        type: Number, 
        required: true 
    },
    playTime: { 
        type: String, 
        required: true // Yeh 'HH:MM:SS' format mein time save karega
    },
    gameType: { 
        type: String, 
        default: "Classical Snake" // Kyunki high score sirf isi game mein hai
    }
}, { timestamps: true });

module.exports = mongoose.model('Score', scoreSchema);
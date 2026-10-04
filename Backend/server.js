require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const scoreRoutes = require("./routes/score");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// Test Route
app.get("/", (req, res) => {
  res.send("Snake & Ladder Backend is Running!");
});

/*
app.get('/create-db', async (req, res) => {
    try {
        const testUser = new User({
            name: "Test Player",
            email: "test@game.com",
            password: "testpassword123"
        });
        await testUser.save(); 
        res.send("✅ Dummy User Saved & Database Created in Atlas!");
    } catch (error) {
        res.send("Error: " + error.message);
    }
});
*/

app.use("/api/auth", authRoutes);
app.use("/api/score", scoreRoutes);

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

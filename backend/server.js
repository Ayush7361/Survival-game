require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

const scoreSchema = new mongoose.Schema({
  name: String,
  score: Number
});

const Score = mongoose.model('Score', scoreSchema);

app.get('/api/leaderboard', async (req, res) => {
  const scores = await Score.find().sort({ score: -1 }).limit(10);
  res.json(scores);
});

app.post('/api/leaderboard', async (req, res) => {
  const name = req.body.name;
  const score = req.body.score;

  if (!name || score === undefined) {
    res.status(400).json({ message: "name and score are required" });
    return;
  }

  const newScore = new Score({ name: name, score: score });
  await newScore.save();
  res.json({ message: "score added" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("leaderboard server running on port " + PORT);
});
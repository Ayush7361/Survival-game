const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let scores = [];

// GET all scores, sorted highest survival time first
app.get('/api/leaderboard', (req, res) => {
  let sorted = scores.slice();
  sorted.sort(function (a, b) {
    return b.score - a.score;
  });
  res.json(sorted);
});

// POST a new score
app.post('/api/leaderboard', (req, res) => {
  const name = req.body.name;
  const score = req.body.score;

  if (!name || score === undefined) {
    res.status(400).json({ message: "name and score are required" });
    return;
  }

  scores.push({ name: name, score: score });
  res.json({ message: "score added" });
});

app.listen(3000, () => {
  console.log("leaderboard server running on port 3000");
});
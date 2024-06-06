const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);
// console.log(process.env.MONGO_URL)

//Schema User & Exercise

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Schema End

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Part1
app.post('/api/users', async (req,res)=>{
  console.log(req.body.username)
  const username = {username: req.body.username};
  const user = await User.create(username)
  res.json({username: user.username, _id: user._id})
})
app.get('/api/users',async (req,res)=>{
  const users = await User.find();
  res.json(users)
})
// Part2
app.post('/api/users/:_id/exercises', async (req,res)=>{
    try{
      const { description, duration, date } = req.body;
      const userId = req.params._id;

      const exercise = new Exercise({
        userId,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      });
      await exercise.save();
      // Fetch the user associated with the exercise
      const user = await User.findById(userId);

      res.json({
        username: user.username,
        _id: userId,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      })
      
    }catch(err){
      res.json({error: "invalid id"})
    }
})

// logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const userId = req.params._id;
    const user = await User.findById(userId);

    if (!user) {
      res.send("Could not find user");
      return;
    }

    let dateObj = {};
    if (from) {
      dateObj["$gte"] = new Date(from);
    }
    if (to) {
      dateObj["$lte"] = new Date(to);
    }

    let filter = { userId: userId };
    if (from || to) {
      filter.date = dateObj;
    }

    const exercises = await Exercise.find(filter).limit(parseInt(limit) || 500);

    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString() // Use the dateString format
    }));

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});














const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

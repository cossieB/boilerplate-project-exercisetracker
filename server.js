const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const MONGO_URI = process.env.MONGO_URI

const { Schema } = mongoose

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
}, { versionKey: false })

const User = mongoose.model("User", userSchema)

app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

async function connectToMongo() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log("Connected To DB")
    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log('Your app is listening on port ' + listener.address().port)
    })
  }
  catch (err) {
    console.log(err)
  }
}
connectToMongo()

app.post('/api/users', async (req, res) => {
  //console.log(req.body)
  let { username } = req.body
  let user = new User({ username })
  await user.save()
  let { _id } = user
  res.json({ username, _id })
})

app.get('/api/users', async (req, res) => {
  try {
    let lst = await User.find();
		lst = lst.map(item => {
			let {username, _id} = item
			return {_id, username}
		})
    res.json(lst)
  }
  catch(e) {
    console.log(e);
    res.send("Something went wrong")
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  console.log(req.body)
  let { description, duration, date } = req.body
  let _id = req.body[":_id"]
  if (!duration || Number.isNaN(Number(duration))) {
    return res.send("Invalid Duration")
  }
  if (!description) {
    res.send("Description required")
  }
  let dateTmp;
  date ? dateTmp = new Date(date) : dateTmp = new Date()
  if (dateTmp == 'Invalid Date') {
    return res.send("Invalid Date")
  }
  date = dateTmp.toDateString()
  
  try {
    var user = await User.findById(_id)
		let obj = {description, duration, date}
    user.log.push(obj)
    var {username} = user
    await user.save()
  }
  catch(e) {
    console.log(e);
    return res.send("Something went wrong")
  }
  res.json({_id, username ,date, duration, description})
})

app.get("/api/users/:id/logs", async (req, res) => {
  let id = req.params.id; 
	let {from: from, to, limit} = req.query; 
  let fromDate; let toDate;
  from ? fromDate = new Date(from) : fromDate = new Date(0)
  to ? toDate= new Date(to) : toDate = new Date()
  let user = await User.findById(id); console.log(user)
	let {_id, username, log} = user
  log = log.filter(item => {
    return (item.date >= fromDate && item.date <= toDate)
  }).slice(0, limit)
	log = log.map(item => {
		let {description, duration, date} = item;
		return {description, duration, date: date.toDateString()}
	})
  let count = log.length
	res.json({_id, count, username, log})
})
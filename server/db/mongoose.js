const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/TodoApp')
mongoose.Promise = global.Promise

mongoose.exports = { mongoose }

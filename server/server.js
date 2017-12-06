const express = require('express')
const bodyParser = require('body-parser')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

const { mongoose } = require('./db/mongoose')
const { Todo } = require('./models/todo')
const { User } = require('./models/user')
const { authenticate } = require('./middleware/authentication')

const app = express()
app.use(bodyParser.json())

const port = process.env.PORT || 3000

app.post('/todos', (req, res) => {
    const todo = new Todo(req.body)
    todo.save().then(
        doc => res.send(doc),
        err => res.status(400).send(err))
})

app.get('/todos', (req, res) => {
    Todo.find().then(

        todos => res.send({ todos }),
        err => res.status(400).send(err))
})

app.get('/todos/:id', (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
        return res.status(404).send({ msg: 'Wrong id' })
    }

    Todo.findById(req.params.id)
        .then(todo => {
            if (!todo) {
                return res.status(404).send()
            }
            res.send({ todo })
        })
        .catch(err =>
            res.status(400).send(err))
})

app.post('/users', (req, res) => {
    const user = new User(_.pick(req.body, ['email', 'password']))
    user.save()
        .then(() =>
            user.generateAuthToken())
        .then(token => {
            res.header('x-auth', token).send(user.toJSON())
        })
        .catch(err =>
            res.status(400).send(err))
})

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user)
})

app.listen(port, () => {
    console.log(`Started on port ${port}`)
})

module.exports = { app }
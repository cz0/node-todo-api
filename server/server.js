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

app.post('/todos', authenticate, (req, res) => {
    const todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    })
    todo.save().then(
        doc => res.send(doc),
        err => res.status(400).send(err))
})

app.get('/todos', authenticate, (req, res) => {
    Todo.find({
        _creator: req.user._id
    }).then(
        todos => res.send({ todos }),
        err => res.status(400).send(err))
})

app.get('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id
    if (!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then(todo => {
        if (!todo) {
            return res.status(404).send()
        }
        res.send({ todo })
    })
        .catch(err =>
            res.status(400).send(err))
})

app.delete('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id
    if (!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id
    }).then(todo => {
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

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password'])

    User.findByCredentials(body.email, body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user)
        })
    }).catch((e) => {
        res.status(400).send()
    })
})

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send()
    }, () => {
        res.status(400).send()
    })
})

app.listen(port, () => {
    console.log(`Started on port ${port}`)
})

module.exports = { app }
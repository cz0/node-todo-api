const { ObjectID } = require('mongodb')
const jwt = require('jsonwebtoken')

const { Todo } = require('../../models/todo')
const { User } = require('../../models/user')


const userOneId = new ObjectID()
const userTwoId = new ObjectID()
const users = [{
    _id: userOneId,
    email: 'user1@host.com',
    password: 'user1password',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: userOneId, access: 'auth' }, 'heslo').toString()
    }]
}, {
    _id: userTwoId,
    email: 'user2@host.com',
    password: 'user2password'
}]

const todos = [{
    _id: new ObjectID(),
    text: 'First test todo'
}, {
    _id: new ObjectID(),
    text: 'Second test todo'
}]

const populateTodos = (done) => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos)
    }).then(() => done())
}

const populateUsers = (done) => {
    User.remove({}).then(() => {
        const userOne = new User(users[0]).save()
        const userTwo = new User(users[1]).save()
        return Promise.all([userOne, userTwo])
    }).then((res) => {
        done()
    })
}

module.exports = {
    todos,
    populateTodos,
    users,
    populateUsers
}
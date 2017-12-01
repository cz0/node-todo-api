const request = require('supertest')
const { ObjectID } = require('mongodb')

const { app } = require('../server')
const { Todo } = require('../models/todo')

// beforeEach(
//     done => Todo.remove({}).then(() => done())
// )

const initTodos = [
    { 
        _id: new ObjectID(),
        text: 'First test todo' 
    },
    { 
        _id: new ObjectID(),
        text: 'Second test todo' 
    }
]

beforeEach(done => {
    Todo.remove({})
        .then(() => {
            return Todo.insertMany(initTodos)
        })
        .then(() => done())
})

describe('POST /todos', () => {
    test('should create a new todo', (done) => {
        const text = 'Test todo'

        request(app)
            .post('/todos')
            .send({ text })
            .expect(200)
            .expect(res => expect(res.body.text).toBe(text))
            .end((err, res) => {
                if (err) {
                    return done(err)
                }

                Todo.find({ text }).then(todos => {
                    expect(todos.length).toBe(1)
                    expect(todos[todos.length - 1].text).toBe(text)
                    done()
                }).catch(e => done(e))
            })
    })

    test('should not create an invalid todo', (done) => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }

                Todo.find({}).then(todos => {
                    expect(todos.length).toBe(2)
                    done()
                }).catch(e => done(e))
            })
    })
})

describe('GET /todos', () => {
    test('should get all todos', (done) => {
        const text = 'Test todo'

        request(app)
            .get('/todos')
            .expect(200)
            .expect(res => expect(res.body.todos.length).toBe(2))
            .end(done)
    })
})

describe('GET /todos/:id', () => {
    test('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${initTodos[0]._id}`)
            .expect(200)
            .expect(res => expect(res.body.todo.text).toBe(initTodos[0].text))
            .end(done)

    })    
    test('should return 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID()}`)
            .expect(404)
            .end(done)

    })
})
const request = require('supertest')
const { ObjectID } = require('mongodb')

const { app } = require('../server')
const { Todo } = require('../models/todo')
const { User } = require('../models/user')
const { todos, populateTodos, users, populateUsers } = require('./seed/seed')


beforeEach(populateUsers)
beforeEach(populateTodos)

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        const text = 'Test todo'

        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
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

    it('should not create an invalid todo', (done) => {
        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
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
    it('should get all todos', (done) => {
        const text = 'Test todo'

        request(app)
            .get('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.todos.length).toBe(1))
            .end(done)
    })
})

describe('GET /todos/:id', () => {
    it('should return todo by id', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.todo.text).toBe(todos[0].text))
            .end(done)

    })
    
    it('should not return a todo doc created by other user', (done) => {
        request(app)
            .get(`/todos/${todos[1]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)

    })
    
    it('should return 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)

    })
})

describe('DELETE /todos/:id', () => {
    it('should delete todo by id', (done) => {
        request(app)
            .delete(`/todos/${todos[0]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.todo.text).toBe(todos[0].text))
            .end((err, res) => {
                if (err) {
                    return done(err)
                }

                Todo.findById(todos[0]._id).then((todo) => {
                    expect(todo).toBeFalsy()
                    done()
                }).catch((e) => done(e))
            })

    })
    
    it('should not delete a todo created by other user', (done) => {
        request(app)
            .delete(`/todos/${todos[1]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }

                Todo.findById(todos[1]._id).then((todo) => {
                    expect(todo).toBeTruthy()
                    done()
                }).catch((e) => done(e))
            })

    })
    
    it('should return 404 if todo not found', (done) => {
        request(app)
            .delete(`/todos/${new ObjectID()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })
})

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString())
                expect(res.body.email).toBe(users[0].email)
            })
            .end(done)
    })

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({})
            })
            .end(done)
    })
})

describe('POST /users', () => {
    it('should create a user', (done) => {
        const email = 'example@host.com'
        const password = 'hesloparol'

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy()
                expect(res.body._id).toBeTruthy()
                expect(res.body.email).toBe(email)
            })
            .end((err) => {
                if (err) {
                    return done(err)
                }

                User.findOne({ email }).then((user) => {
                    expect(user).toBeTruthy()
                    done()
                })
            })
    })

    it('should return validation errors if request invalid', (done) => {
        const email = 'invalid'
        const password = 'short'

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(400)
            .end(done)
    })

    it('should not create a user if email in use', (done) => {
        const { email, password } = users[0]

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(400)
            .end(done)
    })
})

describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy()
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens[1].access).toBe('auth')
                    expect(user.tokens[1].token).toBe(res.headers['x-auth'])
                    done()
                }).catch((e) => done(e))
            })

    })

    it('should reject invalid login', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password + '1'
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeFalsy()
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(1)
                    done()
                }).catch((e) => done(e))
            })
    })
})

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }

                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0)
                    done()
                }).catch((e) => done(e))
            })
    })
})
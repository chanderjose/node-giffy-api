const supertest = require('supertest')
const { app, server } = require('../index')

const api = supertest(app)
const { loginWithDefaultUsername, listFavs } = require('./apiHelper')

test('page not found returns 404 status code', async () => {
    await api
        .get('/api/not_exists')
        .expect(404)
})

describe('public endpoints return 200 status code', async() => {
    test('index endpoint returns json', async () => {
        await api
            .get('/api/')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })
})

describe('restricted pages return 401 status code', function() {
    test('GET /api/favs is restricted', async () => {
        await api
            .get('/api/favs')
            .expect(401)
    })

    test('POST /api/favs/1 is restricted', async () => {
        await api
            .post('/api/favs/1')
            .expect(401)
    })

    test('DELETE /api/favs/1 is restricted', async () => {
        await api
            .delete('/api/favs/1')
            .expect(401)
    })
})

describe('check POST /api/login endpoint', function() {
    test('returns 401 when username/password are incorrect', async () => {
        await api
            .post('/api/login')
            .send({ username: 'admin', password: 'not_the_real_password' })
            .set('Content-Type', 'application/json')
            .expect(401)
    })

    test('check default username/password are admin/admin', async () => {
        const response = await api
            .post('/api/login')
            .send({ username: 'admin', password: 'admin' })
            .set('Content-Type', 'application/json')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('token')
    })
})

describe('check POST /api/register endpoint', function() {
    test('returns 400 status code when username already exists', async () => {
        await api
            .post('/api/register')
            .send({ username: 'admin', password: '123456' })
            .set('Content-Type', 'application/json')
            .expect(400)
    })

    test('returns error response when username is missing', async () => {
        await api
            .post('/api/register')
            .send({ password: '123456' })
            .set('Content-Type', 'application/json')
            .expect(400)
    })

    test('returns error response when password is missing', async () => {
        await api
            .post('/api/register')
            .send({ username: 'user1' })
            .set('Content-Type', 'application/json')
            .expect(400)
    })

    test('returns success response when username and password are OK', async () => {
        await api
            .post('/api/register')
            .send({ username: 'user1', password: '123456' })
            .set('Content-Type', 'application/json')
            .expect(200)
    })

    test('created user can login successfully', async () => {
        const response = await api
            .post('/api/login')
            .send({ username: 'admin', password: 'admin' })
            .set('Content-Type', 'application/json')
            .expect(200)

        expect(response.body).toHaveProperty('token')
        expect(response.body.token.length).toBeGreaterThan(0)
    })
})

describe('check GET /api/favs endpoint', function() {
    test('user can list favs', async () => {
        const loginResponse = await loginWithDefaultUsername(api)

        const { token } = loginResponse.body

        const response = await api
            .get('/api/favs')
            .set('Authorization', token)
            .set('Content-Type', 'application/json')
            .expect(200)

        expect(response.body).toHaveProperty('favs')
    })
})

describe('check POST /api/favs endpoint', function() {
    test('user can add a new fav', async () => {
        const loginResponse = await loginWithDefaultUsername(api)
        const { token } = loginResponse.body

        const listBeforeResponse = await listFavs(api, token)
        const { favs: favsBefore } = listBeforeResponse.body

        const newFav = '1'

        await api
            .post(`/api/favs/${newFav}`)
            .set('Authorization', token)
            .set('Content-Type', 'application/json')
            .expect(200)

        const listAfterResponse = await listFavs(api, token)

        const { favs: favsAfter } = listAfterResponse.body

        expect(favsAfter).toHaveLength(favsBefore.length + 1)
        expect(favsAfter).toContain(newFav)
    })
})

describe('check DELETE /api/favs endpoint', function() {
    test('user can add a new fav', async () => {
        const loginResponse = await loginWithDefaultUsername(api)
        const { token } = loginResponse.body

        const deleteFav = '1'

        await api
            .post(`/api/favs/${deleteFav}`)
            .set('Authorization', token)
            .set('Content-Type', 'application/json')

        const listBeforeResponse = await listFavs(api, token)
        const { favs: favsBefore } = listBeforeResponse.body

        await api
            .delete(`/api/favs/${deleteFav}`)
            .set('Authorization', token)
            .set('Content-Type', 'application/json')
            .expect(200)

        const listAfterResponse = await listFavs(api, token)

        const { favs: favsAfter } = listAfterResponse.body

        expect(favsAfter).toHaveLength(favsBefore.length - 1)
        expect(favsAfter).not.toContain(deleteFav)
    })
})

afterAll(() => {
    server.close()
})
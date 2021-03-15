async function loginWithDefaultUsername(api) {
    const response = await api
        .post('/api/login')
        .send({ username: 'admin', password: 'admin' })

    return response
}

async function listFavs(api, token) {
    const response = await api
            .get('/api/favs')
            .set('Authorization', token)
            .set('Content-Type', 'application/json')

    return response
}

module.exports = {
    loginWithDefaultUsername,
    listFavs
}
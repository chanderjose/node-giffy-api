const users = [{username: 'admin', password: '$2b$07$jCAY6NybbppTAEM14FwwOOu2xvV0T6yh/NB7rFrsb2yywbTHg/k4u', favs: []}]

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

exports.index = function(request, response) {
    response.status(200).json({ message: 'Welcome' })
}

exports.login = function(request, response) {
    // Get parameters from request body
    const { username, password } = request.body

    // Check if user exist and compare password hash
    let user = getUserByUsername(username)
    if(user && !bcrypt.compareSync(password, user.password)) {
        user = null
    }
    if (user === null || user === undefined) {
        throwError({ status: 401, message: 'Wrong credentials' })
    }

    // Define the payload to store in JWT
    var tokenData = {
        username: username
    }

    // Get the secret key from app object
    const secretKey = request.app.get('secretKey')

    // Create JWT
    var jwtToken = jwt.sign(tokenData, secretKey, {
        expiresIn: '7d'
    })

    response.status(200).json({ token: jwtToken })
}

exports.register = function(request, response) {
    // Get parameters from request body
    const { username, password } = request.body

    if(!username) {
        throwError({ status: 400, message: 'username is required' })
    }

    if(!password) {
        throwError({ status: 400, message: 'password is required' })
    }

    // Check if the username already exists
    const existingUser = getUserByUsername(username)
    if (existingUser) {
        throwError({ status: 400, message: 'username already exists' })
    }

    // Create hash for the password
    const saltRounds = 7
    const salt = bcrypt.genSaltSync(saltRounds)
    const hash = bcrypt.hashSync(password, salt)

    // Add the new user
    const newUser = { username, password: hash, favs: [] }
    users.push(newUser)

    response.status(200).send()
}

exports.listFavs = function(request, response) {
    // Get logged username
    const username = request.headers.username

    // Check if the logged user exists
    const user = getUserByUsername(username)
    if (user === undefined) {
        throwError({ status: 404, message: 'username not found' })
    }

    response.status(200).json({ favs: user.favs })
}

exports.createFav = function(request, response) {
    // Get logged username
    const username = request.headers.username

    // Check if the logged user exists
    const user = getUserByUsername(username)
    if (user === undefined) {
        throwError({ status: 404, message: 'username not found' })
    }

    const itemToAdd = request.params.id

    // If the favorite id doesnt exist then add it
    const fav = user.favs.find(fav => fav === itemToAdd)
    if(fav === undefined) {
        user.favs.push(itemToAdd)
    }

    response.status(200).send()
}

exports.deleteFav = function(request, response, next) {
    // Get logged username
    const username = request.headers.username

    // Check if the logged user exists
    const user = getUserByUsername(username)
    if (user === undefined) {
        throwError({status: 404, message: 'username not found'})
    }

    const itemToRemove = request.params.id

    // Check if the favorite exists
    const fav = user.favs.find(fav => fav === itemToRemove)
    if(fav === undefined) {
        throwError({status: 404, message: 'favorite not found'})
    }

    // Remove the favorite from favs list
    user.favs = user.favs.filter(fav => fav !== itemToRemove)

    response.status(200).send()
}

/**
 * Get user from users by username
 * @param username
 */
function getUserByUsername(username) {
    return users.find(user => user.username === username)
}

/**
 * Function helper to throw an error
 * @param { status, message }
 */
function throwError({ status, message }) {
    let error = new Error(message)
    error.status = status

    throw error
}
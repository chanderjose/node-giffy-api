var express = require('express');
var router = express.Router();
var controller = require('./controller');
var jwt = require('jsonwebtoken');

// Create middleware to check authentication
const authMiddleware = function(request, response, next) {
    var token = request.headers['authorization']
    if(!token) {
        response.status(401).send({message: "Token cannot be empty"});
        return;
    }

    const secretKey = request.app.get('secretKey')

    jwt.verify(token, secretKey, function(err, decodedTokenData) {
        if (err) {
            response.status(401).send({ message: 'Token no valid' });
        } else {
            // We pass the logged user as header 'username'
            request.headers.username = decodedTokenData.username;

            // Proccess next actions
            next()
        }
    });
}

// Public routes
router.get('/', controller.index);
router.post('/login', controller.login);
router.post('/register', controller.register);

// Authenticated routes
router.get('/favs', authMiddleware, controller.listFavs);
router.post('/favs/:id', authMiddleware, controller.createFav);
router.delete('/favs/:id', authMiddleware, controller.deleteFav);

module.exports = router;
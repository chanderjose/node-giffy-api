const express = require('express')
var cors = require('cors')

const app = express()

app.set('secretKey', '<<<SUPER-SECRET-KEY>>>');

app.disable('x-powered-by')

app.use(cors())
app.use(express.urlencoded({extended: false}))
app.use(express.json())

// Define application endpoints
var apiRoutes = require('./apiRoutes');
app.use('/api', apiRoutes);

// Handle not found URLs
app.use(function(request, response, next) {
    let err = new Error('Not Found')
    err.status = 404
    next(err)
})

// Define middleware to handle errors
app.use(function(err, request, response, next) {
    if (err.status >= 400 && err.status <= 499) {
        response.status(err.status).json({ message: err.message });
    } else {
        console.log(err.message)
        response.status(500).json({ message: 'Internal Error' });
    }
});

const DEFAULT_PORT = 8080
const server = app.listen(DEFAULT_PORT, () => {
    console.log(`Server running on port ${DEFAULT_PORT}`)
})

module.exports = { app, server }
require('dotenv').config();
const express = require('express');
require('./src/db/mongoose');

const usersRoutes = require('./src/routes/users-routes');
// const productsRoutes = require('./src/routes/products-routes');
const HttpError = require('./src/util/errors/http-error');

const app = express();

// CORS fix
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    next();
})

// json parsing
app.use(express.json());

// routes
app.use('/', usersRoutes);
// app.use('/products', productsRoutes);

// unsupported routes error
app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
});

// error handler
app.use((error, req, res, next) => {
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!'})
});

// server listen
app.listen(process.env.PORT);
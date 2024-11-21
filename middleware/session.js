const session = require("express-session");

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'secretstring',
    resave: false,
    saveUninitialized: false,
    cookie: {},
});

module.exports = sessionMiddleware;
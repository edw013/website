"use strict";

const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");

var jwt = require('express-jwt');
var jwks = require('jwks-rsa');

const dbUrl = process.env.MONGODB_URI;
const MongoClient = mongodb.MongoClient;
const client = new MongoClient(dbUrl, { useNewUrlParser: true });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ credentials: true, origin: true }));

const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://dev-2ajd1d4x.auth0.com/.well-known/jwks.json'
  }),
  audience: 'https://ethanwang-backend.herokuapp.com/',
  issuer: 'https://dev-2ajd1d4x.auth0.com/',
  algorithms: ['RS256']
});

app.use(jwtCheck);

app.get('/authorized', function (req, res) {
  res.send('Secured Resource');
});

app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({message:'Missing or invalid token'});
    }
});

client.connect(err => {
    if (err) {
        console.error(err);

        process.exit(1);
    }

    console.log("Connected to DB.");

    const db = client.db();
    app.locals.db = db;

    app.listen(port, () => console.log(`App running on ${port}.`));
});

const posts = require("./src/routes/posts");
app.use("/posts", posts);
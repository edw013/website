"use strict";

const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");

const jwt = require('express-jwt');
const jwks = require('jwks-rsa');

const dbUrl = process.env.MONGODB_URI;
const MongoClient = mongodb.MongoClient;
const client = new MongoClient(dbUrl, { useNewUrlParser: true });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ credentials: true, origin: true }));

/*const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://dev-2ajd1d4x.auth0.com/.well-known/jwks.json'
  }),
  audience: 'https://ethanwang-backend.herokuapp.com/posts/new',
  issuer: 'https://dev-2ajd1d4x.auth0.com/',
  algorithms: ['RS256']
});

app.use(jwtCheck);*/

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            message: "Missing or invalid token."
        });
    }
});

const guard = (req, res, next) => {
    if (req.path === "/posts/new") {
        permissions = "admin";
        if (req.user.scope.includes(permissions)) {
            next();
        }
        else {
            res.status(403).json({
                message: "Forbidden."
            });
        }
    }
}

app.use(guard);

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
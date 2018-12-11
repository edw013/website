"use strict";

const express = require("express");
const mongodb = require("mongodb");

const dbUrl = process.env.MONGODB_URI;
const MongoClient = mongodb.MongoClient;
const client = new MongoClient(dbUrl, { useNewUrlParser: true });

const app = express();
const port = process.env.PORT || 3000;

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
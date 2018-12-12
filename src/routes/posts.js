"use strict";

const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const validator = require("validator");

/**
 * List all posts. Default order by date.
 * 
 * Request query parameters:
 *   sortBy: post odering
 * 
 * Response codes:
 *   200: success
 */
router.get("/", async (req, res) => {
    let find = {};
    let project = {
        _id: 0,
        title: 1,
        body: 1,
        date: 1,
        numComments: {
            $size: "$comments"
        }
    };
    let sort = {
        date: -1
    };

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");
    const posts = await postCollection.aggregate([
        { $match: find },
        { $project: project},
        { $sort: sort }
    ]).toArray();

    res.status(200).send({ posts: posts });
});

/**
 * Create a new post.
 * 
 * Request body JSON:
 *   title: the title of the post
 *   body: the body of the post
 * 
 * Response codes:
 *   400: missing title or body
 *   500: error inserting into DB
 *   201: created
 */
router.post("/new", jsonParser, async (req, res) => {
    let title = validator.escape(req.body["title"]);
    let body = validator.escape(req.body["body"]);
    
    if (!title || !body) {
        res.sendStatus(400);

        return;
    }

    let date = new Date();

    let data = {
        title: title,
        body: body,
        date: date,
        comments: []
    }

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");
    postCollection.insertOne(data, err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);

            return;
        }

        res.sendStatus(201);
    });
});

module.exports = router;
"use strict";

const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const validator = require("validator");
const ObjectId = require("mongodb").ObjectID;

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
    const find = {};
    const project = {
        _id: 1,
        title: 1,
        body: 1,
        date: 1,
        numComments: {
            $size: "$comments"
        }
    };
    const sort = {
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
 * Get a specific post.
 * 
 * Request parameters:
 *   id: the object ID within Mongo
 * 
 * Response codes:
 *   400: invalid id format
 *   404: not found
 *   200: success
 */
router.get("/:id", async (req, res) => {
    const postId = validator.escape(req.params["id"]);

    let oid;
    try {
        oid = new ObjectId(postId);
    }
    catch (err) {
        console.error(err);

        return res.sendStatus(400)
    }

    const find = {
        _id: oid
    };

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");
    const post = await postCollection.findOne(find);

    if (post === null) {
        return res.sendStatus(404);
    }

    res.status(200).send(post);
})

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
    const title = validator.escape(req.body["title"]);
    const body = validator.escape(req.body["body"]);
    
    if (!title || !body) {
        res.sendStatus(400);

        return;
    }

    const date = new Date();

    const data = {
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
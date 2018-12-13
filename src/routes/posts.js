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
    const sort = {
        date: -1
    };

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");
    const posts = await postCollection.find(find).sort(sort).toArray();

    res.status(200).send({ posts: posts });
});

/**
 * Get a specific post.
 * 
 * Request parameters:
 *   id: the object ID within Mongo
 * 
 * Response codes:
 *   200: success
 *   400: invalid id format
 *   404: not found
 */
router.get("/:id", async (req, res) => {
    const postId = validator.escape(req.params["id"]);

    const oid = createObjectId(postId);

    if (oid === null) {
        return res.sendStatus(400);
    }

    const find = {
        _id: oid
    };

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");
    const post = await postCollection.findOne(find);

    // does it exist?
    if (post === null) {
        return res.sendStatus(404);
    }

    res.status(200).send(post);
});

/**
 * Get comments on a specific post.
 * 
 * Request parameters:
 *   id: the object ID within Mongo
 * 
 * Response codes:
 *   200: success 
 */
router.get("/:id/comments", async (req, res) => {
    const postId = validator.escape(req.params["id"]);

    // check valid oid, we don't really care if it doesn't exist as we'll
    // just return [] if it doesn't
    const oid = createObjectId(postId);
    if (oid === null) {
        return res.sendStatus(400);
    }

    const find = {
        pid: oid
    };
    const sort = {
        date: -1
    };

    const db = req.app.locals.db;
    const commentCollection = db.collection("comments");
    const comments = await commentCollection.find(find).sort(sort).toArray();
    
    res.status(200).send({ comments: comments });
});

/**
 * Create a new comment on a post.
 * 
 * Request parameters:
 *   id: the object ID of the post
 * 
 * Request body JSON:
 *   body: the body of the comment
 * 
 * Response codes:
 *   201: created
 *   400: missing body
 *   404: post does not exist
 *   500: error inserting into DB
 */
router.post("/:id/comments/new", jsonParser, async (req, res) => {
    const postId = validator.escape(req.params["id"]);

    // check valid oid
    const oid = createObjectId(postId);
    if (oid === null) {
        return res.sendStatus(400);
    }

    const findPost = {
        _id: oid
    };

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");

    // check if post exists first
    const post = await postCollection.findOne(findPost);

    if (post === null) {
        return res.sendStatus(404);
    }

    // get comment body
    const body = validator.escape(req.body["body"]);
    
    if (!body) {
        res.sendStatus(400);

        return;
    }

    const date = new Date();

    const data = {
        pid: oid,
        date: date,
        lastUpdate: date,
        body: body
    };

    const commentCollection = db.collection("comments");
    commentCollection.insertOne(data, async err => {
        if (err) {
            console.error(err);

            return res.sendStatus(500);
        }

        const inc = {
            $inc: { numComments: 1 }
        };
    
        // increment numComments
        await postCollection.updateOne(findPost, inc);

        res.sendStatus(201);
    });
});

/**
 * Create a new post.
 * 
 * Request body JSON:
 *   title: the title of the post
 *   body: the body of the post
 * 
 * Response codes:
 *   201: created
 *   400: missing title or body
 *   500: error inserting into DB
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
        lastUpdate: date,
        numComments: 0
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

const createObjectId = id => {
    let oid;
    try {
        oid = new ObjectId(id);
    }
    catch (err) {
        console.error(err);

        oid = null;
    }

    return oid;
}

module.exports = router;
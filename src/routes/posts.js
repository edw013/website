"use strict";

const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const validator = require("validator");
const ObjectId = require("mongodb").ObjectID;

const SERVER_ERROR = {
    message: "Server error."
};

const MALFORMED_REQUEST = {
    message: "Invalid request."
};

const NOT_FOUND = {
    message: "Resource not found."
};

const CREATED = {
    message: "Created."
};

const jwtCheck = jwt({
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

/**
 * List all posts. Default order by date.
 * 
 * Request query parameters:
 *   sortBy: post odering
 * 
 * Response codes:
 *   200: success
 *   500: server error
 */
router.get("/", async (req, res) => {
    const find = {};
    const sort = {
        date: -1
    };

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");
    try {
        const posts = await postCollection.find(find).sort(sort).toArray();

        res.status(200).send({ posts: posts });
    }
    catch (err) {
        console.error(err);

        res.status(500).send(SERVER_ERROR);
    }
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
 *   500: server error
 */
router.get("/:id", (req, res) => {
    const postId = validator.escape(req.params["id"]);

    const oid = createObjectId(postId);

    if (oid === null) {
        return res.status(400).send(MALFORMED_REQUEST);
    }

    const find = {
        _id: oid
    };

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");
    postCollection.findOne(find, (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).send(SERVER_ERROR);
        }

        if (result === null) {
            return res.status(404).send(NOT_FOUND);
        }

        res.status(200).send(result);
    });
});

/**
 * Get comments on a specific post.
 * 
 * Request parameters:
 *   id: the object ID within Mongo
 * 
 * Response codes:
 *   200: success
 *   500: server error
 */
/* router.get("/:id/comments", async (req, res) => {
    const postId = validator.escape(req.params["id"]);

    // check valid oid, we don't really care if it doesn't exist as we'll
    // just return [] if it doesn't
    const oid = createObjectId(postId);
    if (oid === null) {
        return res.status(400).send(MALFORMED_REQUEST);
    }

    const find = {
        pid: oid
    };
    const sort = {
        date: -1
    };

    const db = req.app.locals.db;
    const commentCollection = db.collection("comments");
    
    try {
        const comments = await commentCollection.find(find).sort(sort).toArray();
        
        res.status(200).send({ comments: comments });
    }
    catch (err) {
        console.error(err);

        res.status(500).send(SERVER_ERROR);
    }
}); */

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
/* router.post("/:id/comments/new", jsonParser, async (req, res) => {
    const postId = validator.escape(req.params["id"]);

    // check valid oid
    const oid = createObjectId(postId);
    if (oid === null) {
        return res.status(400).send(MALFORMED_REQUEST);
    }

    const findPost = {
        _id: oid
    };

    const db = req.app.locals.db;
    const postCollection = db.collection("posts");

    // check if post exists first
    postCollection.findOne(findPost, (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).send(SERVER_ERROR);
        }

        if (result === null) {
            return res.status(404).send(NOT_FOUND);
        }

        // get comment body
        const body = validator.escape(req.body["body"]);
        
        if (!body) {
            res.status(400).send(MALFORMED_REQUEST);

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
        commentCollection.insertOne(data, err => {
            if (err) {
                console.error(err);

                return res.status(500).send(SERVER_ERROR);
            }

            const inc = {
                $inc: { numComments: 1 }
            };
        
            // increment numComments
            postCollection.updateOne(findPost, inc, err => {
                if (err) {
                    console.error(err);

                    // err this also means comment count will be off dunno what to do
                    return res.status(500).send(SERVER_ERROR);
                }

                res.status(201).send({ id: data._id });
            });
        });
    });
}); */

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
router.post("/new", jwtCheck, jsonParser, async (req, res) => {
    const title = validator.escape(req.body["title"]);
    const body = validator.escape(req.body["body"]);
    
    if (!title || !body) {
        res.status(400).send(MALFORMED_REQUEST);

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
            res.status(500).send(SERVER_ERROR);

            return;
        }

        res.status(201).send({ id: data._id });
    });
});

/**
 * Create an object ID object from an id.
 * 
 * @param {*} id The id to create from
 */
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
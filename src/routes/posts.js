"use strict";

const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

router.get("/", async (req, res) => {
    res.sendStatus(200);
});

module.exports = router;
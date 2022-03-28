const cors = require("cors");
const express = require("express");
const router = require("./routes/hmwa");
const not_found = require("./middleware/not_found");
const error_handler = require("./middleware/error_handler");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/hmwa", router);
app.use(not_found);
app.use(error_handler);

module.exports = app;

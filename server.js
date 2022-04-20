const cors = require("cors");
const express = require("express");
const router = require("./routes/hmwa");
const not_found = require("./middleware/not_found");
const error_handler = require("./middleware/error_handler");
const app = express();

const whitelist = [
	"https://auf-myhealthcheck-dashboard.netlify.app",
	"https://auf-myhealthcheck-survey.netlify.app",
];

app.use(cors({ origin: whitelist }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/api/v1/hmwa", router);
app.use(not_found);
app.use(error_handler);

module.exports = app;

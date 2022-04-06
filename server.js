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

var cors_options_delegate = function (req, callback) {
	var corsOptions;
	if (whitelist.indexOf(req.header("Origin")) !== -1) {
		corsOptions = { origin: true };
	} else {
		corsOptions = { origin: false };
	}
	callback(null, corsOptions);
};

app.use(cors(cors_options_delegate));
app.use(express.json());
app.use("/api/v1/hmwa", router);
app.use(not_found);
app.use(error_handler);

module.exports = app;

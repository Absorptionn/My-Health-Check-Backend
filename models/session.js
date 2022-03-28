const mongoose = require("mongoose");

const session_schema = new mongoose.Schema({
	username: {
		type: String,
		trim: true,
		required: [true, "please provide your username"],
	},
	is_authenticated: {
		type: Boolean,
		default: false,
	},
	date: {
		type: String,
	},
});

module.exports = mongoose.model("Session", session_schema)

const mongoose = require("mongoose");

const user_schema = new mongoose.Schema({
	username: {
		type: String,
		trim: true,
		required: [true, "please provide username"],
		unique: true,
	},
	password: {
		type: String,
		trim: true,
		required: [true, "please provide password"],
	},
});

module.exports = mongoose.model("User", user_schema);

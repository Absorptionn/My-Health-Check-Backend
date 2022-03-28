const mongoose = require("mongoose");

const temp_password_schema = new mongoose.Schema({
	username: {
		type: String,
		required: [true, "please provide a username"],
		unique: true,
	},
	password: {
		type: String,
		required: [true, "please provide a temporary password"],
	},
});

module.exports = mongoose.model("Temporary Password", temp_password_schema);

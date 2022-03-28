const mongoose = require("mongoose");

const assessment_schema = new mongoose.Schema({
	surveyee_id: {
		type: mongoose.Types.ObjectId,
	},
	experiences: {
		type: [String],
		required: true,
	},
	is_exposed: {
		type: Boolean,
		default: false,
	},
	traveled: {
		location: {
			type: String,
		},
		has_traveled: {
			type: Boolean,
			default: false,
		},
	},
	date: {
		type: String,
	},
});

module.exports = mongoose.model("Assessment", assessment_schema);

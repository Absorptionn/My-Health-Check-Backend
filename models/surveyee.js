const mongoose = require("mongoose");
const { validate_email, validate_number } = require("../middleware/validator");

const surveyee_schema = new mongoose.Schema({
	lastname: {
		type: String,
		trim: true,
		required: [true, "please provide a last name"],
	},
	firstname: {
		type: String,
		trim: true,
		required: [true, "please provide a first name"],
	},
	middlename: {
		type: String,
		trim: true,
		required: [true, "please provide a middle name"],
	},
	sex: {
		type: String,
		default: "male",
	},
	age: {
		type: Number,
		default: 12,
		min: 12,
		max: 99,
	},
	contact_number: {
		type: String,
		trim: true,
		validate: [validate_number, "please provide a valid number"],
		required: [true, "please provide your contact number"],
	},
	email: {
		type: String,
		trim: true,
		validate: [validate_email, "please provide a valid email"],
		required: [true, "please provide your email"],
	},
	address: {
		type: String,
		trim: true,
		required: [true, "please provide an address"],
	},
	college: {
		type: String,
		default: "College of Allied Medical Professions",
		enum: [
			"College of Allied Medical Professions",
			"College of Arts and Sciences",
			"College of Business and Accountancy",
			"College of Computer Studies",
			"College of Criminal Justice Education",
			"College of Engineering and Architecture",
			"College of Education",
			"College of Nursing",
			"School of Law",
			"School of Medicine",
			"Graduate School",
		],
	},
	position: {
		type: String,
		default: "employee",
		enum: ["Employee", "Student"],
	},
});

module.exports = mongoose.model("Surveyee", surveyee_schema);

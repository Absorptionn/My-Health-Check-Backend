const mongoose = require("mongoose");

const population_schema = new mongoose.Schema({
	camp: {
		type: Number,
		default: 0,
		required: true,
	},
	cas: {
		type: Number,
		default: 0,
		required: true,
	},
	cba: {
		type: Number,
		default: 0,
		required: true,
	},
	ccs: {
		type: Number,
		default: 0,
		required: true,
	},
	ccje: {
		type: Number,
		default: 0,
		required: true,
	},
	cea: {
		type: Number,
		default: 0,
		required: true,
	},
	coe: {
		type: Number,
		default: 0,
		required: true,
	},
	con: {
		type: Number,
		default: 0,
		required: true,
	},
	sol: {
		type: Number,
		default: 0,
		required: true,
	},
	som: {
		type: Number,
		default: 0,
		required: true,
	},
	gs: {
		type: Number,
		default: 0,
		required: true,
	},
	is: {
		type: Number,
		default: 0,
		required: true,
	},
	np: {
		type: Number,
		default: 0,
		required: true,
	},
});

module.exports = mongoose.model("College Population", population_schema);

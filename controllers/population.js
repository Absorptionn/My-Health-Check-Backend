const async_wrapper = require("../middleware/async");
const CollegePopulation = require("../models/college_population");
const get_college_population = async_wrapper(async (req, res, next) => {
	const population = await CollegePopulation.findOne({}).select("-_id -__v");
	return res.status(200).json(population);
});

const put_college_population = async_wrapper(async (req, res, next) => {
	const result = await CollegePopulation.updateOne({}, req.body, {
		upsert: true,
	});
	return res.status(200).json(result);
});

module.exports = {get_college_population, put_college_population};

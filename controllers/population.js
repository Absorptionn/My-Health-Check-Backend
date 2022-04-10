const async_wrapper = require("../middleware/async");
const StudentPopulation = require("../models/student_population");
const EmployeePopulation = require("../models/employee_population");

const get_population = async_wrapper(async (req, res, next) => {
	const student_population = await StudentPopulation.findOne({}).select(
		"-_id -__v"
	);
	const employee_population = await EmployeePopulation.findOne({}).select(
		"-_id -__v"
	);
	return res.status(200).json({ student_population, employee_population });
});

const put_population = async_wrapper(async (req, res, next) => {
	const { target } = req.query;
	let result = {};
	switch (target) {
		case "student":
			result = await StudentPopulation.updateOne({}, req.body, {
				upsert: true,
			});
			break;
		case "employee":
			result = await EmployeePopulation.updateOne({}, req.body, {
				upsert: true,
			});
			break;
	}

	return res.status(200).json(result);
});

module.exports = { get_population, put_population };

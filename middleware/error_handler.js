const { CustomError } = require("../error/custom-error");

const error_handler = (err, req, res, next) => {
	console.log(err);
	if (err instanceof CustomError) {
		return res.status(err.status_code).json({ message: err.message });
	}
	return res.status(500).json({ message: err._message });
};

module.exports = error_handler;

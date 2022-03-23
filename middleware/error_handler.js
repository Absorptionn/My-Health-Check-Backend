import { CustomError } from "../error/custom-error.js";

const error_handler = (err, req, res, next) => {
	if (err instanceof CustomError) {
		return res.status(err.status_code).json({ message: err.message });
	}
	return res
		.status(500)
		.json({ message: "Something went wrong, please try again." });
};

export default error_handler;

const is_admin = async (req, res, next) => {
	if (res.locals.is_admin) {
		return next();
	}
	return res.status(401).json({ message: "You do not have access" });
};

module.exports = is_admin;

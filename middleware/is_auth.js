const User = require("../models/user");
const Session = require("../models/session");

const is_auth = async (req, res, next) => {
	const { username } = req.query;
	if (username) {
		const user = await User.findOne({ username });
		if (user) {
			const day = new Date().getDate();
			const session = await Session.findOne({ username });
			if (session) {
				const session_date = session.date.split("-");
				if (
					session.is_authenticated &&
					day < session_date[session_date.length - 1]
				) {
					res.locals.is_admin = false;
					if (username === "Admin") {
						res.locals.is_admin = true;
					}
					return next();
				}
			}
		}
	}
	return res.status(401).json({ message: "You have to sign in first" });
};

module.exports = is_auth;

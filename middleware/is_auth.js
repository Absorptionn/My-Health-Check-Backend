const User = require("../models/user");
const Session = require("../models/session");

const is_auth = async (req, res, next) => {
	const { username } = req.query;
	if (username) {
		const user = await User.findOne({ username });
		if (user) {
			const today = new Date().getTime();
			const session = await Session.findOne({ username });
			if (session) {
				if (
					session.is_authenticated &&
					today < session.time + session.expiration
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

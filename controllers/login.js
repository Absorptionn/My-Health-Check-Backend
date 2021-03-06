const async_wrapper = require("../middleware/async");
const User = require("../models/user");
const TemporaryPassword = require("../models/temp_passwords");
const Session = require("../models/session");
const bcrypt = require("bcrypt");

const register = async_wrapper(async (req, res) => {
	let user = req.body.user;
	const hashed_password = await bcrypt.hash(user.password, 12);
	user = {
		username: user.username,
		password: hashed_password,
	};
	await TemporaryPassword.deleteOne({ username: user.username });
	const result = await User.updateOne({ username: user.username }, user, {
		upsert: true,
	});
	return res.status(200).json(result);
});

const login = async_wrapper(async (req, res) => {
	const { username, password } = req.query;

	let user = await User.findOne({ username });
	if (user) {
		let is_match = await bcrypt.compare(password, user.password);
		if (is_match) {
			let today = new Date();
			const session = {
				username: user.username,
				is_authenticated: true,
				time: today.getTime(),
			};
			await Session.updateOne({ username: user.username }, session, {
				upsert: true,
			});
		} else {
			await Session.deleteOne({ username: user.username });
			user = await TemporaryPassword.findOne({ username });
			if (user) {
				is_match = await bcrypt.compare(password, user.password);
				return res.status(200).json({ is_match, is_temporary: true });
			}
		}
		return res.status(200).json({ is_match });
	} else {
		return res.status(200).json(user);
	}
});

const logout = async_wrapper(async (req, res) => {
	const { username } = req.query;
	const result = await Session.deleteOne({ username });
	return res.status(200).json(result);
});

module.exports = { register, login, logout };

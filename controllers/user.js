const async_wrapper = require("../middleware/async");
const User = require("../models/user");
const TemporaryPassword = require("../models/temp_passwords");
const bcrypt = require("bcrypt");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");

const create_user = async_wrapper(async (req, res) => {
	const { username, password } = req.body.user;
	const hashed_password = await bcrypt.hash(password, 12);
	const user = { username, password: hashed_password };
	const result = await User.create(user);
	return res.status(200).json(result);
});

const get_users = async_wrapper(async (req, res) => {
	const results = await User.find().distinct("username");
	results.splice(results.indexOf("Admin"), 1);
	return res.status(200).json(results);
});

const send_mail = async (
	oauth2_client,
	client_id,
	client_secret,
	refresh_token,
	target,
	password
) => {
	try {
		const access_token = oauth2_client.getAccessToken();
		const transport = nodemailer.createTransport({
			service: "gmail",
			auth: {
				type: "OAuth2",
				user: process.env.AUTHORIZED_EMAIL,
				clientId: client_id,
				clientSecret: client_secret,
				refreshToken: refresh_token,
				accessToken: access_token,
			},
		});

		const mail_options = {
			from: `MyHealthCheck <${process.env.AUTHORIZED_EMAIL}>`,
			to: target,
			subject: "Surveyee Assessment Alert",
			text: `Greetings,

MyHealthCheck Admin has issued a user password change to your account.
Here is your temporary password: ${password}

Use the given temporary password next time you will login.`,
			html: `<p style="white-space: pre-line">Greetings,

MyHealthCheck Admin has issued a <b>user password change</b> to your account.
Here is your temporary password: <b>${password}</b>

Use the given temporary password <b>next time you will login</b>.`,
		};

		const results = await transport.sendMail(mail_options);

		return results;
	} catch (error) {
		return error;
	}
};

const update_user = async_wrapper(async (req, res) => {
	const client_id = process.env.CLIENT_ID;
	const client_secret = process.env.CLIENT_SECRET;
	const redirect_uri = "https://developers.google.com/oauthplayground";
	const refresh_token = process.env.REFRESH_TOKEN;

	const { username, password } = req.body.user;

	const oauth2_client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uri
	);

	oauth2_client.setCredentials({ refresh_token: refresh_token });

	const hashed_password = await bcrypt.hash(password, 12);
	const user = { username, password: hashed_password };

	await send_mail(
		oauth2_client,
		client_id,
		client_secret,
		refresh_token,
		username,
		password
	);

	const result = await TemporaryPassword.updateOne({ username }, user, {
		upsert: true,
	});
	return res.status(200).json(result);
});
const update_admin = async_wrapper(async (req, res) => {
	const { username, old_password, password } = req.body.user;

	let user = await User.findOne({ username });
	const is_match = await bcrypt.compare(old_password, user.password);
	if (is_match) {
		const hashed_password = await bcrypt.hash(password, 12);
		user = { username, password: hashed_password };
		const result = await User.updateOne({ username }, user);
		return res.status(200).json(result);
	} else {
		return res.status(401).json({ message: "Incorrect old password" });
	}
});

const delete_user = async_wrapper(async (req, res, next) => {
	const { target } = req.query;
	const result = await User.deleteOne({ username: target });
	return res.status(200).json(result);
});

module.exports = {
	create_user,
	get_users,
	update_user,
	delete_user,
	update_admin,
};

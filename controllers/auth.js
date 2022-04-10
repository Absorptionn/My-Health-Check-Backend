const async_wrapper = require("../middleware/async");

const google_auth_redirect = async_wrapper(async (req, res) => {
	let user = {
		lastname: req.user.name.familyName,
		firstname: req.user.name.givenName,
		email: req.user.emails[0].value,
	};
	user = Buffer.from(encodeURIComponent(JSON.stringify(user))).toString(
		"base64"
	);
	return res.redirect(
		`${process.env.SURVEY}/survey/surveyee.html?user=${user}`
	);
});

module.exports = google_auth_redirect;

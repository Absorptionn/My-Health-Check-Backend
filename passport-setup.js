const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");

dotenv.config();
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: `${process.env.API}/api/v1/hmwa/auth/google/callback`,
			scope: ["email", "profile"],
		},
		(accessToken, refreshToken, profile, done) => {
			return done(null, profile);
		}
	)
);

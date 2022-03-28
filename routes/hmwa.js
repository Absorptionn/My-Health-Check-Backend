const express = require("express");
const {
	get_surveyee_information,
	put_surveyee_information,
	put_surveyee_assessment,
	get_surveyee_assessment,
	download_surveyee_assessment,
} = require("../controllers/hmwa");
const { login, register, logout } = require("../controllers/login");
const is_auth = require("../middleware/is_auth");
const {
	create_user,
	get_users,
	update_user,
	delete_user,
	update_admin,
} = require("../controllers/user");
const is_admin = require("../middleware/is_admin");
const {
	get_college_population,
	put_college_population,
} = require("../controllers/population");

const router = express.Router();
router
	.route("/population")
	.get(is_auth, is_admin, get_college_population)
	.put(is_auth, is_admin, put_college_population);
router.route("/update/admin").put(is_auth, is_admin, update_admin);
router
	.route("/users")
	.post(is_auth, is_admin, create_user)
	.get(is_auth, is_admin, get_users)
	.put(is_auth, is_admin, update_user)
	.delete(is_auth, is_admin, delete_user);
router.route("/register").post(register);
router.route("/login").get(login);
router.route("/logout").delete(logout);
router
	.route("/surveyee/information")
	.get(get_surveyee_information)
	.put(put_surveyee_information);
router
	.route("/surveyee/assessment")
	.get(is_auth, get_surveyee_assessment)
	.put(put_surveyee_assessment);
router
	.route("/surveyee/assessment/download")
	.get(is_auth, download_surveyee_assessment);

module.exports = router;

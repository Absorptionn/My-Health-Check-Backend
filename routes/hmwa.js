import express from "express";
import {
	get_surveyee_information,
	put_surveyee_information,
	put_surveyee_assessment,
	get_surveyee_assessment,
	download_surveyee_assessment,
} from "../controllers/hmwa.js";

const router = express.Router();
router
	.route("/surveyee/information")
	.get(get_surveyee_information)
	.put(put_surveyee_information);
router
	.route("/surveyee/assessment")
	.get(get_surveyee_assessment)
	.put(put_surveyee_assessment);
router.route("/surveyee/assessment/download").get(download_surveyee_assessment);

export default router;

const fs = require("fs");
const zipper = require("zip-local");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const Surveyee = require("../models/surveyee");
const Assessment = require("../models/assessment");
const async_wrapper = require("../middleware/async");
const { create_custom_error } = require("../error/custom-error");

let surveyees_assessments = {};
const object_id = mongoose.Types.ObjectId;
const departments = [
	"College of Allied Medical Professions",
	"College of Arts and Sciences",
	"College of Business and Accountancy",
	"College of Computer Studies",
	"College of Criminal Justice Education",
	"College of Engineering and Architecture",
	"College of Education",
	"College of Nursing",
	"School of Law",
	"School of Medicine",
	"Graduate School",
	"Integrated School",
	"Non-teaching Personnel",
];
const departments_abbreviations = [
	"CAMP",
	"CAS",
	"CBA",
	"CCS",
	"CCJE",
	"CEA",
	"COE",
	"CON",
	"SOL",
	"SOM",
	"GS",
	"IS",
	"NTP",
];

const get_surveyee_information = async_wrapper(async (req, res, next) => {
	const { email } = req.query;

	const surveyee = await Surveyee.findOne({ email });

	if (surveyee) {
		return res.status(200).json(surveyee);
	}

	return next(create_custom_error(`No Surveyee with email: ${email}`, 404));
});

const put_surveyee_information = async_wrapper(async (req, res, next) => {
	const { surveyee } = req.body;

	if (!surveyee) {
		return next(create_custom_error("Invalid content", 400));
	}

	const surveyee_response = await Surveyee.updateOne(
		{ email: surveyee.email },
		surveyee,
		{
			upsert: true,
		}
	);
	return res.status(200).json({ surveyee_response });
});

const send_mail = async (
	oauth2_client,
	client_id,
	client_secret,
	refresh_token,
	surveyee,
	assessment
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

		let text_sicknesses = "";

		for (const sickness of assessment.experiences) {
			text_sicknesses += `\t• ${sickness}\n`;
		}

		let html_sicknesses = "";

		for (const sickness of assessment.experiences) {
			html_sicknesses += `<b>&emsp;• ${sickness}\n</b>`;
		}

		const cc_target = `${departments_abbreviations[
			departments.indexOf(surveyee.college)
		].toLowerCase()}@auf.edu.ph`;
		const mail_options = {
			from: "AUF MyHealthCheck",
			to: process.env.TARGET_EMAIL,
			cc: cc_target,
			subject: "Surveyee Assessment Alert",
			text: `Greetings,

${surveyee.sex === "Male" ? "Mr." : "Ms."} ${surveyee.firstname} ${
				surveyee.lastname
			} of AUF ${surveyee.college} - ${surveyee.course} 
reported of experiencing the following:
${text_sicknesses}
Kindly note the additional information provided by the ${
				surveyee.position === "Employee" ? "employee" : "student"
			} that occured for the past 14 days for your reference:
\t• ${
				assessment.is_exposed
					? "Exposed to someone with confirmed COVID-19"
					: "Not-exposed to someone with confirmed COVID-19"
			}
\t• ${
				assessment.traveled.has_traveled
					? `Traveled outside ${
							assessment.traveled.location === "outside province"
								? "the province"
								: "the Philippines"
					  }`
					: "Did not travel"
			}

For monitoring purposes, you may contact ${
				surveyee.sex === "Male" ? "him" : "her"
			} through email: ${surveyee.email}`,
			html: `<p style="white-space: pre-line;">Greetings,

${
	surveyee.sex === "Male" ? "Mr." : "Ms."
} <b style="text-transform: capitalize;">${surveyee.firstname} ${
				surveyee.lastname
			}</b> of AUF <b>${surveyee.college} - ${surveyee.course}</b>
reported of experiencing the following:
${html_sicknesses}
Kindly note the additional information provided by the ${
				surveyee.position === "Employee" ? "employee" : "student"
			} that occured for the past 14 days for your reference:
<b>&emsp;• ${
				assessment.is_exposed
					? "Exposed to someone with confirmed COVID-19"
					: "Not-exposed to someone with confirmed COVID-19"
			}</b>
<b>&emsp;• ${
				assessment.traveled.has_traveled
					? `Traveled outside ${
							assessment.traveled.location === "outside province"
								? "the province"
								: "the Philippines"
					  }`
					: "Did not travel"
			}</b>
			
For monitoring purposes, you may contact ${
				surveyee.sex === "Male" ? "him" : "her"
			} through email: <b>${surveyee.email}</b></p>`,
		};

		const results = await transport.sendMail(mail_options);

		return results;
	} catch (error) {
		return error;
	}
};

const put_surveyee_assessment = async_wrapper(async (req, res, next) => {
	const client_id = process.env.CLIENT_ID;
	const client_secret = process.env.CLIENT_SECRET;
	const redirect_uri = "https://developers.google.com/oauthplayground";
	const refresh_token = process.env.REFRESH_TOKEN;

	const { assessment } = req.body;
	const { email } = req.query;

	if (!email || !assessment) {
		return next(create_custom_error("Invalid content", 400));
	}

	const surveyee = await Surveyee.findOne({ email });
	const assessment_response = await Assessment.updateOne(
		{ date: assessment.date, surveyee_id: surveyee._id },
		assessment,
		{ upsert: true }
	);

	if (
		assessment.experiences.length &&
		!assessment.experiences.includes("None of the above")
	) {
		const oauth2_client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uri
		);

		oauth2_client.setCredentials({ refresh_token: refresh_token });

		const result = await send_mail(
			oauth2_client,
			client_id,
			client_secret,
			refresh_token,
			surveyee,
			assessment
		);

		return res.status(200).json({ result });
	}
	return res.status(200).json({ assessment_response });
});

const surveyee_assessments = async () => {
	const results = {};

	for (const department of departments) {
		let surveyees_per_department = await Surveyee.find({
			college: department,
		}).sort("lastname");
		let surveyees = {};
		for (const surveyee of surveyees_per_department) {
			const surveyee_name =
				`${surveyee.lastname}, ${surveyee.firstname}`.toLowerCase();
			const assessments = await Assessment.find({
				surveyee_id: object_id(surveyee._id),
			});
			surveyees[surveyee_name] = { information: surveyee, assessments };
		}
		results[department] = surveyees;
	}
	return results;
};

const get_surveyee_assessment = async_wrapper(async (req, res) => {
	surveyees_assessments = await surveyee_assessments();
	return res
		.status(200)
		.json({ surveyees_assessments, is_admin: res.locals.is_admin });
});

const download_surveyee_assessment = async_wrapper(async (req, res) => {
	const { department: selected_department } = req.query;

	const root_path = "./files";
	if (!fs.existsSync(root_path)) {
		fs.mkdirSync(root_path);
		fs.mkdirSync(`${root_path}/Departments`);
		fs.mkdirSync(`${root_path}/Zip`);
	}
	let zip_path = "";
	if (!selected_department) {
		const dir_path = `${root_path}/Departments`;
		for (const department of departments) {
			const surveyee_file_name = `/${department}.csv`;
			const surveyee_file_path = dir_path + surveyee_file_name;
			const surveyee_headers = `${department}\nLastname,Firstname,Middlename,Email,Sex,Age,Address,"Contact Number",AUF,,Date,Sicknesses,Exposed,Traveled,Location\n`;
			fs.writeFileSync(surveyee_file_path, surveyee_headers);
			for (const surveyee of Object.keys(surveyees_assessments[department])) {
				let information =
					surveyees_assessments[department][surveyee].information;
				let surveyee_data = [
					information.lastname,
					information.firstname,
					information.middlename,
					information.email,
					information.sex,
					information.age,
					information.address,
					information["contact_number"],
					information.position,
				].join('","');
				surveyee_data = `"${surveyee_data}"`;
				let assessment_data = "";
				const assessments =
					surveyees_assessments[department][surveyee].assessments;
				for (const assessment of assessments) {
					assessment_data +=
						[
							assessment.date,
							`"${assessment.experiences.join(", ")}"`,
							assessment.is_exposed,
							assessment.traveled.has_traveled,
							assessment.traveled.location,
						].join(",") + "\n,,,,,,,,,,";
				}

				surveyee_data = `${surveyee_data},,${assessment_data}\n`;
				fs.writeFileSync(surveyee_file_path, surveyee_data, { flag: "a" });
			}
		}
		zip_path = `${root_path}/Zip/Departments.zip`;
		zipper.sync.zip(`${root_path}/Departments`).compress().save(zip_path);
	} else {
		const dir_path = `${root_path}/Departments`;
		const surveyee_file_name = `/${selected_department}.csv`;
		const surveyee_file_path = dir_path + surveyee_file_name;
		const surveyee_headers = `${selected_department}\nLastname,Firstname,Middlename,Email,Sex,Age,Address,"Contact Number",AUF,,Date,Sicknesses,Exposed,Traveled,Location\n`;
		fs.writeFileSync(surveyee_file_path, surveyee_headers);
		for (const surveyee of Object.keys(
			surveyees_assessments[selected_department]
		)) {
			let information =
				surveyees_assessments[selected_department][surveyee].information;
			let surveyee_data = [
				information.lastname,
				information.firstname,
				information.middlename,
				information.email,
				information.sex,
				information.age,
				information.address,
				information["contact_number"],
				information.position,
			].join('","');
			surveyee_data = `"${surveyee_data}"`;
			let assessment_data = "";
			const assessments =
				surveyees_assessments[selected_department][surveyee].assessments;
			for (const assessment of assessments) {
				assessment_data +=
					[
						assessment.date,
						`"${assessment.experiences.join(", ")}"`,
						assessment.is_exposed,
						assessment.traveled.has_traveled,
						assessment.traveled.location,
					].join(",") + "\n,,,,,,,,,,";
			}

			surveyee_data = `${surveyee_data},,${assessment_data}\n`;
			fs.writeFileSync(surveyee_file_path, surveyee_data, { flag: "a" });
		}
		zip_path = `${root_path}/Zip/${selected_department}.zip`;
		zipper.sync
			.zip(`${root_path}/Departments/${selected_department}.csv`)
			.compress()
			.save(zip_path);
	}

	return res.status(200).download(zip_path);
});

module.exports = {
	get_surveyee_information,
	put_surveyee_information,
	put_surveyee_assessment,
	get_surveyee_assessment,
	download_surveyee_assessment,
};

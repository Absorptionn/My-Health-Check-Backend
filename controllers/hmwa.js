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

		const mail_options = {
			from: `MyHealthCheck <${process.env.AUTHORIZED_EMAIL}>`,
			to: process.env.TARGET_EMAIL,
			subject: "Surveyee Assessment Alert",
			text: `Greetings,

${surveyee.college} ${`: ${surveyee.course}`}
${surveyee.position} ${surveyee.lastname} ${surveyee.firstname},
with an email of ${
				surveyee.email
			}, reported of experiencing the following sicknesses:
${text_sicknesses}
They have also reported, they have ${
				assessment.is_exposed ? "" : "not "
			}been exposed to someone
with confirmed COVID-19 in the past 14 days.

In addition, they have reported ${
				assessment.traveled.has_traveled
					? `of traveling ${assessment.traveled.location} `
					: "of not traveling "
			}in the last 14 days. 
			`,
			html: `<p style="white-space: pre-line">Greetings,

${surveyee.college} ${surveyee.course ? `: ${surveyee.course}` : ""}
${surveyee.position} <b style="text-transform: capitalize">${
				surveyee.lastname
			}, ${surveyee.firstname}</b>,
with an email of ${
				surveyee.email
			}, reported of experiencing the following sicknesses:
${html_sicknesses}
They have also reported, they have ${
				assessment.is_exposed ? "" : "<b>not</b> "
			}been <b>exposed</b> to someone
with confirmed COVID-19 in the past 14 days.

In addition, they have reported ${
				assessment.traveled.has_traveled
					? `of <b>traveling ${assessment.traveled.location}</b> `
					: "of <b>not traveling</b> "
			}in the last 14 days. 
			</p>`,
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
		let surveyees_per_department = await Surveyee.find({ college: department });
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
		for (const department of departments) {
			const dir_path = `${root_path}/Departments/${department}`;
			if (!fs.existsSync(dir_path)) {
				fs.mkdirSync(dir_path);
			}
			const surveyee_file_name = `/surveyees.csv`;
			const surveyee_file_path = dir_path + surveyee_file_name;
			const surveyee_headers = `${department}\nID,Lastname,Firstname,Middlename,Email,Sex,Age,Address,"Contact Number",AUF\n`;
			fs.writeFileSync(surveyee_file_path, surveyee_headers);

			const assessment_file_name = `/assessments.csv`;
			const assessment_file_path = dir_path + assessment_file_name;
			const assessment_headers = `${department}\nID,"Surveyee ID",Date,Sicknesses,Exposed,Traveled,Location\n`;
			fs.writeFileSync(assessment_file_path, assessment_headers);
			let assessment_data = "";
			for (const surveyee of Object.keys(surveyees_assessments[department])) {
				let information =
					surveyees_assessments[department][surveyee].information;
				let surveyee_data = [
					information._id,
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
				surveyee_data = `"${surveyee_data}"\n`;
				fs.writeFileSync(surveyee_file_path, surveyee_data, { flag: "a" });

				const assessments =
					surveyees_assessments[department][surveyee].assessments;
				for (const assessment of assessments) {
					assessment_data +=
						[
							assessment._id,
							assessment.surveyee_id,
							assessment.date,
							`"${assessment.experiences.join(", ")}"`,
							assessment.is_exposed,
							assessment.traveled.has_traveled,
							assessment.traveled.location,
						].join(",") + "\n";
				}
			}
			fs.writeFileSync(assessment_file_path, assessment_data, {
				flag: "a",
			});
		}
		zip_path = `${root_path}/Zip/Departments.zip`;
		zipper.sync.zip(`${root_path}/Departments`).compress().save(zip_path);
	} else {
		const dir_path = `${root_path}/Departments/${selected_department}`;
		if (!fs.existsSync(dir_path)) {
			fs.mkdirSync(dir_path);
		}
		const surveyee_file_name = `/surveyees.csv`;
		const surveyee_file_path = dir_path + surveyee_file_name;
		const surveyee_headers = `${selected_department}\nID,Lastname,Firstname,Middlename,Email,Sex,Age,Address,"Contact Number",AUF\n`;
		fs.writeFileSync(surveyee_file_path, surveyee_headers);

		const assessment_file_name = `/assessments.csv`;
		const assessment_file_path = dir_path + assessment_file_name;
		const assessment_headers = `${selected_department}\nID,"Surveyee ID",Date,Sicknesses,Exposed,Traveled,Location\n`;
		fs.writeFileSync(assessment_file_path, assessment_headers);
		let assessment_data = "";
		for (const surveyee of Object.keys(
			surveyees_assessments[selected_department]
		)) {
			let information =
				surveyees_assessments[selected_department][surveyee].information;
			let surveyee_data = [
				information._id,
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
			surveyee_data = `"${surveyee_data}"\n`;
			fs.writeFileSync(surveyee_file_path, surveyee_data, { flag: "a" });

			const assessments =
				surveyees_assessments[selected_department][surveyee].assessments;
			for (const assessment of assessments) {
				assessment_data +=
					[
						assessment._id,
						assessment.surveyee_id,
						assessment.date,
						`"${assessment.experiences.join(", ")}"`,
						assessment.is_exposed,
						assessment.traveled.has_traveled,
						assessment.traveled.location,
					].join(",") + "\n";
			}
		}
		fs.writeFileSync(assessment_file_path, assessment_data, {
			flag: "a",
		});

		zip_path = `${root_path}/Zip/${selected_department}.zip`;
		zipper.sync
			.zip(`${root_path}/Departments/${selected_department}`)
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

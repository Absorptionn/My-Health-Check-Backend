const app = require("./server.js");
const dotenv = require("dotenv");
const connect_db = require("./database/connect.js");

dotenv.config();
const port = process.env.PORT || 3000;
const mongo_uri = process.env.MONGO_URI;

const start = async () => {
	try {
		await connect_db(mongo_uri);
		app.listen(port, () => {
			console.log(`[LISTENING] Server is on port ${port}`);
			console.log("[CONNECTED] Server is connected to database");
		});
	} catch (e) {
		console.log(e);
	}
};

start();

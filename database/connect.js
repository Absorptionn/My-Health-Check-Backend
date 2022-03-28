const mongoose = require("mongoose");

const connect_db = (url) => {
	mongoose.connect(url);
};

module.exports = connect_db;

import mongoose from "mongoose";

const connect_db = (url) => {
	mongoose.connect(url);
};

export default connect_db

import express from "express";
import router from "./routes/hmwa.js";
import cors from "cors";
import not_found from "./middleware/not_found.js";
import error_handler from "./middleware/error_handler.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/hmwa", router);
app.use(not_found);
app.use(error_handler);

export default app;

import Replicate from "replicate";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export default replicate;

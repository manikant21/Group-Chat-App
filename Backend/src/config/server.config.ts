import dotenv from "dotenv";
dotenv.config();

const PORT:string = process.env.PORT || "3000";
const DB_HOST:string = process.env.DB_HOST || "";
const DB_NAME:string = process.env.DB_NAME || "";
const DB_USER:string = process.env.DB_USER || "";
const DB_PORT:string  = process.env.DB_PORT || "";
const DB_PASSWORD:string  = process.env.DB_PASSWORD || "";
const JWT_SECRET: string = process.env.JWT_SECRET || "";
const AWS_ACCESS_KEY_ID: string= process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY: string=process.env.AWS_SECRET_ACCESS_KEY!;
const AWS_REGION: string=process.env.AWS_REGION!;
const AWS_S3_BUCKET: string= process.env.AWS_S3_BUCKET!
export {PORT, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER, JWT_SECRET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET};


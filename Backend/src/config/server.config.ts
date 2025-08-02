import dotenv from "dotenv";
dotenv.config();

const PORT:string = process.env.PORT || "3000";
const DB_HOST:string = process.env.DB_HOST || "";
const DB_NAME:string = process.env.DB_NAME || "";
const DB_USER:string = process.env.DB_USER || "";
const DB_PORT:string  = process.env.DB_PORT || "";
const DB_PASSWORD:string  = process.env.DB_PASSWORD || "";
const JWT_SECRET: string = process.env.JWT_SECRET || "";

export {PORT, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER, JWT_SECRET};


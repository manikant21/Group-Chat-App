import express, { urlencoded } from "express";
import { PORT } from "./config/server.config.js";
import { sequelize } from "./config/db.config.js";
import cookieParser from "cookie-parser";
import {router as apiRoute} from "./routes/index.js";
import cors from "cors";


const app = express();

app.use(cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());
app.use(urlencoded({extended: true}));
app.use(cookieParser())
app.use("/api", apiRoute);


await sequelize.sync();

app.listen(PORT , ():void => {
    console.log(`Server is up and running at ${PORT}`)
})


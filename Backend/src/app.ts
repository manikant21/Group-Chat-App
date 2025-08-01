import express, { urlencoded } from "express";
import { PORT } from "./config/server.config.js";
import { sequelize } from "./config/db.config.js";
import {router as apiRoute} from "./routes/index.js";
import cors from "cors";


const app = express();

app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(urlencoded({extended: true}));

app.use("/api", apiRoute);


await sequelize.sync();

app.listen(PORT , ():void => {
    console.log(`Server is up and running at ${PORT}`)
})


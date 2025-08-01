import express, { urlencoded } from "express";
import { PORT } from "./config/server.config.js";
import { sequelize } from "./config/db.config.js";
import {router as apiRoute} from "./routes/index.js";
import cors from "cors";


const app = express();

app.use(cors({origin: "*"}));
app.use(express.json());
app.use(urlencoded({extended: true}));

app.use("/api", apiRoute);


await sequelize.sync();

app.listen(PORT , ():void => {
    console.log(`Server is up and running at ${PORT}`)
})


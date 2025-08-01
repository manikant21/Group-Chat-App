import {DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER} from "./server.config.js";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize( DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: Number(DB_PORT),
    "dialect": "mysql"
});

(async () => {
     try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

export {sequelize};
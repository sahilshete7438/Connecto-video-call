import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
    try {
        app.set("mongo_user")
        const mongoURI = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/connecto";
        console.log("Connecting to MongoDB...");
        const connectionDb = await mongoose.connect(mongoURI);

        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`)
        server.listen(app.get("port"), () => {
            console.log("LISTENING ON PORT 8000")
        });
    } catch (e) {
        console.error("CRITICAL ERROR DURING STARTUP:", e);
        process.exit(1);
    }
}



start();
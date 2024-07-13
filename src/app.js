import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// use to config incomming json files
app.use(express.json({limit: "16kb"}))

// config to accept data from URL
app.use(express.urlencoded({extended: true,limit: "16kb"}))

// this to save files on my device in public folder
app.use(express.static("public"))

// to set cookies
app.use(cookieParser());

export {app}
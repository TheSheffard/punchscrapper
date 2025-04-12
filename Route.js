import express from "express";
import dotenv from "dotenv";
import News from "./Models/NewsPost.js";
const router = express.Router();
dotenv.config();


router.get("/all-post",  (req, res) => News.getAllPost(req, res));

export default router;

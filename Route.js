import express from "express";
import dotenv from "dotenv";
import News from "./Models/NewsPost.js";
import LaunchPuppeteer from './Utils/Helper.js';

const router = express.Router();
dotenv.config();


router.get("/all-post", (req, res) => {

  News.getAllPost(req, res);
});


router.get("/pinged", (req, res) => {
  const lastPingMessage = LaunchPuppeteer.getLastPingMessage();
  res.json({ lastPingMessage });
});

router.get("/cate", (req, res) => {
  const lastPingMessage = LaunchPuppeteer.getLastPingMessage();
  res.json({ lastPingMessage });
});



export default router;
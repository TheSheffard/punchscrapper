import express from "express";
import News from "./Models/NewsPost.js";
import router from "./Route.js";
import mongoose from "mongoose";
import cors from "cors";
import { pageScrapper } from "./Controllers/Punch.js";
import moment from "moment";
import LaunchPuppeteer from "./Utils/Helper.js"

const app = express();
app.use("/", router);
// Configure CORS properly
app.use(
  cors({
    origin: "*", // Allows requests from any origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
  })
);

const PORT = process.env.PORT || 4000;
//category ids
const HomePage_NEWS_ID = "27e3d94c-2462-4e7e-9840-efe7604ffcab";
const NEWS_CATEGORY_ID = "2ab36b15-fdf4-4a88-b05f-b6d96c71cabf";
const FEATURED_CATEGORY_ID = "f7ca96e7-958a-41b9-ad21-ad7059588290";
const POLITICS_CATEGORY_ID = "f7ca96e7-958a-41b9-ad21-ad7059396286";
const Sports_CATEGORY_ID = "f7ca96e7-958a-41b9-ad21-ad70w4534346";
const BUSINESS_CATEGORY_ID = "f7ca96e7-3246-41b9-ad21-ad70w4534346";
const LITE_CATEGORY_ID = "f7ca96e7-958a-41b9-ad21-ad70w4ceawegas";

// Function to fetch, process, and insert posts every hour
async function fetchAndInsertPosts(path, categoryId, categoryName) {
  console.log(`Fetching posts for ${path}`);
  try {
    const posts = await pageScrapper(path);

    const today = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format

    if (posts == null || posts.length < 1) {
      console.log("No post found");
      return;
    }

    for (const post of posts) {
      const formattedPostDate = moment(post.date, "Do MMMM YYYY").format(
        "YYYY-MM-DD"
      );

      // Check if the post's date is today's date
      // if (formattedPostDate !== today) {
      //   console.log("Post is not from today Skipping");
      //   continue;
      // }

      if (post.content == null) {
        console.log("Post content is null");
        continue;
      }

      // Check if a post with the same title already exists in MongoDB
      const existingPost = await News.findNewsByTitle(post.title);

      if (existingPost) {
        console.log(
          `Post with title '${post.title}' already exists, skipping...`
        );
        continue;
      }

      await News.saveNews(post, categoryId, categoryName);

      console.log(`Inserted New post: ${post.title}`);
    }

    console.log("===========================================");
    console.log(`${categoryName} post fetching and insertion complete.`);
    console.log("===========================================");
  } catch (error) {
    console.error("Error during post fetching and insertion:", error.message);
  }
}

async function fetchAndInsertAllPosts() {
  const sources = [
    { path: "all-posts", id: HomePage_NEWS_ID, name: "HomePage" },
    { path: "topics/news", id: NEWS_CATEGORY_ID, name: "News" },
    { path: "topics/featured", id: FEATURED_CATEGORY_ID, name: "Featured" },
    { path: "topics/politics", id: POLITICS_CATEGORY_ID, name: "Politics" },
    { path: "topics/sports", id: Sports_CATEGORY_ID, name: "Sports" },
    { path: "topics/business", id: BUSINESS_CATEGORY_ID, name: "Business" },
    { path: "topics/punch-lite", id: LITE_CATEGORY_ID, name: "Lite" },
  ];

  for (const source of sources) {
    await fetchAndInsertPosts(source.path, source.id, source.name);
  }
}


// Start the server and execute functions asynchronously
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI).then(() => {
      console.log(`Connected To MongoDB!!!`);
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });

    // Start the keep-alive pinger
    LaunchPuppeteer.startKeepAlive();

    // Run both functions simultaneously without blocking
    await Promise.all([
      fetchAndInsertAllPosts(),
      setInterval(fetchAndInsertAllPosts, 60 * 60 * 1000), // Fetch posts every hour
    ]);
  } catch (e) {
    console.log(e.message + `Error connecting to Database`);
  }
};
startServer();

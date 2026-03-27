import express from "express";
import News from "./Models/NewsPost.js";
import router from "./Route.js";
import mongoose from "mongoose";
import cors from "cors";
import { pageScrapper } from "./Controllers/Punch.js";
import moment from "moment";
import LaunchPuppeteer from "./Utils/Helper.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", router);


const PORT = process.env.PORT || 4000;

// Category IDs
const HomePage_NEWS_ID = "27e3d94c-2462-4e7e-9840-efe7604ffcab";
const NEWS_CATEGORY_ID = "2ab36b15-fdf4-4a88-b05f-b6d96c71cabf";
const FEATURED_CATEGORY_ID = "f7ca96e7-958a-41b9-ad21-ad7059588290";
const POLITICS_CATEGORY_ID = "f7ca96e7-958a-41b9-ad21-ad7059396286";
const Sports_CATEGORY_ID = "f7ca96e7-958a-41b9-ad21-ad70w4534346";
const BUSINESS_CATEGORY_ID = "f7ca96e7-3246-41b9-ad21-ad70w4534346";
const LITE_CATEGORY_ID = "f7ca96e7-958a-41b9-ad21-ad70w4ceawegas";

async function fetchAndInsertPosts(path, categoryId, categoryName) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔄 Fetching posts for: ${categoryName}`);
  console.log("=".repeat(50));

  try {
    const posts = await pageScrapper(path);

    if (!posts || posts.length === 0) {
      console.log(`⚠️ No posts found for ${categoryName}`);
      return { inserted: 0, skipped: 0, errors: 0 };
    }

    const today = new Date().toISOString().split("T")[0];
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        // Validate post content
        if (!post.content || post.content.trim().length === 0) {
          console.log(`⚠️ Skipped: Empty content for "${post.title?.substring(0, 50)}..."`);
          skippedCount++;
          continue;
        }

        // Format and validate date - handle multiple formats
        let formattedPostDate = moment(post.date, "MMMM DD, YYYY h:mm a", true);
        
        // If that fails, try without time
        if (!formattedPostDate.isValid()) {
          formattedPostDate = moment(post.date, "MMMM DD, YYYY", true);
        }
        
        // Try DD MMMM YYYY format
        if (!formattedPostDate.isValid()) {
          formattedPostDate = moment(post.date, "DD MMMM YYYY", true);
        }
        
        // Try with different time formats (single-digit day)
        if (!formattedPostDate.isValid()) {
          formattedPostDate = moment(post.date, "MMMM D, YYYY h:mm a", true);
        }
        
        // If still invalid, log the actual date string for debugging
        if (!formattedPostDate.isValid()) {
          console.log(`⚠️ Skipped: Invalid date format "${post.date}" for "${post.title?.substring(0, 50)}..."`);
          skippedCount++;
          continue;
        }
        
        // Convert to YYYY-MM-DD format
        const formattedPostDateString = formattedPostDate.format("YYYY-MM-DD");

        // Check if post is from today
        if (formattedPostDateString !== today) {
          console.log(`⏭️ Skipped: Not from today (${formattedPostDateString}) - "${post.title?.substring(0, 50)}..."`);
          skippedCount++;
          continue;
        }

        // Check for duplicates
        const existingPost = await News.findNewsByTitle(post.title);
        if (existingPost) {
          console.log(`⏭️ Skipped: Duplicate - "${post.title?.substring(0, 50)}..."`);
          skippedCount++;
          continue;
        }

        // Save new post
        await News.saveNews(post, categoryId, categoryName);
        insertedCount++;
        console.log(`✅ Inserted: "${post.title?.substring(0, 60)}..."`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing post:`, error.message);
      }
    }

    console.log(`\n📊 ${categoryName} Summary:`);
    console.log(`   ✅ Inserted: ${insertedCount}`);
    console.log(`   ⏭️ Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`${"=".repeat(50)}\n`);

    return { inserted: insertedCount, skipped: skippedCount, errors: errorCount };

  } catch (error) {
    console.error(`🚨 Error fetching ${categoryName}:`, error.message);
    return { inserted: 0, skipped: 0, errors: 1 };
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

  console.log(`\n🚀 Starting batch scraping for ${sources.length} categories...\n`);
  
  const results = {
    totalInserted: 0,
    totalSkipped: 0,
    totalErrors: 0
  };

  for (const source of sources) {
    const result = await fetchAndInsertPosts(source.path, source.id, source.name);
    results.totalInserted += result.inserted;
    results.totalSkipped += result.skipped;
    results.totalErrors += result.errors;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 FINAL SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Total Inserted: ${results.totalInserted}`);
  console.log(`⏭️ Total Skipped: ${results.totalSkipped}`);
  console.log(`❌ Total Errors: ${results.totalErrors}`);
  console.log(`${"=".repeat(50)}\n`);
}

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });

    // Start keep-alive pinger
    LaunchPuppeteer.startKeepAlive();

    // Run initial scraping
    await fetchAndInsertAllPosts();

    setInterval(fetchAndInsertAllPosts, 60 * 60 * 1000);

  } catch (e) {
    console.error("🚨 Error starting server:", e.message);
  }
};

startServer();
import dotenv from "dotenv";
dotenv.config();
import LaunchPuppeteer from "../Utils/Helper.js";


const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const pageScrapper = async (pageUrl) => {
  const { page, browser } = await LaunchPuppeteer.LaunchBrowser();
  console.log("Scrapper browser launched");

  // Speed up loading by disabling unnecessary resources
  await LaunchPuppeteer.interceptRequest(page);

  try {
    await page.goto(`${process.env.SITE_URL}/${pageUrl}/`, { timeout: 60000 });

    const posts = await LaunchPuppeteer.scraperAllPostFunction(page);

    const postData = [];

    for (const post of posts) {

      if (!post?.link) continue;
      const postPage = await browser.newPage();
      await LaunchPuppeteer.interceptRequest(postPage);

      try {
        await postPage.goto(post.link, { timeout: 60000 });

        const mainContent = await LaunchPuppeteer.scrapNewsMainContent(
          postPage
        );

        if (mainContent?.title && mainContent?.content) {
          postData.push(mainContent);
        } else {
          console.log("⚠️ Skipped due to empty content:", post.link);
        }
      } catch (err) {
        console.error("❌ Failed to load post:", post.link, err.message);
      } finally {
        if (!postPage.isClosed()) {
          await postPage.close();
        }
        await delay(1500); // Add delay before next post to avoid crashing browser
      }
    }

    return postData;
  } catch (err) {
    console.error("🚨 Failed to load home page:", err.message);
    return [];
  } finally {
    await browser.close();
    console.log("Scrapping finished, browser closed");
  }
};

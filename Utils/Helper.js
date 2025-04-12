import puppeteer from "puppeteer";
import dotenv from "dotenv";
dotenv.config();
const SITE_URL = process.env.SITE_URL;
const KEEP_ALIVE_GAP = process.env.KEEP_ALIVE_GAP || 5000;
const KEEP_ALIVE_URL = process.env.BASE_URL || 5000;

class LaunchPuppeteer {

  constructor() {
    this.lastPingMessage = "Server has not been pinged yet.";
    this.keepAliveGap = KEEP_ALIVE_GAP;
    this.siteUrl = KEEP_ALIVE_URL;
  }

  startKeepAlive() {
    setInterval(async () => {
      try {
        await fetch(`${this.siteUrl}/keep-alive`);
        this.lastPingMessage = `✅ Server pinged at ${new Date().toLocaleTimeString()}`;
        console.log(this.lastPingMessage);
      } catch (err) {
        this.lastPingMessage = "❌ Error pinging server.";
        console.error("Ping error:", err.message);
      }
    }, this.keepAliveGap);
  }

  getLastPingMessage() {
    return this.lastPingMessage;
  }

  async LaunchBrowser() {
    try {
      const browser = await puppeteer.launch({
        executablePath:
          "c://Program Files//Google//Chrome//Application//chrome.exe", // Update path if necessary
        headless: "new",
      });
      const page = await browser.newPage();

      return { page, browser };
    } catch (e) {
      console.log("Error occurred while trying to launch browser", e.message);
    }
  }

  async interceptRequest(page) {
    await page.setRequestInterception(true);
  
    page.on("request", (request) => {
      const url = request.url();
      const resourceType = request.resourceType();
  
      // Block data urls.
      if (url.startsWith("data:")) {
        request.abort(); // Block the request
      }
      // Block stylesheets, fonts, images, scripts, documents and others.
      else if (
        resourceType == "stylesheet" ||
        resourceType == "font" ||
        resourceType == "script" ||
        resourceType == "image" 
      ) {
        request.abort(); // Block the request
      } else {
        request.continue(); // Allow other resources.
      }
    });
  }


  // This function will scrape all post in the All-Post page
  async scraperAllPostFunction(page) {
    return await page.evaluate((SITE_URL) => {
      const container = document.querySelector("#category-page");
      if (!container) return [];

      const anchors = container.querySelectorAll("a");
      const links = [];

      anchors.forEach((a) => {
        const href = a.getAttribute("href");
        if (href) {
          const fullLink = href.startsWith("http") ? href : SITE_URL + href;

          links.push({
            link: fullLink,
          });
        } else {
          console.log("No heft tag found here");
        }
      });

      return links;
    }, SITE_URL);
  }

  async scrapNewsMainContent(page) {
    return await page.evaluate(() => {
      const parent = document.querySelector(".single-article");
      if (!parent) return null;
  
      const title = parent.querySelector(".post-title")?.innerText.trim() || "";
      const date = parent.querySelector(".post-date")?.innerText.trim() || "";
      const image =
        parent.querySelector(".post-image-wrapper img")?.getAttribute("src") || "";
  
      const contentContainer = parent.querySelector(".post-content");
      let content = "";
  
      if (contentContainer) {
        const seen = new Set();
  
        const paragraphs = Array.from(contentContainer.querySelectorAll("p"))
          .map((p) => p.innerText.trim())
          .filter((text) => {
            if (text.length < 30 || seen.has(text)) return false;
            seen.add(text);
            return true;
          });
  
        content = paragraphs.join(" ");
      }
  
      return {
        title,
        date,
        image,
        content,
      };
    });
  }
  
  

}

export default new LaunchPuppeteer();



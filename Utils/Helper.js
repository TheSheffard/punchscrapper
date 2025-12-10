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
        // executablePath: "c://Program Files//Google//Chrome//Application//chrome.exe",
        headless: "new",
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
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

      if (url.startsWith("data:") ||
          resourceType === "stylesheet" ||
          resourceType === "font" ||
          resourceType === "script" ||
          resourceType === "image") {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  // FIXED: Remove duplicates and improve link extraction
  async scraperAllPostFunction(page) {
    return await page.evaluate((SITE_URL) => {
      const container = document.querySelector("#category-page");
      if (!container) return [];

      const anchors = container.querySelectorAll("a");
      const linkSet = new Set(); // Use Set to prevent duplicates
      const links = [];

      anchors.forEach((a) => {
        const href = a.getAttribute("href");
        if (href) {
          const fullLink = href.startsWith("http") ? href : SITE_URL + href;
          
          // Only add if not already in the set
          if (!linkSet.has(fullLink)) {
            linkSet.add(fullLink);
            links.push({ link: fullLink });
          }
        }
      });

      console.log(`Found ${links.length} unique post links.`);
      return links;
    }, SITE_URL);
  }

  async scrapNewsMainContent(page) {
    return await page.evaluate(() => {
      const parent = document.querySelector(".single-article");
      if (!parent) return null;

      const title = parent.querySelector(".post-title")?.innerText.trim() || "";
      const date = parent.querySelector(".post-date")?.innerText.trim() || "";
      const image = parent.querySelector(".post-image-wrapper img")?.getAttribute("src") || "";

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

      return { title, date, image, content };
    });
  }

  MonthReplacer(monthName) {
    const months = {
      "January": "01", "February": "02", "March": "03",
      "April": "04", "May": "05", "June": "06",
      "July": "07", "August": "08", "September": "09",
      "October": "10", "November": "11", "December": "12"
    };
    return months[monthName] || "";
  }
}

export default new LaunchPuppeteer();
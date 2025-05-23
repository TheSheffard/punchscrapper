import mongoose from "mongoose";

class News {
  constructor() {
    const newsSchema = new mongoose.Schema(
      {
        categoryId: { type: String, required: true },
        categoryName: { type: String }, // Optional
        title: { type: String, required: true },
        image: { type: String },
        date: { type: String, required: true }, // e.g., "2025-04-12"
        content: { type: String },
      },
      { timestamps: true }
    );

    this.model = mongoose.model("News", newsSchema); // Changed model name to "News" (avoid using "New")
  }

  async saveNews(data, categoryId, categoryName = "") {
    try {
      return await this.model.create({ ...data, categoryId, categoryName });
    } catch (error) {
      console.error("❌ Error saving news:", error.message);
    }
  }

  async findNewsByTitle(title) {
    return await this.model.findOne({ title });
  }
  async getAllPost(req, res) {
    try {
      const allPosts = await this.model.find().sort({ createdAt: -1 });

      console.log(allPosts)
      if (!allPosts || allPosts.length === 0) {
        return res.status(404).json({ message: "No posts found!" });
      }

      const postLength = allPosts.length;

      return res.status(200).json({ postLength, status: "success", allPosts });
    } catch (e) {
      console.error("❌ Error fetching posts:", e.message);
      return res.status(500).json({ message: "Server error" });
    }
  }


  async getNewsById(req, res) {
    const { Id } = req.params;
    try {
      const newsItem = await this.model.findById(Id);

      if (!newsItem) return res.status(404).json({ status: "failed", message: "News not found" });

      return res.status(200).json({ status: "success", newsItem });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getNewsByCategoryName(req, res) {
    const { categoryName } = req.params;
    try {
      const newsItem = await this.model.find({ categoryName }).sort({ createdAt: -1 });

      if (newsItem.length == 0) return res.status(404).json({ status: "failed", message: `No news found for this category ${categoryName}` });

      return res.status(200).json({ status: "success", newsItem });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

}

export default new News();

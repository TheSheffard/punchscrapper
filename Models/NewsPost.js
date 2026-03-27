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

    // Add index for sorting performance
    newsSchema.index({ createdAt: -1 });
    newsSchema.index({ categoryName: 1, createdAt: -1 });

    this.model = mongoose.model("News", newsSchema); 

    // Category ID mapping
    this.categoryIds = {
      "HomePage": "27e3d94c-2462-4e7e-9840-efe7604ffcab",
      "News": "2ab36b15-fdf4-4a88-b05f-b6d96c71cabf",
      "Featured": "f7ca96e7-958a-41b9-ad21-ad7059588290",
      "Politics": "f7ca96e7-958a-41b9-ad21-ad7059396286",
      "Sports": "f7ca96e7-958a-41b9-ad21-ad70w4534346",
      "Business": "f7ca96e7-3246-41b9-ad21-ad70w4534346",
      "Lite": "f7ca96e7-958a-41b9-ad21-ad70w4ceawegas",
    };

    this.getAllPost = this.getAllPost.bind(this);
    this.getNewsById = this.getNewsById.bind(this);
    this.getNewsByCategoryName = this.getNewsByCategoryName.bind(this);
    this.searchNews = this.searchNews.bind(this);
    this.createPost = this.createPost.bind(this);
    this.deletePost = this.deletePost.bind(this);
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
      const allPosts = await this.model.find().sort({ createdAt: -1 }).limit(500);
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
      const newsItem = await this.model.find({ categoryName }).sort({ createdAt: -1 }).limit(40);

      if (newsItem.length == 0) return res.status(404).json({ status: "failed", message: `No news found for this category ${categoryName}` });

      return res.status(200).json({ status: "success", newsItem });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async searchNews(req, res) {
    // The search query is expected in the URL query parameter 'q'
    const searchQuery = req.query.q;

    console.log("Search Query:", searchQuery);

    if (!searchQuery) {
      return res.status(400).json({ status: "failed", message: "Search query 'q' is required." });
    }

    try {
      // Create a case-insensitive regular expression pattern
      const regex = new RegExp(searchQuery, 'i');

      // Use the $or operator to search across multiple fields
      const newsItems = await this.model.find({
        $or: [
          { title: { $regex: regex } }, // Search in the title field
          { content: { $regex: regex } }, // Search in the content field
        ]
      }).sort({ createdAt: -1 }).limit(5);; 

      if (newsItems.length === 0) {
        return res.status(404).json({
          status: "failed",
          message: `No news found matching search term: "${searchQuery}"`
        });
      }

      return res.status(200).json({
        status: "success",
        resultsCount: newsItems.length,
        newsItems
      });

    } catch (error) {
      console.error("❌ Error performing news search:", error.message);
      return res.status(500).json({ message: "Server error during search operation." });
    }



  }

  async createPost(req, res) {
    const { title, categoryName, date, image, content } = req.body;

    // Validate required fields
    if (!title || !categoryName || !date || !content) {
      return res.status(400).json({
        status: "failed",
        message: "Missing required fields: title, categoryName, date, and content are required.",
      });
    }

    try {
      // Check for duplicate title
      const existingPost = await this.model.findOne({ title });
      if (existingPost) {
        return res.status(409).json({
          status: "failed",
          message: "A post with this title already exists.",
        });
      }

      // Map category name to ID
      const categoryId = this.categoryIds[categoryName];
      if (!categoryId) {
        return res.status(400).json({
          status: "failed",
          message: `Invalid category: "${categoryName}". Valid categories: ${Object.keys(this.categoryIds).join(", ")}`,
        });
      }

      // Save the post
      const newPost = await this.model.create({
        title,
        categoryId,
        categoryName,
        date,
        image: image || "",
        content,
      });

      console.log(`✅ Admin created post: "${title}"`);

      return res.status(201).json({
        status: "success",
        message: "Post created successfully!",
        post: newPost,
      });
    } catch (error) {
      console.error("❌ Error creating post:", error.message);
      return res.status(500).json({ message: "Server error while creating post." });
    }
  }

  async deletePost(req, res) {
    const { id } = req.params;
    try {
      const deleted = await this.model.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ status: "failed", message: "Post not found." });
      }
      console.log(`🗑️ Admin deleted post: "${deleted.title}"`);
      return res.status(200).json({ status: "success", message: "Post deleted successfully." });
    } catch (error) {
      console.error("❌ Error deleting post:", error.message);
      return res.status(500).json({ message: "Server error while deleting post." });
    }
  }
}

export default new News();

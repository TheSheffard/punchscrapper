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



  async updateDates(req, res) {
    try {
      const allPosts = await this.model.find(); // Fetch all posts

      const MonthReplacer = (monthName) => {
        switch (monthName) {
          case "January": return "01";
          case "February": return "02";
          case "March": return "03";
          case "April": return "04";
          case "May": return "05";
          case "June": return "06";
          case "July": return "07";
          case "August": return "08";
          case "September": return "09";
          case "October": return "10";
          case "November": return "11";
          case "December": return "12";
          default: return ""; // Return empty string for invalid month
        }
      };

      // Update dates and save them
      for (const post of allPosts) {
        const [day, monthName, year] = post.date.split(" ");
        const monthNumber = MonthReplacer(monthName);
        const newDate = `${year}-${monthNumber}-${day.slice(0, 2)}`;

        // Update the date in the database
        post.date = newDate;

        console.log(post)


        await post.save();
      }

      return res.status(200).json({ message: "Dates updated successfully!" });
    } catch (e) {
      console.error("❌ Error updating dates:", e.message);
      return res.status(500).json({ message: "Server error" });
    }
  }

}

export default new News();

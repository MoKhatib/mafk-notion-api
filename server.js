// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Client } from "@notionhq/client";
import { withRetry } from "./utils/withRetry.js"; // ✅ Correct ESM import

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const {
  PROJECTS_DB,
  DEFAULT_OWNER_ID,
} = process.env;

// 🔧 Helper: Wrap Notion user ID
const asPeople = (userId) => [
  {
    object: "user",
    id: userId,
  },
];

// ✅ POST /projects → Create a project
app.post("/projects", async (req, res) => {
  try {
    const {
      "Project name": projectName,
      Status,
      Description,
      Client,
      Owner,
      Deadline,
    } = req.body;

    if (!projectName || !Status) {
      return res.status(400).json({ error: "Missing required fields: Project name and Status" });
    }

    const response = await withRetry(() =>
      notion.pages.create({
        parent: { database_id: PROJECTS_DB },
        properties: {
          "Project name": {
            title: [{ type: "text", text: { content: projectName } }],
          },
          Status: {
            status: { name: Status },
          },
          Description: Description
            ? {
                rich_text: [{ type: "text", text: { content: Description } }],
              }
            : undefined,
          Client: {
            multi_select: Client && Client.length
              ? Client.map((tag) => ({ name: tag }))
              : [{ name: "Unassigned" }],
          },
          Owner: {
            people: asPeople(Owner || DEFAULT_OWNER_ID),
          },
          Deadline: Deadline
            ? {
                date: { start: Deadline },
              }
            : undefined,
        },
      })
    );

    res.status(200).json({ message: "Project created", data: response });
  } catch (err) {
    console.error("❌ Error creating project:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("MAFK Notion API is running ⚙️");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 MAFK Notion API listening on port ${PORT}`);
});

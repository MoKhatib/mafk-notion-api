import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Client } from "@notionhq/client";
import withRetry from "./utils/withRetry.js"; // ✅ Only import once

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const {
  PROJECTS_DB,
  DEFAULT_OWNER_ID,
} = process.env;

// Helper: Wrap user ID in Notion format
const asPeople = (userId) => [
  {
    object: "user",
    id: userId,
  },
];

// ✅ POST /projects → Create a new Notion project
app.post("/projects", async (req, res) => {
  try {
    const { name, status, description, client } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing required field: name" });
    }

    const response = await withRetry(() =>
      notion.pages.create({
        parent: { database_id: PROJECTS_DB },
        properties: {
          "Project name": {
            title: [{ type: "text", text: { content: name } }],
          },
          Status: {
            status: { name: status || "Planning" },
          },
          Description: description
            ? {
                rich_text: [{ type: "text", text: { content: description } }],
              }
            : undefined,
          Client: {
            multi_select: [{ name: client || "Unassigned" }],
          },
          Owner: {
            people: asPeople(DEFAULT_OWNER_ID),
          },
        },
      })
    );

    res.status(200).json({ message: "Project created", data: response });
  } catch (err) {
    console.error("Error creating project:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Root test endpoint
app.get("/", (req, res) => {
  res.send("MAFK Notion API is running ⚙️");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 MAFK Notion API listening on port ${PORT}`);
});

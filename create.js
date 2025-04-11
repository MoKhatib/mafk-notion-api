import { withRetry } from './utils/withRetry.js';
// create.js
const express = require("express");
const router = express.Router();
const { Client } = require("@notionhq/client");
const withRetry = require("./utils").withRetry;
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.PROJECTS_DB_ID;
const defaultOwner = process.env.DEFAULT_OWNER_ID;

router.post("/projects", async (req, res) => {
  try {
    const { name, description, status, client } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const response = await withRetry(() =>
      notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          "Project name": {
            title: [{ text: { content: name } }]
          },
          "Status": {
            status: {
              name: status || "Planning"
            }
          },
          "Client": {
            multi_select: client ? [{ name: client }] : []
          },
          "Description": {
            rich_text: description
              ? [{ text: { content: description } }]
              : []
          },
          "Owner": {
            people: [{ id: defaultOwner }]
          }
        }
      })
    );

    res.status(200).json({
      message: "✅ Project created successfully",
      projectId: response.id,
      url: response.url
    });
  } catch (error) {
    console.error("❌ Error creating project:", error.message);
    res.status(500).json({ error: "Failed to create project", detail: error.message });
  }
});

module.exports = router;

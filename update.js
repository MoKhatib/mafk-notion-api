// update.js
const express = require("express");
const router = express.Router();
const { Client } = require("@notionhq/client");
const withRetry = require("./utils").withRetry;
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

router.patch("/projects/:id", async (req, res) => {
  const { id } = req.params;
  const {
    status,
    deadline,
    url,
    owner,
    description,
    client
  } = req.body;

  try {
    // Build the update payload dynamically based on input
    const properties = {};

    if (status) {
      properties["Status"] = {
        status: {
          name: status
        }
      };
    }

    if (deadline) {
      properties["Deadline"] = {
        date: {
          start: deadline
        }
      };
    }

    if (url) {
      properties["URL"] = {
        url: url
      };
    }

    if (owner) {
      properties["Owner"] = {
        people: [{ id: owner }]
      };
    }

    if (description) {
      properties["Description"] = {
        rich_text: [{ text: { content: description } }]
      };
    }

    if (client) {
      properties["Client"] = {
        multi_select: [{ name: client }]
      };
    }

    const response = await withRetry(() =>
      notion.pages.update({
        page_id: id,
        properties
      })
    );

    res.status(200).json({
      message: "✅ Project updated successfully",
      updated: response.properties
    });
  } catch (error) {
    console.error("❌ Failed to update project:", error.message);
    res.status(500).json({ error: "Failed to update project", detail: error.message });
  }
});

module.exports = router;

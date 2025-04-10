# 🧠 MAFK – Creative AI OS (v3.6)

MAFK is a creative director-grade backend system powered by OpenAI + Notion.  
It embeds strategy, storytelling, design workflows, and visual thinking directly into your Notion-based projects.

---

## 🚀 Core Features

- ✅ Notion-native Projects & Tasks
- ✅ Auto-embed creative dashboards
- ✅ GPT-enhanced task creation (suggestion toggles)
- ✅ Visual reference gallery & moodboard linking
- ✅ Creative sprint builder with rituals
- ✅ Duplicate block cleaner
- ✅ Reliable metadata editing via retry logic

---

## 🧰 Tech Stack

- Node.js (Express.js)
- Notion API (via @notionhq/client)
- Hosted on Render
- GPT-powered via custom instructions

---

## 📚 Notion Integration

| Asset | ID |
|-------|----|
| Projects DB | `1cfdbda8f07f8113aa23d21d376676ec`  
| Tasks DB | `1cfdbda8f07f81df844ec6976ba9ad93`  
| Visual Gallery DB | `1d1dbda8f07f806eaf99ff83c4a87842`  
| Mood Board Template | `1cfdbda8f07f8027815ce64b448044f6`  

---

## 🛠 Available Endpoints

### 🔧 Projects

- `GET /projects` – List all projects  
- `POST /projects` – Create project + embed moodboard  
- `PATCH /projects/:id` – Update status, deadline, owner, client  
- `POST /projects/:id/embed-summary` – Embed summary toggle block  
- `POST /projects/:id/embed-dashboard` – Embed full creative dashboard  
- `POST /projects/:id/clean-blocks` – Detect repeated toggle blocks  
- `GET /projects/:id/schedule` – Return time-sorted task list  
- `GET /projects/:id/visual-references` – Fetch linked images

### 🔧 Tasks

- `GET /tasks` – All tasks  
- `POST /tasks` – Create task with GPT suggestion toggle  
- `PATCH /tasks/:id` – Update task  
- `PATCH /tasks/:id/status` – Status-only update  
- `GET /tasks/this-week` – Tasks due this week  
- `GET /tasks/overdue` – Past due + incomplete tasks  
- `POST /tasks/:id/brief` – Embed a creative brief  
- `DELETE /pages/:id` – Archive a project or task page

---

## 📄 GPT Embedded Block Labels

- 📄 Project Summary  
- 🎯 Goals & Objectives  
- 💡 Creative Concepts  
- 🔧 Planning the Project  
- 🧪 Sprint Rituals  
- 🪄 AI Prompts / Experiments  
- 🖼️ Mood Board: Project Name  
- 🧠 GPT Suggestions  
- 📝 Creative Brief

---

## 🔁 Retry Logic

All Notion API calls (create, update, embed) are wrapped in `withRetry()`:
- 2 attempts
- 1 second delay

---

## 📦 Folder Structure

. ├── server.js ├── create.js ├── update.js ├── fetch.js ├── delete.js ├── notion.js ├── utils.js ├── .env ├── package.json ├── README.md └── mafk-actions.schema.json


---

## 💡 Suggested Prompts

- “Create a sprint plan for the Shoaib Key Visual project.”  
- “Inject mood board and visual references into the Eid campaign.”  
- “What tasks are overdue this week?”  
- “Show all visuals tagged ‘Motion’ for the Pika video.”

---

## 🧬 Designed for Creative Systems

MAFK v3.6 is your **design operating system** inside Notion — strategy, vision, and execution in one place.

✨ Welcome to creative leadership.

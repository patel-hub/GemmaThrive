# 🌿 GemmaThrive — Offline AI for Productivity & Mental Wellness
GemmaThrive is an offline-first desktop app powered by **Gemma 3n** via Ollama. 

It helps users organize tasks, generate personalized plans, map ideas visually, and reflect through guided journaling — with **zero internet required**.

> 🧠 Built for ADHD, neurodivergent and overwhelmed minds.  
> 💻 Runs entirely on your device using Flask + React + Electron.

<img width="962" height="618" alt="Screenshot 2025-07-28 at 5 48 21 PM" src="https://github.com/user-attachments/assets/0664a9f5-22fb-423d-bd90-77824c8a4389" />

---
## ⚙️ Requirements

- [Node.js](https://nodejs.org/en/) v16+
- [Python 3.8+](https://www.python.org/)
- [Ollama](https://ollama.com/library/gemma3n) (for running Gemma models)
- `gemma3n:e2b` model (≈5.6 GB)

---
## 🧪 Verify Ollama & Model

```bash
ollama list

---
## **🛠️ Project Setup & Local Installation**

### 1. Clone & Navigate

```bash
git clone https://github.com/yourusername/GemmaThrive.git
cd GemmaThrive

### 2. Start the Backend
cd gemma_server
pip install -r requirements.txt
python app.py

> This launches the Flask server locally and interacts with your local Gemma 3n model via Ollama

### 3. Start the Frontend
In a new terminal window:
cd GemmaThrive
npm install
npm run dev

> This launches the React + Vite app at: http://localhost:5173

4. (Optional) Run as Desktop App with Electron
npm run electron 

> This wraps your React + Vite UI into a local desktop window using Electron.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

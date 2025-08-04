# 🌿 GemmaThrive — Offline AI for Productivity & Mental Wellness
GemmaThrive is an offline-first desktop app powered by **Gemma 3n** via Ollama. 

It helps users organize tasks, generate personalized plans, map ideas visually, and reflect through guided journaling — with **zero internet required**.

> 🧠 Built for ADHD, neurodivergent and overwhelmed minds.  
> 💻 Runs entirely on your device using Flask + React + Electron.

<img width="962" height="618" alt="Screenshot 2025-07-28 at 5 48 21 PM" src="https://github.com/user-attachments/assets/0664a9f5-22fb-423d-bd90-77824c8a4389" />

---
## ✨ Core Features

GemmaThrive brings together AI-powered productivity and reflection tools into one seamless offline experience.

---

### ✅ OrganizeMe

A smart workspace to help you **capture, manage, and act** on your thoughts and to-dos.

#### 🗂️ Tasks Tab — Where Sticky Notes Think for Themselves
The **Tasks Tab** is your intelligent, interactive Kanban board — redesigned for minds that need more than checkboxes.

Unlike traditional boards, this one feels **alive**:

- 🧠 **Sticky notes that talk back**: Each task is AI-enabled — tap a card and let **Gemma** suggest the best way to start, break it down into smaller steps, or even reframe your procrastination into action.
  
- 🎨 **Color-coded by priority**: Tasks are automatically styled based on urgency and importance — helping you focus without overthinking.
  
- ✋ **Drag & drop across columns**: Seamlessly move your notes between **To Do**, **In Progress**, **Review**, and **Done**. Each column adapts with smooth animations and modern UI polish.
  
- 🌀 **Visual delight meets productivity**: Tilted sticky notes, hover animations, and pin-style effects turn organization into a calming ritual — not a chore.

> 🔄 **Gemma’s Role**:  
Gemma doesn’t just suggest — she executes. Tap “Let Gemma Help” and she’ll turn your vague goal into an actionable task list tailored to your energy, time, and focus level.
  
> 💡 **The Problem It Solves**: 
Overwhelmed minds often avoid starting. This tab **removes friction** by making task management visual, responsive, and conversational. It’s not just a board — it’s a thinking space that works with you.

  <img width="1186" height="714" alt="Screenshot 2025-08-03 at 5 58 54 PM" src="https://github.com/user-attachments/assets/a354448f-5d93-4d87-ad86-e0e7e3745501" />

---

#### 🧩 Projects Tab - — Where Goals Get Their Own Space
The **Projects Tab** is designed for people juggling multiple initiatives — like work, personal goals, creative ideas, or long-term plans.

Unlike the main **Tasks Tab**, which manages day-to-day stickies on a unified board, Projects Tab lets you **create fully separate boards for each project**, so you can focus deeply without mental clutter.

- ➕ **Manually create projects** and add subtasks at your own pace — or tap into **Gemma’s planning magic**
  
- 🧠 **Let Gemma Plan It**: She’ll instantly generate a structured subtask list based on your project title and description
  
- 📅 **Auto-assigns due dates**: Gemma gives each subtask a reasonable deadline so your goals stay time-bound and not just “someday”
  
- 🗂️ **Dedicated Kanban board for every project**: Drag, edit, and delete subtasks across columns just like in the main board — but scoped to that project alone
  
- ✍️ **Interactive sticky notes**: Tap any subtask to edit it or click **“Break This Down with Gemma”** for even more granular starter steps
  
- 🧩 **Track autonomy**: Treat each project as its own micro-environment with full control and fewer distractions

> 🔄 **Gemma’s Role**:  
She’s your strategic co-pilot. Not only does she generate subtasks based on your project’s scope — she assigns due dates, estimates effort, and lets you further break down tasks with context. You’re never stuck staring at a blank board again.

> 💡 **The Problem It Solves**:  
Big goals often die in general to-do lists. The Projects Tab gives each vision a **home**, and **Gemma turns intentions into timelines**. It’s clarity without chaos — helping you follow through, one board at a time.

<img width="955" height="586" alt="Screenshot 2025-07-28 at 7 05 33 PM" src="https://github.com/user-attachments/assets/f7645402-fed7-4f1e-8854-588c698e4811" />

---

#### 📅 Planner Tab — Your Day, Designed by Gemma

The **Planner Tab** turns your tasks into a visual timeline — so instead of juggling sticky notes and mental to-do lists, you see a clear structure for your day.

- 📆 **Calendar View**: All your tasks (from Tasks Tab and Projects Tab) appear neatly on a calendar, so you can plan visually and intuitively.
- ✨ **“Let Gemma Plan My Day”** button: Tap once, and Gemma will:
  - Pick the most relevant tasks for today
  - Prioritize based on urgency and due dates
  - Break them into time blocks
  - Insert wellness reminders and breathing space
- 🔁 **Offline + Dynamic**: No internet needed — Gemma generates your daily plan locally using your actual task data and due dates
- ✅ **Checklist + Timeline**: Alongside your calendar, you’ll get a step-by-step breakdown of your day’s flow so you always know what to do next
- 🌱 **Includes balance**: Gemma’s plan isn’t just about productivity — it includes wellness suggestions. 

> 🔄 **Gemma’s Role**:  
Gemma becomes your **daily planner**, **wellness coach**, and **task prioritizer** — all in one. She reduces decision fatigue, adapts to your workload, and reminds you to be human, not just productive.

> 💡 **The Problem It Solves**:  
Most planners expect *you* to figure it out. This tab removes the guesswork by letting **Gemma structure your day** in a way that’s achievable, healthy, and motivating — so you can stop stressing and start doing.

<img width="1179" height="714" alt="Screenshot 2025-08-03 at 6 30 52 PM" src="https://github.com/user-attachments/assets/cb7ed786-d5b7-4629-8bb7-e75f84ab983c" />


#### 🧠 MindMap Tab
- Convert any idea into a **visual mind map**
- Thoughtfully organized into sections like subtopics, questions, or categories
- Helps you brainstorm, study, or plan complex ideas visually

---

### ✍️ SupportMe

Your private, judgment-free journaling space with a therapist-like touch.

- Choose built-in journals like Gratitude, Dreams, or create your own
- Get thoughtful, emotionally intelligent prompts generated by Gemma
- Write your entry and receive a **personalized reflection**
- Gemma asks empathetic follow-up questions to deepen your insights


> 🔁 Every tab works **offline**, privately, and seamlessly — giving you an all-in-one assistant for mental clarity and daily productivity.

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
```

---

## **🛠️ Project Setup & Local Installation**

### 1. Clone & Navigate

```bash
git clone https://github.com/yourusername/GemmaThrive.git
cd GemmaThrive
```

### 2. Start the Backend
```bash
cd gemma_server
pip install -r requirements.txt
python app.py
```

> This launches the Flask server locally and interacts with your local Gemma 3n model via Ollama

---

### 3. Start the Frontend

In a **new terminal window**:

```bash
cd GemmaThrive
npm install
npm run dev
```

> This launches the React + Vite app at: http://localhost:5173

---

4. (Optional) Run as Desktop App with Electron
```bash
npm run electron
```

> This wraps your React + Vite UI into a local desktop window using Electron.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

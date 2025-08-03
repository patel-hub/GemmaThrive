from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess, json
import datetime
import re

app = Flask(__name__)
CORS(app)

def call_gemma(prompt: str) -> dict:
    cmd = ["ollama", "run", "gemma3n:e2b", prompt, "--format", "json"]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)

def format_response(mode: str, data: dict) -> str:
    if mode == "journal_reflect":
        def fallback(field, default=""):
            v = data.get(field, "")
            return v if v and str(v).strip() else default

        safe = {
            "reflection": fallback("reflection", ""),
            "insight": fallback("insight", ""),
            "tags": data.get("tags", []),
            "encouragement": fallback("encouragement", ""),
        }
        return json.dumps(safe)
    
    elif mode == "journal_followup":
        response = data.get("response", "Thanks for sharing.")
        next_prompt = data.get("next_prompt", "Would you like to explore anything else?")
        return json.dumps({ "response": response, "next_prompt": next_prompt })


    return data.get("response") or data.get("completion") or json.dumps(data)


def build_prompt(mode: str, user_input: str) -> str:
    if mode == "organize":
        return (
            f"Organize this to-do list into urgent vs important:\n{user_input}\n"
            "Return JSON with keys: urgent (array), important (array), schedule (string)."
        )
    elif mode == "support":
        return (
            f"The user says: \"{user_input}\" and needs a quick mental health reset.\n"
            "Return JSON with keys: exercise (string), affirmation (string)."
        )
    elif mode == "organize_suggest":
        return (
            "You are Gemma, an expert productivity and well-being assistant. "
            "You help users make decisions about what to focus on next—not just by picking the “urgent” task, "
            "but by considering energy, mood, motivation, priorities, and easy wins for building momentum.\n\n"
            "Given this list of tasks (with their text, completion status, and priority), analyze as follows:\n"
            "1. Briefly review the mix of priorities and if any tasks look overwhelming, break the inertia.\n"
            "2. Suggest a task to do next, explaining your reasoning in a way that’s supportive and self-reflective.\n"
            "3. Include a gentle motivational message tailored to the situation.\n\n"
            "Format your response as a JSON object:\n"
            "{\n"
            "  \"suggested_task\": \"Task to do next\",\n"
            "  \"reasoning\": \"Explain why this is the best focus.\",\n"
            "  \"motivational_tip\": \"A sentence that makes the user feel encouraged.\"\n"
            "}\n\n"
            f"Here is the task list (as a JSON array):\n{user_input}"
        )
    elif mode == "planner_day":
        return (
            "You are Gemma, my daily planner assistant.\n"
            "I’ll give you tasks due today and any overdue tasks.\n\n"
            "Please return a JSON object like this:\n"
            "{\n"
            "  \"wellness\": \"One short wellness tip.\",\n"
            "  \"plan\": [\n"
            "    { \"task\": \"(what to do)\", \"reason\": \"(why it's important)\", \"project\": \"(if part of a project)\" },\n"
            "    ...\n"
            "  ],\n"
            "  \"overdue\": [\"task1\", \"task2\"],\n"
            "  \"advice\": \"One short motivational line.\"\n"
            "}\n\n"
            f"Here’s the data:\n{user_input}\n"
            "Only respond with valid JSON. No extra explanation."
        )

    
    elif mode == "mindmap":
        return (
            f"You are an expert planning assistant.\n"
            f"Break down the user's goal: \"{user_input}\" into a structured roadmap.\n"
            f"Respond ONLY in JSON format with the following structure:\n"
            "{\n"
            "  \"title\": \"<Main goal>\",\n"
            "  \"children\": [\n"
            "    {\n"
            "      \"title\": \"<Category or Phase>\",\n"
            "      \"children\": [\"<Step 1>\", \"<Step 2>\", \"...\"]\n"
            "    },\n"
            "    ...\n"
            "  ]\n"
            "}\n\n"
            "Do NOT include any text explanation.\n"
            "Do NOT wrap your response in triple backticks.\n"
            "Return ONLY a valid JSON object using the above format.\n"
            "Ensure 'title' is a string and 'children' is a list."
        )



    elif mode == "journal_reflect":
        entry_data = json.loads(user_input)
        journal_text = entry_data.get("entry", "")
        mood = entry_data.get("mood", "")
        prompt_text = entry_data.get("prompt", "")
        short_note = ""
        if len(journal_text.strip()) < 8:
            short_note = (
                "NOTE: The user's entry is short. If needed, refer to the prompt for context and be especially encouraging."
            )
        return (
            "You are Gemma, a friendly journaling coach. A user has finished writing.\n\n"
            f"Prompt: {prompt_text}\n"
            f"Mood: {mood}\n"
            f"Entry:\n{journal_text}\n\n"
            f"{short_note}\n\n"
            "Respond with:\n"
            "- a short reflection (2-3 sentences max)\n"
            "- optional insight\n"
            "- one tag if applicable\n"
            "- one sentence of encouragement\n\n"
            "Return JSON like:\n"
            "{ \"reflection\": \"...\", \"insight\": \"...\", \"tag\": \"...\", \"encouragement\": \"...\" }"
        )


    elif mode == "journal_followup":
        entry_data = json.loads(user_input)
        journal_text = entry_data.get("entry", "")
        prev_prompt = entry_data.get("last_prompt", "")
        mood = entry_data.get("mood", "")
        user_intent = entry_data.get("last_user_intent", "").strip()

        return (
            "You are Gemma, a warm and emotionally intelligent journaling coach.\n"
            "A user just responded to a journaling prompt. Your job is to gently help them reflect more deeply.\n\n"
            f"Previous prompt: {prev_prompt}\n"
            f"User's mood: {mood}\n"
            f"Conversation so far:\n{journal_text}\n\n"
            f"User's intent (if stated): {user_intent if user_intent else 'Continue reflecting on the current theme'}\n\n"

            "Instructions:\n"
            "1. Respond with one friendly validating sentence (no summarizing)\n\n"
            "2. If the user has clearly shifted topics (e.g., from someone they’re grateful for → general gratitude ideas),\n"
            "   then gracefully move the conversation in that direction.\n"
            "   - DO NOT return to previous topics like people or moments unless the user does first.\n\n"
            "3. Then, ask one **new** follow-up question that builds emotionally or conceptually on what they just said.\n"
            "   - Avoid any repetition in language or structure from earlier prompts.\n"
            "   - Keep it under 20 words, ending with a question mark.\n"
            "   - Great follow-ups often explore meaning, past echoes, impact on identity, or ways to apply the reflection.\n\n"
            "Return only JSON:\n"
            "{\n"
            "  \"response\": \"(Validation + emotional insight)\",\n"
            "  \"next_prompt\": \"(Thoughtful, non-repetitive follow-up question)\"\n"
            "}"
        )



    



    return user_input


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(force=True)
    mode = data.get("mode", "").lower()
    user_input = data.get("input", "").strip()
    if not mode or not user_input:
        return jsonify({"error": "Both 'mode' and 'input' are required."}), 400

    prompt = build_prompt(mode, user_input)
    try:
        raw = call_gemma(prompt)
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Gemma call failed", "details": e.stderr}), 500

    return jsonify({"response": format_response(mode, raw)})


@app.route("/gemma", methods=["POST"])
def gemma_plan():
    data = request.get_json(force=True)
    prompt = data.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "Missing prompt"}), 400

    try:
        raw = call_gemma(prompt)
        if isinstance(raw, str):
            cleaned = re.sub(r"^```json\s*|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
            try:
                parsed = json.loads(cleaned)
                if isinstance(parsed, dict) and "steps" in parsed:
                    return jsonify({"response": parsed["steps"]})
                elif isinstance(parsed, list):
                    return jsonify({"response": parsed})
                else:
                    steps = [s.strip("-*•. \t") for s in cleaned.splitlines() if s.strip()]
                    return jsonify({"response": steps})
            except Exception:
                steps = [s.strip("-*•. \t") for s in cleaned.splitlines() if s.strip()]
                return jsonify({"response": steps})

        if isinstance(raw, dict) and "steps" in raw:
            return jsonify({"response": raw["steps"]})
        elif isinstance(raw, dict):
            return jsonify({"response": list(raw.values())})
        if isinstance(raw, list):
            return jsonify({"response": raw})

        steps = [s.strip("-*•. \t") for s in str(raw).splitlines() if s.strip()]
        return jsonify({"response": steps})

    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Gemma call failed", "details": e.stderr}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/generate_mindmap", methods=["POST"])
def generate_mindmap():
    data = request.get_json(force=True)
    user_input = data.get("input", "").strip()
    if not user_input:
        return jsonify({"error": "Missing input"}), 400

    prompt = (
    f"You are a brainstorming and mind map assistant.\n"
    f"Based on the user's idea: \"{user_input}\", generate a JSON mind map as follows:\n\n"
    "{\n"
    "  \"title\": \"(Short main idea, under 5 words)\",\n"
    "  \"summary\": \"(1–2 sentence summary)\",\n"
    "  \"sections\": [\n"
    "    {\n"
    "      \"title\": \"(Section name, under 4 words)\",\n"
    "      \"description\": \"(1 sentence max, more detail here)\",\n"
    "      \"items\": [\"(short, 2–5 word item)\", ...]\n"
    "    }, ...\n"
    "  ]\n"
    "}\n\n"
    "STRICT RULES:\n"
    "- Every 'title' MUST be under 5 words. No sentences. (Use description for detail.)\n"
    "- Do not repeat the same title anywhere in the mind map.\n"
    "- Every 'description' must be short and to the point, 1 sentence only.\n"
    "- Return ONLY a valid JSON object, nothing else."
)


    try:
        raw = call_gemma(prompt)
        # If already a dict, just use it
        if isinstance(raw, dict):
            response_json = raw
        else:
            # If string, clean and parse
            cleaned = str(raw).strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[len("```json"):].strip()
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()
            response_json = json.loads(cleaned)
        return jsonify({"response": response_json})
    except Exception as e:
        return jsonify({"error": f"Failed to process: {str(e)}"}), 500

   

@app.route("/create_journal", methods=["POST"])
def create_journal():
    data = request.get_json(force=True)
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    frequency = data.get("frequency", "Daily").strip()

    if not title:
        return jsonify({"error": "Title is required."}), 400

    prompt = (
        f"You are an expert journaling coach.\n"
        f"The user wants to create a new journal:\n"
        f"- Title: {title}\n"
        f"- Description: {description}\n"
        f"- Frequency: {frequency}\n\n"
        f"Suggest 3-5 thoughtful **journal prompts** for this new journal.\n"
        f"Each prompt should be **short, emotionally engaging**, and written as a single sentence question.\n"
        f"Avoid long compound sentences or anything over 15 words.\n\n"
        f"Return JSON with: title, description, frequency, prompts (array)."
    )

    try:
        raw = call_gemma(prompt)
        journal = {
            "title": raw.get("title", title),
            "description": raw.get("description", description),
            "frequency": raw.get("frequency", frequency),
            "prompts": raw.get("prompts", [])
        }
        return jsonify(journal)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/gemma_steps", methods=["POST"])
def gemma_steps():
    data = request.get_json(force=True)
    task = data.get("task", "").strip()
    if not task:
        return jsonify({"error": "Missing task"}), 400

    # Build a clear, LLM-friendly prompt
    prompt = (
        f"Break the following task into 3-5 small, actionable starter steps to help me begin. "
        f"Respond only with a JSON array of strings, each being one short step. "
        f"Task: \"{task}\""
    )
    print("Prompt sent to Gemma for steps:\n", prompt)
    try:
        # Call Gemma as before
        cmd = ["ollama", "run", "gemma3n:e2b", prompt, "--format", "json"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("Raw Ollama output:", result.stdout)
        # Try to decode as JSON array
        steps = json.loads(result.stdout)
        print("Steps extracted:", steps)
        if isinstance(steps, list):
            return jsonify({"steps": steps})
        elif isinstance(steps, dict) and "steps" in steps:
            return jsonify({"steps": steps["steps"]})
        else:
            # fallback: try to split lines
            fallback_steps = [line.strip("-*•. \t") for line in result.stdout.splitlines() if line.strip()]
            return jsonify({"steps": fallback_steps})
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/explain_idea", methods=["POST"])
def explain_idea():
    data = request.get_json(force=True)
    idea = data.get("idea", "").strip()
    context = data.get("context", "").strip()
    if not idea:
        return jsonify({"error": "Missing idea"}), 400

    prompt = (
        f"You are Gemma, an expert brainstorming assistant.\n"
        f"Here is the user's brainstorming session context:\n"
        f"{context}\n\n"
        f"The specific sub-idea to explain is: \"{idea}\".\n"
        f"Explain what this sub-idea means in this context, and make your answer actionable and relevant to the user's main goal. "
        f"Then, give a JSON array called 'actionable_steps' with 2-5 next steps to explore this sub-idea (if relevant).\n"
        f"Respond ONLY in this JSON format:\n"
        "{{"
        "  \"explanation\": \"...\","
        "  \"actionable_steps\": [\"step1\", \"step2\", ...]"
        "}}\n"
        "Do NOT return any text or code block outside this JSON."
    )
    try:
        result = call_gemma(prompt)
        # Result should already be a dict, if not parse
        if isinstance(result, dict):
            return jsonify(result)
        elif isinstance(result, str):
            # Try to extract and parse JSON object from string
            cleaned = str(result).strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[len("```json"):].strip()
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()
            obj = json.loads(cleaned)
            return jsonify(obj)
        return jsonify({"explanation": str(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)

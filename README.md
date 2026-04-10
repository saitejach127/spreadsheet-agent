# OmniSheet AI Workspace

OmniSheet is an AI-native spreadsheet application that leverages the [Univer framework](https://univer.ai/) for a rich spreadsheet UI, and empowers it with intelligent, asynchronous agentic workflows. By integrating custom spreadsheet functions with [Google Gemini 2.0 Flash Lite](https://ai.google.dev/) and [Playwright](https://playwright.dev/), OmniSheet can autonomously search the web, scrape results, and clean data directly from the spreadsheet formulas.

## Features

- **Rich Spreadsheet UI**: Built using the `@univerjs/preset-sheets-core` facade for an Excel-like experience.
- **Multi-Model Support via UI**: Choose your AI brain on the fly using a dropdown in the navigation bar! Supports **OpenAI**, **Anthropic**, **Gemini**, and **Local Endpoints** (Ollama, LM Studio).
- **Custom AI Formulas**: Native support for agentic tasks directly in cells.
  - `=AI_SEARCH("Query", "Optional Hint")`: Performs a headless DuckDuckGo Lite search, scrapes the results using Playwright, and passes them to your selected AI to extract the precise answer.
  - `=AI_CLEAN("Messy Data", "Target Format")`: Uses AI to reformat and clean dirty data exactly to your required specification.
- **Asynchronous Execution**: Tasks are dispatched over a real-time `socket.io` connection to an Express/Node.js backend, complete with a task concurrency queue.
- **Dockerized Architecture**: One-command setup using `docker-compose`.

## Architecture Overview

1. **Frontend (`/frontend`)**: 
   - Built with Vite, React 18, and TypeScript.
   - Embeds the Univer spreadsheet via the preset architecture.
   - UI Model Dropdown syncs the active `provider` string back to the formula engine.
2. **Backend (`/backend`)**:
   - Built with Express, TypeScript, and Socket.io.
   - Utilizes `playwright` (Chromium) to execute web scraping tasks in the background.
   - Uses **Vercel AI SDK** to dynamically route prompts to the correct API provider without proxies.

## Setup & Running

1. **Clone the repository**:
   ```bash
   git clone https://github.com/saitejach127/spreadsheet-agent.git
   cd spreadsheet-agent
   ```

2. **Supply your API Keys (`.env`)**:
   Copy `.env.example` to `.env` and fill in whichever keys you want to use.
   ```bash
   cp .env.example .env
   ```
   **Using a Local Server (LM Studio, Ollama) or LiteLLM:** 
   If you want to use local models or a LiteLLM proxy, set the `LOCAL_BASE_URL` inside the `.env` file to your server's endpoint:
   - For **LM Studio**: `http://host.docker.internal:1234/v1`
   - For **Ollama**: `http://host.docker.internal:11434/v1`
   - For **LiteLLM**: `http://host.docker.internal:4000/v1`
   
   *Once configured, select "Local Endpoint" from the UI dropdown.*

3. **Build and start the application**:
   Start both the frontend and backend using Docker Compose. The `--build` tag ensures any local changes to the Dockerfiles are captured.
   ```bash
   docker compose up --build
   ```

4. **Access the workspace**:
   Open your browser and navigate to:
   [http://localhost:5173/](http://localhost:5173/)

## Usage Instructions

Once the spreadsheet is open, try typing the following commands into any empty cell:

**1. AI Web Search**
Need to look up the current exchange rate, capital cities, or latest news?
```excel
=AI_SEARCH("Capital of France")
=AI_SEARCH("Current GDP of Japan", "Only output the number with the $ sign")
```

**2. AI Data Cleaning**
Got a bad data dump? Tell the AI how to format it.
```excel
=AI_CLEAN("PHONE: 123 456 7890", "Format as (123) 456-7890")
=AI_CLEAN("john.doe[at]gmail[dot]com", "Extract clean email address")
```

*Note: While the backend processes the tasks, the cell will briefly display "Loading...". It will seamlessly resolve to the AI's final answer via WebSockets.*

## License
MIT

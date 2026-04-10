# OmniSheet AI Workspace

OmniSheet is an AI-native spreadsheet application that leverages the [Univer framework](https://univer.ai/) for a rich spreadsheet UI, and empowers it with intelligent, asynchronous agentic workflows. By integrating custom spreadsheet functions with [Google Gemini 2.0 Flash Lite](https://ai.google.dev/) and [Playwright](https://playwright.dev/), OmniSheet can autonomously search the web, scrape results, and clean data directly from the spreadsheet formulas.

## Features

- **Rich Spreadsheet UI**: Built using the `@univerjs/preset-sheets-core` facade for an Excel-like experience.
- **Custom AI Formulas**: Native support for agentic tasks directly in cells.
  - `=AI_SEARCH("Query", "Optional Hint")`: Performs a headless DuckDuckGo Lite search, scrapes the results using Playwright, and passes them to Gemini to extract the precise answer.
  - `=AI_CLEAN("Messy Data", "Target Format")`: Uses Gemini to reformat and clean dirty data exactly to your required specification.
- **Asynchronous Execution**: Tasks are dispatched over a real-time `socket.io` connection to an Express/Node.js backend, complete with a task concurrency queue.
- **Dockerized Architecture**: One-command setup using `docker-compose`.

## Architecture Overview

1. **Frontend (`/frontend`)**: 
   - Built with Vite, React 18, and TypeScript.
   - Embeds the Univer spreadsheet via the preset architecture.
   - Registers asynchronous formula functions via the Univer Facade API (`registerAsyncFunction`).
2. **Backend (`/backend`)**:
   - Built with Express, TypeScript, and Socket.io.
   - Houses an in-memory queue to prevent LLM quota exhaustion.
   - Utilizes `playwright` (Chromium) to execute web scraping tasks in the background.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose.
- A free [Google Gemini API Key](https://aistudio.google.com/app/apikey).

## Setup & Running

1. **Clone the repository**:
   ```bash
   git clone https://github.com/saitejach127/spreadsheet-agent.git
   cd spreadsheet-agent
   ```

2. **Supply your Gemini API Key**:
   Export your Gemini API key strictly into your shell environment before starting Docker:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```

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

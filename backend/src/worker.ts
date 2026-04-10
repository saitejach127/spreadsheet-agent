import { chromium } from "playwright";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function connectAndExtract(query: string, instructions?: string) {
  console.log(`Starting search for: ${query}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Use DuckDuckGo lite (plain HTML version, most reliable for scraping)
    const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Grab all visible text from the results page
    const pageText = await page.evaluate(() => {
      // Get all text from result links and snippets
      const elements = document.querySelectorAll("a.result-link, .result-snippet, td.result-snippet, td a.result-link");
      if (elements.length > 0) {
        return Array.from(elements).slice(0, 10).map(el => el.textContent?.trim()).filter(Boolean).join("\n");
      }
      // Fallback: grab all table cell text (DuckDuckGo lite uses tables)
      const cells = document.querySelectorAll("table tr td");
      if (cells.length > 0) {
        return Array.from(cells).slice(0, 20).map(el => el.textContent?.trim()).filter(Boolean).join("\n");
      }
      // Last resort: body text
      return document.body.innerText.slice(0, 3000);
    });

    console.log(`Scraped ${pageText.length} chars of search results`);

    const prompt = `Based on the following search results for the query "${query}", provide a precise answer.
${instructions ? `Additional instructions: "${instructions}"` : "Provide the direct answer."}

Search results:
${pageText.slice(0, 2000)}

IMPORTANT: Respond with ONLY the answer, no extra text. Keep it very short and concise.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });
    
    return {
      text: response.text?.trim() || "No result found",
      source: searchUrl
    };
  } catch (error) {
    console.error("Error in connectAndExtract", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export async function cleanData(inputData: string, instructions: string) {
  const prompt = `Take the following data: "${inputData}"
  
  Clean and reformat it exactly according to these instructions: "${instructions}"
  
  Rules:
  - Respond ONLY with the cleaned data.
  - Do not add any conversational text.
  - If it cannot be formatted, return the original data.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: prompt,
  });

  return response.text?.trim() || inputData;
}

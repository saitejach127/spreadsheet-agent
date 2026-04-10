import { createUniver, defaultTheme, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import "@univerjs/preset-sheets-core/lib/index.css";

import { socket } from "./SocketClient";
import { useEffect, useRef } from "react";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || univerRef.current) return;

    // Initialize Univer core with presets
    const { univer, univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS)
      },
      theme: defaultTheme,
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.current,
        })
      ],
    });
    
    univerRef.current = univer;

    // Wait for Univer to be fully initialized before registering custom formulas
    // The formula registration service is not available until the Steady lifecycle stage
    const disposable = univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, ({ stage }: any) => {
      if (stage === univerAPI.Enum.LifecycleStages.Steady) {
        console.log("Univer reached Steady stage, registering custom AI formulas...");
        
        const formulaEngine = univerAPI.getFormula();

        // =AI_SEARCH("query", "optional instructions")
        formulaEngine.registerAsyncFunction(
          "AI_SEARCH",
          async (...args: any[]) => {
            const query = String(args[0] ?? "");
            const instructions = String(args[1] ?? "");
            if (!query) return "Error: AI_SEARCH requires a query argument";

            console.log(`[AI_SEARCH] query="${query}", instructions="${instructions}"`);

            return new Promise<string>((resolve) => {
              const taskId = `search_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

              const handler = (data: any) => {
                if (data.taskId === taskId) {
                  socket.off("task_result", handler);
                  resolve(data.value ?? "No result");
                }
              };
              socket.on("task_result", handler);

              socket.emit("ai_task", {
                taskId,
                type: "SEARCH",
                args: [query, instructions],
              });

              // Timeout after 120 seconds
              setTimeout(() => {
                socket.off("task_result", handler);
                resolve("Error: AI_SEARCH timed out");
              }, 120_000);
            });
          },
          "Search the web using AI and return an answer. Usage: =AI_SEARCH(\"query\", \"optional instructions\")"
        );

        // =AI_CLEAN("messy data", "target format")
        formulaEngine.registerAsyncFunction(
          "AI_CLEAN",
          async (...args: any[]) => {
            const data = String(args[0] ?? "");
            const format = String(args[1] ?? "");
            if (!data) return "Error: AI_CLEAN requires data argument";

            console.log(`[AI_CLEAN] data="${data}", format="${format}"`);

            return new Promise<string>((resolve) => {
              const taskId = `clean_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

              const handler = (resp: any) => {
                if (resp.taskId === taskId) {
                  socket.off("task_result", handler);
                  resolve(resp.value ?? "No result");
                }
              };
              socket.on("task_result", handler);

              socket.emit("ai_task", {
                taskId,
                type: "CLEAN",
                args: [data, format],
              });

              // Timeout after 60 seconds
              setTimeout(() => {
                socket.off("task_result", handler);
                resolve("Error: AI_CLEAN timed out");
              }, 60_000);
            });
          },
          "Clean or reformat data using AI. Usage: =AI_CLEAN(\"data\", \"target format\")"
        );

        console.log("Custom AI formulas registered successfully!");
        disposable.dispose(); // Only need to run once
      }
    });

    // Create an empty spreadsheet
    univerAPI.createUniverSheet({
      name: "OmniSheet",
      sheetOrder: ["sheet1"],
      sheets: {
        "sheet1": {
          id: "sheet1",
          name: "Sheet1",
          cellData: {
             "0": {
               "0": { v: "Try typing: =AI_SEARCH(\"Capital of France\")", t: 1 }
             }
          }
        }
      }
    });

    return () => {
      univer.dispose();
      univerRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px", background: "#f0f2f5", borderBottom: "1px solid #ccc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#333", fontWeight: 600 }}>OmniSheet</h2>
          <div style={{ fontSize: "0.9rem", color: "#666" }}>
              WebSocket: Connected ⚡ | Use <code>=AI_SEARCH("Query", "Optional Hint")</code> or <code>=AI_CLEAN("Data", "Format")</code>
          </div>
      </div>
      <div 
        ref={containerRef} 
        className="univer-container"
        style={{ flex: 1, position: "relative" }}
      />
    </div>
  );
}

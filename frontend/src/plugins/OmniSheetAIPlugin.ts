import { DependentOn, ICommandService, Inject, Injector, Plugin, UniverInstanceType, IUniverInstanceService } from "@univerjs/core";
import { SetRangeValuesCommand, SetRangeValuesMutation } from "@univerjs/sheets";
import { socket } from "../SocketClient";

export class OmniSheetAIPlugin extends Plugin {
  static override pluginName = "omnisheet-ai-plugin";

  constructor(
    _config: unknown,
    @Inject(Injector) override readonly _injector: Injector,
    @ICommandService private readonly _commandService: ICommandService,
    @IUniverInstanceService private readonly _instanceService: IUniverInstanceService
  ) {
    super();
  }

  override onStarting(): void {
    console.log("OmniSheet AI Plugin starting...");

    // Listen for cell updates to intercept AI commands
    this.disposeWithMe(
      this._commandService.onCommandExecuted((commandInfo) => {
        if (commandInfo.id === SetRangeValuesMutation.id) {
          const params = commandInfo.params as any;
          if (!params || !params.cellValue) return;

          const workbook = this._instanceService.getCurrentUnitForType(UniverInstanceType.UNIVER_SHEET);
          if (!workbook) return;
          const sheetId = params.subUnitId;

          // Check the mutated cells
          for (const rowKey in params.cellValue) {
            for (const colKey in params.cellValue[rowKey]) {
              const cellData = params.cellValue[rowKey][colKey];
              if (cellData && cellData.v && typeof cellData.v === "string") {
                const value = cellData.v.toUpperCase();

                // Simple parser for prototype: =AI_SEARCH("Query", "Instructions")
                if (value.startsWith("=AI_SEARCH") || value.startsWith("=AI_CLEAN")) {
                  const type = value.startsWith("=AI_SEARCH") ? "SEARCH" : "CLEAN";
                  
                  // Extract args using regex (assuming comma separated quoted strings)
                  const argsMatch = value.match(/\((.*)\)/);
                  let args: string[] = [];
                  if (argsMatch && argsMatch[1]) {
                     // VERY basic split, ignoring nested quotes for prototype
                     args = argsMatch[1].split(",").map(s => s.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
                  }

                  const row = parseInt(rowKey, 10);
                  const col = parseInt(colKey, 10);

                  console.log(`Intercepted ${type} task at R${row}C${col} with args:`, args);

                  // Send task to backend
                  socket.emit("ai_task", {
                    sheetId,
                    row,
                    col,
                    type,
                    args
                  });

                  // Set intermediate state (needs to happen asynchronously to avoid mutation loop)
                  setTimeout(() => {
                    this._commandService.executeCommand(SetRangeValuesCommand.id, {
                      subUnitId: sheetId,
                      unitId: workbook.getUnitId(),
                      range: { startRow: row, endRow: row, startColumn: col, endColumn: col },
                      value: {
                        v: "Loading...",
                        t: 1 // string type
                      }
                    });
                  }, 50);
                }
              }
            }
          }
        }
      })
    );

    // Listen for incoming completions from backend
    socket.on("cell_completed", (data) => {
      console.log("Received AI cell completion:", data);
      const workbook = this._instanceService.getCurrentUnitForType(UniverInstanceType.UNIVER_SHEET);
      if (!workbook) return;

      this._commandService.executeCommand(SetRangeValuesCommand.id, {
        subUnitId: data.sheetId,
        unitId: workbook.getUnitId(),
        range: { startRow: data.row, endRow: data.row, startColumn: data.col, endColumn: data.col },
        value: {
           v: data.value,
           t: 1
        }
      });

      // We could add metadata/comments here using Univer comment plugins
    });
  }
}

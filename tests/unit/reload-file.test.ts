import { beforeEach, describe, expect, it, vi } from "vitest";
import { open, save } from "@tauri-apps/plugin-dialog";

const invoke = vi.fn();
const documentSet = vi.fn();
const updateTabContent = vi.fn();
const addTab = vi.fn((_path: string) => "tab-1");
const rebindPath = vi.fn();
let activeTab: { filePath: string } | null = null;

// Node has no DOM for DOMPurify; the renderer is not under test here.
vi.mock("dompurify", () => ({ default: { sanitize: (html: string) => html } }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn(), save: vi.fn(async () => "/docs/chosen.md") }));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => ({ setTitle: async () => {} }) }));
vi.mock("../../src/lib/stores/pinned", () => ({ pinnedFolders: { subscribe: (run: (v: string[]) => void) => (run([]), () => {}) } }));
vi.mock("../../src/lib/stores/recents", () => ({ addRecentFile: vi.fn() }));
vi.mock("../../src/lib/stores/document", () => ({ document: { set: documentSet } }));
vi.mock("../../src/lib/stores/tabs", () => ({
  tabStore: { updateTabContent, addTab, rebindPath, setEditing: vi.fn(), getActiveTab: () => activeTab },
}));

const { reloadFile, openFile, openFileDialog, saveAsNewDocument, watchFile, unwatchFile, getBaseDir } = await import("../../src/lib/tauri/files");

const calls = (cmd: string) => invoke.mock.calls.filter((c) => c[0] === cmd).map((c) => c[1]);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(open).mockReset();
  vi.mocked(save).mockReset().mockResolvedValue("/docs/chosen.md");
  activeTab = null;
  invoke.mockImplementation(async (cmd: string, args: any) => {
    if (cmd === "resolve_path") return args.path;
    if (cmd === "read_markdown_file") return "# from disk";
    if (cmd === "path_exists") return true;
    return undefined;
  });
});

describe("openFileDialog", () => {
  it("enables multi-select and opens every selected file", async () => {
    vi.mocked(open).mockResolvedValue(["/docs/a.md", "/docs/b.md"]);

    await openFileDialog();

    expect(open).toHaveBeenCalledWith({
      multiple: true,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "txt"] }],
    });
    expect(addTab.mock.calls.map(([path]) => path)).toEqual(["/docs/a.md", "/docs/b.md"]);
  });

  it("still opens one path returned as a string", async () => {
    vi.mocked(open).mockResolvedValue("/docs/a.md" as never);

    await openFileDialog();

    expect(addTab.mock.calls.map(([path]) => path)).toEqual(["/docs/a.md"]);
  });

  it("does nothing when the dialog is cancelled", async () => {
    vi.mocked(open).mockResolvedValue(null);

    await openFileDialog();

    expect(addTab).not.toHaveBeenCalled();
    expect(documentSet).not.toHaveBeenCalled();
  });
});

// #97: a reload goes to the tab that owns the file; the screen only repaints
// when that tab is the one being looked at.
describe("reloadFile routing", () => {
  it("updates the owning tab but leaves the screen alone when another tab is active", async () => {
    activeTab = { filePath: "/docs/b.md" };
    await reloadFile("/docs/a.md");
    expect(updateTabContent).toHaveBeenCalledWith("/docs/a.md", "# from disk", expect.any(String), null, expect.any(Number));
    expect(documentSet).not.toHaveBeenCalled();
  });

  it("repaints the screen when the changed file is the active tab", async () => {
    activeTab = { filePath: "/docs/a.md" };
    await reloadFile("/docs/a.md");
    expect(updateTabContent).toHaveBeenCalledTimes(1);
    expect(documentSet).toHaveBeenCalledTimes(1);
    expect(documentSet.mock.calls[0][0]).toMatchObject({ filePath: "/docs/a.md", content: "# from disk" });
  });

  it("leaves the home screen alone when no tab is active", async () => {
    activeTab = null;
    await reloadFile("/docs/a.md");
    expect(updateTabContent).toHaveBeenCalledTimes(1);
    expect(documentSet).not.toHaveBeenCalled();
  });
});

describe("first save of pasted content", () => {
  it("writes the content and rebinds the tab only after choosing a location", async () => {
    await saveAsNewDocument("paste-tab", "# pasted");
    expect(calls("write_markdown_file")).toEqual([{ path: "/docs/chosen.md", content: "# pasted" }]);
    expect(rebindPath).toHaveBeenCalledWith("paste-tab", "/docs/chosen.md", "chosen.md");
  });

  it("leaves the paste untouched when Save As is cancelled", async () => {
    vi.mocked(save).mockResolvedValue(null);
    expect(await saveAsNewDocument("paste-tab", "# pasted")).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
    expect(rebindPath).not.toHaveBeenCalled();
  });

  it("keeps the paste in memory if writing fails", async () => {
    invoke.mockRejectedValue(new Error("write failed"));
    await expect(saveAsNewDocument("paste-tab", "# pasted")).rejects.toThrow("write failed");
    expect(rebindPath).not.toHaveBeenCalled();
  });

  it("does not resolve preview images against a fake filesystem directory", () => {
    expect(getBaseDir("paste://1")).toBe("");
    expect(getBaseDir("/docs/saved.md")).toBe("/docs");
  });
});

describe("watch lifecycle", () => {
  it("starts watching a file when it is opened", async () => {
    await openFile("/docs/a.md");
    expect(calls("watch_file")).toEqual([{ path: "/docs/a.md" }]);
  });

  it("starts watching the chosen path when a new document is saved for the first time", async () => {
    const chosen = await saveAsNewDocument("tab-1", "# draft");
    expect(chosen).toBe("/docs/chosen.md");
    expect(calls("watch_file")).toEqual([{ path: "/docs/chosen.md" }]);
  });

  it("never asks the backend to watch a tab sentinel", () => {
    for (const p of ["paste://1", "new://2", "url://https://x/y.md", ""]) {
      watchFile(p);
      unwatchFile(p);
    }
    expect(invoke).not.toHaveBeenCalled();
  });

  it("unwatches by the same path it watched", () => {
    watchFile("/docs/a.md");
    unwatchFile("/docs/a.md");
    expect(calls("watch_file")).toEqual([{ path: "/docs/a.md" }]);
    expect(calls("unwatch_file")).toEqual([{ path: "/docs/a.md" }]);
  });
});

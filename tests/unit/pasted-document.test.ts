import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("window", { scrollY: 0 });
});

describe("pasted documents", () => {
  it("starts unsaved in View and keeps its text when entering Edit", async () => {
    const { tabStore } = await import("../../src/lib/stores/tabs");
    const id = tabStore.addTab("paste://1", "Pasted", "# pasted", "<h1>pasted</h1>");
    expect(tabStore.getActiveTab()).toMatchObject({ dirty: true, isEditing: false });

    tabStore.setEditing(id, true);
    expect(tabStore.getActiveTab()).toMatchObject({
      editContent: "# pasted", isEditing: true, dirty: true,
    });
  });

  it("still needs saving after edits are undone or the editor is left", async () => {
    const { tabStore } = await import("../../src/lib/stores/tabs");
    const id = tabStore.addTab("paste://1", "Pasted", "# pasted", "");
    tabStore.setEditing(id, true);
    tabStore.updateEditContent(id, "# changed");
    tabStore.updateEditContent(id, "# pasted");
    tabStore.setEditing(id, false);
    expect(tabStore.getActiveTab()!.dirty).toBe(true);

    tabStore.rebindPath(id, "/docs/saved.md", "saved.md");
    tabStore.markSaved(id);
    expect(tabStore.getActiveTab()!.dirty).toBe(false);

    tabStore.updateEditContent(id, "# changed");
    expect(tabStore.getActiveTab()!.dirty).toBe(true);
    tabStore.updateEditContent(id, "# pasted");
    expect(tabStore.getActiveTab()!.dirty).toBe(false);
  });

  // Page components cannot mount in the node unit environment.
  it("enables editing for pastes and routes their first save through Save As", () => {
    const page = readFileSync(resolve("src/routes/+page.svelte"), "utf8");
    const editGate = page.slice(page.indexOf("let canEditActive"), page.indexOf("let currentMode"));
    expect(editGate).toContain("!!activeTab?.filePath");
    expect(editGate).not.toContain('startsWith("paste://")');
    expect(editGate).toContain('!activeTab.filePath.startsWith("url://")');
    expect(page).toMatch(/if \(tab\.filePath\.startsWith\("new:\/\/"\) \|\| tab\.filePath\.startsWith\("paste:\/\/"\)\) \{\s*const saved = await saveAsNewDocument/);
  });
});

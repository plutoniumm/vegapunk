<script lang="ts">
  import { onMount } from "svelte";
  import Reader from "./Reader.svelte";

  // --- Types ---
  type Note = {
    id: string;
    text: string;
    lastModified: number;
    savedIndex: number;
  };

  // --- State ---
  let notes: Note[] = [];
  let activeNoteId: string | null = null;
  let isReading = false;
  let globalWpm = 300; // Persist WPM across notes

  // --- Reactive Derived ---
  $: activeNote = notes.find((n) => n.id === activeNoteId);

  // Sort notes: Newest edited first
  $: sortedNotes = [...notes].sort((a, b) => b.lastModified - a.lastModified);

  // --- Persistence ---
  onMount(() => {
    const stored = localStorage.getItem("rsvp-notes");
    if (stored) {
      notes = JSON.parse(stored);
    } else {
      createNote("Welcome to RSVP Reader! Paste your text here.");
    }

    // Select the first note initially
    if (notes.length > 0 && !activeNoteId) {
      activeNoteId = notes[0].id;
    }
  });

  function saveNotes() {
    localStorage.setItem("rsvp-notes", JSON.stringify(notes));
  }

  // --- Actions ---
  function createNote(initialText = "") {
    const newNote: Note = {
      id: crypto.randomUUID(),
      text: initialText,
      lastModified: Date.now(),
      savedIndex: 0,
    };
    notes = [newNote, ...notes];
    activeNoteId = newNote.id;
    saveNotes();
  }

  function selectNote(id: string) {
    activeNoteId = id;
    isReading = false;
  }

  function updateActiveNote(e: Event) {
    if (!activeNote) return;
    const val = (e.target as HTMLTextAreaElement).value;

    // Update text and timestamp
    notes = notes.map((n) =>
      n.id === activeNoteId ? { ...n, text: val, lastModified: Date.now() } : n,
    );
    saveNotes();
  }

  function deleteNote(e: Event, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this note?")) return;

    notes = notes.filter((n) => n.id !== id);
    if (activeNoteId === id) {
      activeNoteId = notes[0]?.id || null;
    }
    saveNotes();
  }

  // --- Reader Logic ---
  function onReaderClose(e: CustomEvent) {
    isReading = false;
    const { index, wpm } = e.detail;
    globalWpm = wpm;

    // Save progress
    if (activeNote) {
      notes = notes.map((n) =>
        n.id === activeNoteId ? { ...n, savedIndex: index } : n,
      );
      saveNotes();
    }
  }

  // Helpers
  function getPreview(text: string) {
    return text.trim().split("\n")[0] || "New Note";
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="app-container">
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Notes</h2>
      <button class="add-btn" on:click={() => createNote()}>+</button>
    </div>

    <div class="note-list">
      {#each sortedNotes as note (note.id)}
        <div
          class="note-item"
          class:active={note.id === activeNoteId}
          on:click={() => selectNote(note.id)}
        >
          <div class="note-info">
            <span class="note-title">{getPreview(note.text)}</span>
            <span class="note-date">{formatDate(note.lastModified)}</span>
          </div>
          <button class="delete-btn" on:click={(e) => deleteNote(e, note.id)}
            >×</button
          >
        </div>
      {/each}
    </div>
  </aside>

  <main class="editor">
    {#if activeNote}
      <div class="toolbar">
        <span class="status">
          {#if activeNote.savedIndex > 0}
            Resume at word {activeNote.savedIndex}
          {:else}
            Start Reading
          {/if}
        </span>
        <button class="read-btn" on:click={() => (isReading = true)}>
          ⚡ Speed Read
        </button>
      </div>

      <textarea
        value={activeNote.text}
        on:input={updateActiveNote}
        placeholder="Type or paste your content here..."
      ></textarea>
    {:else}
      <div class="empty-state">
        <p>No note selected. Create one to begin.</p>
      </div>
    {/if}
  </main>
</div>

{#if isReading && activeNote}
  <Reader
    text={activeNote.text}
    startIndex={activeNote.savedIndex}
    wpm={globalWpm}
    on:close={onReaderClose}
  />
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif;
    background: #f5f5f5;
    overflow: hidden; /* Prevent body scroll, handled by elements */
  }

  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  /* Sidebar Styles */
  .sidebar {
    width: 280px;
    background: #fff;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }

  .add-btn {
    background: #000;
    color: #fff;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .note-list {
    flex: 1;
    overflow-y: auto;
  }

  .note-item {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    transition: background 0.1s;
  }

  .note-item:hover {
    background: #fafafa;
  }
  .note-item.active {
    background: #eef2ff;
    border-left: 3px solid #000;
  }

  .note-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    overflow: hidden;
  }

  .note-title {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    color: #333;
  }

  .note-date {
    font-size: 0.8rem;
    color: #888;
  }

  .delete-btn {
    background: transparent;
    border: none;
    color: #ccc;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0 5px;
  }
  .delete-btn:hover {
    color: #ff4444;
  }

  /* Editor Styles */
  .editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
  }

  .toolbar {
    padding: 1rem 2rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
  }

  .status {
    font-size: 0.9rem;
    color: #666;
  }

  .read-btn {
    background: #000;
    color: #fff;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .read-btn:hover {
    opacity: 0.9;
  }

  textarea {
    flex: 1;
    border: none;
    resize: none;
    padding: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
    outline: none;
    font-family: inherit;
    color: #333;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
  }
</style>

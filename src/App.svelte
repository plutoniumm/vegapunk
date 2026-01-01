<script lang="ts">
  import { percent, fmt, counter, O } from "./lib/utils";
  import { NoteManager, type Note } from "./lib";
  import Reader from "./Reader.svelte";

  const manager = new NoteManager();
  let notes: Note[] = manager.getAll();
  let activeId: string | null = notes[0]?.id || null;
  let isReading = false;
  let globalWpm = 500;

  $: active = manager.get(activeId!);
  $: sortedNotes = manager.getAll();

  function createNote() {
    const note = manager.create("");
    notes = manager.getAll();
    activeId = note.id;
    isReading = false;
  }

  function select(id: string) {
    activeId = id;
    isReading = false;
  }

  function updateActive(e: Event) {
    if (!active) return;
    manager.update(active.id, (e.target as HTMLTextAreaElement).value);
    notes = manager.getAll();
  }

  function del(e: Event, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this note?")) return;
    manager.delete(id);
    notes = manager.getAll();
    activeId = notes[0]?.id || null;
    isReading = false;
  }

  function onClose(e: CustomEvent) {
    isReading = false;
    const { index, wpm } = e.detail;
    globalWpm = wpm;
    if (active) manager.setSavedIndex(active.id, index);
    notes = manager.getAll();
  }

  function preview(text: string) {
    return text.trim().split("\n")[0] || "New Note";
  }
</script>

<main class="f">
  <aside class="sidebar f-col">
    <header class="f p20 j-bw al-ct">
      <h2 class="m0">Vegapunk</h2>
      <button class="add-btn rx20 f al-ct j-ct" on:click={() => createNote()}>
        +
      </button>
    </header>

    <div class="list">
      {#each sortedNotes as note (note.id)}
        <div
          class="item ptr f j-bw p20"
          class:active={note.id === activeId}
          on:click={() => select(note.id)}
        >
          <div class="info f-col g5 w-100">
            <span class="title fw6">{preview(note.text)}</span>
            <div class="meta f j-bw al-ct">
              <span class="date">{fmt(note.lastModified)}</span>
              <span class="progress fw5">
                {percent(note.text, note.savedIndex)}%
              </span>
            </div>
          </div>
          <button class="delete" on:click={(e) => del(e, note.id)}> × </button>
        </div>
      {/each}
    </div>
  </aside>

  <main class="editor f-col">
    {#if active}
      <div class="toolbar f al-ct g20 j-bw">
        <div>
          {O(active.savedIndex)} / {O(counter(active.text))} words
        </div>

        <button
          class="read f al-ct g5 fw6 rx5"
          on:click={() => (isReading = true)}
        >
          {#if active.savedIndex > 0}
            Resume at word {active.savedIndex}
          {:else}
            Start Reading
          {/if}
        </button>
      </div>

      <textarea
        value={active.text}
        on:input={updateActive}
        placeholder="Type or paste your content here..."
      ></textarea>
    {:else}
      <div class="empty f al-ct j-ct h-100">
        No note selected. Create one to begin.
      </div>
    {/if}
  </main>
</main>

{#if isReading && active}
  <Reader
    text={active.text}
    startIndex={active.savedIndex}
    wpm={globalWpm}
    on:close={onClose}
  />
{/if}

<style>
  :global(body) {
    color: #e0e0e0;
    overflow: hidden;
  }

  main {
    height: 100vh;
    width: 100vw;
  }

  .sidebar {
    border-right: 1px solid #333;
    background: #222;
    width: 280px;
    flex-shrink: 0;
  }

  header {
    border-bottom: 1px solid #333;
  }

  .add-btn {
    border: 1px solid #444;
    background: #222;
    color: #fff;
    width: 30px;
    height: 30px;
    font-size: 1.2rem;

    transition: background 0.2s;
  }

  .add-btn:hover {
    background: #444;
  }

  .list {
    flex: 1;
    overflow-y: auto;
  }

  .item {
    border-bottom: 1px solid #333;
    align-items: flex-start;

    transition: background 0.1s;
  }

  .item:hover {
    background: #222;
  }

  .item.active {
    background: #333;
    border-left: 3px solid #f44;
  }

  .info {
    overflow: hidden;
  }

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    color: #eee;
  }

  .meta {
    font-size: 0.75rem;
    padding-right: 10px;
  }

  .date {
    color: #777;
  }

  .progress {
    color: #f44;
  }

  .delete {
    background: transparent;
    border: none;
    color: #555;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0 5px;
  }

  .delete:hover {
    color: #f44;
  }

  .editor {
    flex: 1;
    background: #222;
  }

  .toolbar {
    border-bottom: 1px solid #333;
    padding: 1rem 2rem;
  }

  .read {
    background: #f44;
    color: #fff;
    padding: 0.6rem 1.2rem;

    transition: opacity 0.2s;
  }

  .read:hover {
    opacity: 0.9;
  }

  textarea {
    flex: 1;
    resize: none;
    padding: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
    font-family: inherit;
    background: #222;
    color: #eee;
  }

  textarea::placeholder {
    color: #555;
  }

  .empty {
    color: #555;
  }
</style>

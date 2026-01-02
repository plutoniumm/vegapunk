<script lang="ts">
  import { writable, type Writable } from "svelte/store";
  import Reader from "./Reader.svelte";
  import { onMount } from "svelte";

  import { percent, fmt, counter, O } from "./lib/utils";
  import { NoteManager, type Note } from "./lib";

  export let frameText = "";
  console.log(frameText);

  let isReading = false;
  let globalWpm = 500;

  let manager: NoteManager;
  let notes: Note[] = [];
  let activeId: string | null = null;
  let active: Writable<Note | null> = writable(null);

  $: sortedNotes = notes;

  let minimalMode = false;
  let minimalNote: Note | null = null;

  onMount(async () => {
    minimalMode = !!frameText;
    if (minimalMode) {
      minimalNote = {
        id: "frame",
        text: frameText,
        lastModified: Date.now(),
        savedIndex: 0,
      };
      active.set(minimalNote);
      return;
    }
    manager = new NoteManager();
    await manager.initialize(frameText);
    await refreshList();

    if (notes.length > 0) {
      activeId = notes[0].id;
      active.set(notes[0]);
    }
  });

  async function refreshList() {
    notes = await manager.getAll();
  }

  async function createNote() {
    if (minimalMode) return;
    const note = await manager.create("");
    await refreshList();

    activeId = note.id;
    active.set(note);
    isReading = false;
  }

  async function select(id: string) {
    if (minimalMode) return;
    activeId = id;

    const note = await manager.get(id);
    active.set(note);
    isReading = false;
  }

  function updateActive(e: Event) {
    const text = (e.target as HTMLTextAreaElement).value;
    if (minimalMode) {
      minimalNote = {
        ...minimalNote!,
        text,
        lastModified: Date.now(),
      };
      active.set(minimalNote);
      return;
    }
    active.update((n) =>
      n
        ? {
            ...n,
            text,
            lastModified: Date.now(),
          }
        : null,
    );

    let current: Note | null = null;
    active.subscribe((v) => (current = v))();

    if (!current) return;

    notes = notes
      .map((n) =>
        n.id === current!.id
          ? {
              ...n,
              text,
              lastModified: Date.now(),
            }
          : n,
      )
      .sort((a, b) => b.lastModified - a.lastModified);

    manager.update(current.id, text);
  }

  async function del(e: Event, id: string) {
    if (minimalMode) return;
    e.stopPropagation();
    if (!confirm("Delete this note?")) return;

    await manager.delete(id);
    await refreshList();

    if (activeId === id) {
      activeId = notes[0]?.id || null;
      active.set(activeId ? await manager.get(activeId) : null);
      isReading = false;
    }
  }

  async function onClose(e: CustomEvent) {
    isReading = false;
    const { index, wpm } = e.detail;
    globalWpm = wpm;

    let current: Note | null = null;
    active.subscribe((v) => (current = v))();

    if (minimalMode) {
      minimalNote = {
        ...minimalNote!,
        savedIndex: index,
      };
      active.set(minimalNote);
      return;
    }

    if (current) {
      await manager.setSavedIndex(current.id, index);

      active.update((n) =>
        n
          ? {
              ...n,
              savedIndex: index,
            }
          : null,
      );
      await refreshList();
    }
  }

  function preview(text: string) {
    return text.trim().split("\n")[0] || "New Note";
  }
</script>

<main class="f {minimalMode ? 'minimal' : ''}">
  {#if !minimalMode}
    <aside class="sidebar f-col">
      <header class="f p20 j-bw al-ct">
        <h2 class="m0">Vegapunk</h2>
        <button class="add-btn rx20 f al-ct j-ct" on:click={createNote}>
          +
        </button>
      </header>

      <div class="list">
        {#each sortedNotes as note (note.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="item ptr f j-bw p10"
            class:active={note.id === activeId}
            on:click={() => select(note.id)}
          >
            <div class="info f-col g5 w-100">
              <span class="title fw6 p5">{preview(note.text)}</span>

              <div class="meta f j-bw p5 al-ct">
                <span class="date">{fmt(note.lastModified)}</span>
                <span class="progress fw5">
                  {percent(note.text, note.savedIndex)}%
                </span>
              </div>
            </div>

            <button class="delete" on:click={(e) => del(e, note.id)}>
              ×
            </button>
          </div>
          <progress
            class="w-100 rx5 d-b"
            value={percent(note.text, note.savedIndex)}
            max={100}
          >
          </progress>
        {/each}
      </div>
    </aside>
  {/if}

  <main class="editor f-col">
    {#if $active}
      <div class="toolbar f al-ct g20 j-bw" class:minimal={minimalMode}>
        <div>
          {O($active?.savedIndex)} / {O(counter($active?.text))} words
        </div>

        <button
          class="read f al-ct g5 fw6 rx5"
          on:click={() => (isReading = true)}
        >
          {#if $active?.savedIndex > 0}
            Resume at word {$active?.savedIndex}
          {:else}
            Start Reading
          {/if}
        </button>
      </div>

      <textarea
        value={$active?.text}
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

{#if isReading && $active}
  <Reader
    text={$active?.text}
    startIndex={$active?.savedIndex}
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
    border-left: 3px solid var(--theme);
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
    color: var(--theme);
  }

  progress {
    height: 3px;
  }
  progress::-webkit-progress-bar {
    background-color: #333;
  }
  progress::-webkit-progress-value {
    background-color: var(--theme);
    border-radius: 5px;
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
    color: var(--theme);
  }

  .editor {
    flex: 1;
    background: #222;
  }

  .toolbar {
    border-bottom: 1px solid #333;
    padding: 1rem 2rem;
  }

  .toolbar.minimal {
    border-bottom: none;
    padding: 1rem 2rem 0 2rem;
  }

  .read {
    background: var(--theme);
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

  .minimal .sidebar,
  .minimal header {
    display: none !important;
  }
</style>

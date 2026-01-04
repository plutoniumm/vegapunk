<script lang="ts">
  import { writable, type Writable } from "svelte/store";
  import Reader from "./Reader.svelte";
  import { onMount } from "svelte";

  import { percent, fmt, counter, O } from "./lib/utils";
  import { NoteManager, type Note } from "./lib";
  import { read } from "./lib/files";

  export let frameText = "";

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

  const refreshList = async () => (notes = await manager.getAll());
  async function createNote(text = "") {
    if (minimalMode) return;
    const note = await manager.create(text);
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

  async function extract(e: Event) {
    if (minimalMode) return;
    const input = e.target as HTMLInputElement;
    const file = input.files[0];
    if (!file) return;

    const text = read(file).then((data) => createNote(data));
    text.then(() => (input.value = ""));
  }
</script>

<main class="f {minimalMode ? 'minimal' : ''}">
  {#if !minimalMode}
    <aside class="sidebar f-col">
      <header class="f p20 j-bw al-ct">
        <h2 class="m0">Vegapunk</h2>

        <div class="add-btn rx5 f">
          <button on:click={createNote}>
            <svg viewBox="0 0 32 32">
              <path
                d="M27 15 L27 30 2 30 2 5 17 5 M30 6 L26 2 9 19 7 25 13 23 Z M22 6 L26 10 Z M9 19 L13 23 Z"
              />
            </svg>
          </button>
          <input
            id="file-upload"
            type="file"
            class="d-n"
            accept=".text/*,.md,.markdown,.txt,.epub"
            on:change={extract}
          />
          <label for="file-upload" class="ptr">
            <svg viewBox="-2 -2 40 40">
              <path d="M6 2 L6 30 26 30 26 10 18 2 Z M18 2 L18 10 26 10" />
            </svg>
          </label>
        </div>
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

            <button class="delete ptr" on:click={(e) => del(e, note.id)}>
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
            Word {$active?.savedIndex} ▶
          {:else}
            Start RSVP
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

<style lang="scss">
  main {
    height: 100vh;
    width: 100vw;
    color: #eee;
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
    text-align: center;
    color: #fff;
    & label,
    & button {
      width: 30px;
      height: 30px;

      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      transition: background 0.2s;
      &:hover {
        background: #444;
      }
    }

    & svg {
      height: 22px;
      width: 22px;
      fill: none;
      stroke: #fff;
      stroke-width: 2;
    }
  }

  .list {
    flex: 1;
    overflow-y: auto;
  }

  .item {
    border-bottom: 1px solid #333;
    align-items: flex-start;
    transition: background 0.1s;
    &:hover {
      background: #222;
    }
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
    color: #555;
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
    &:hover {
      opacity: 0.9;
    }
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

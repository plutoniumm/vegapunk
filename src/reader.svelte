<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { processWord } from "./lib/utils";
  import Engine from "./lib/player";

  export let text: string = "";
  export let startIndex: number = 0;
  export let wpm: number = 300;

  const dispatch = createEventDispatcher();

  let reader = new Engine(() => (reader = reader));

  $: current = processWord(reader.currentWord);

  onMount(() => {
    reader.setWpm(wpm);
    reader.load(text);
    reader.seek(startIndex);
    reader.play();
  });

  function updateWpm(e: Event) {
    const val = +(e.target as HTMLInputElement).value;
    reader.setWpm(val);
  }

  function handleClose() {
    reader.stop();
    dispatch("close", { index: reader.idx, wpm: reader.wpm });
  }

  function keydown(e: KeyboardEvent) {
    if (e.code === "Space") {
      e.preventDefault();
      reader.toggle();
    }

    if (e.code === "Escape") {
      handleClose();
    }

    if (e.code === "ArrowLeft") {
      reader.seek(-20);
    }

    if (e.code === "ArrowRight") {
      reader.seek(20);
    }

    if (e.code === "ArrowUp") {
      if (e.shiftKey) {
        reader.setWpm(reader.wpm + 500);
      } else {
        reader.setWpm(reader.wpm + 50);
      }
    }

    if (e.code === "ArrowDown") {
      if (e.shiftKey) {
        reader.setWpm(reader.wpm - 500);
      } else {
        reader.setWpm(reader.wpm - 50);
      }
    }
  }

  onDestroy(() => reader.stop());
</script>

<svelte:window on:keydown={keydown} />

<div class="overlay p-fix f-col j-ct al-ct">
  <div class="reader p-rel w-100 f j-ct al-ct rx10">
    <div class="guides h-100 p-abs f-col j-bw o-33">
      <div class="top"></div>
      <div class="bottom"></div>
    </div>

    <div class="word-display fw5 f">
      <span class="part d-ib left tr">{current.left}</span>
      <span class="part d-ib pivot tc fw7">{current.pivot}</span>
      <span class="part d-ib right tl">{current.right}</span>
    </div>
  </div>

  <div class="hud p-abs w-100 p20 f-col al-ct g10">
    <div class="progress-bar w-100 rx2">
      <div class="fill h-100" style="width: {reader.progress}%"></div>
    </div>

    <div class="f al-ct g20">
      <span class="info">{reader.idx} / {reader.words.length} words</span>

      <button class="icon-btn" on:click={() => reader.toggle()}>
        {reader.isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      <input
        type="range"
        min="100"
        max="1000"
        step="50"
        value={reader.wpm}
        on:input={updateWpm}
        class="mini-slider"
      />
      <span class="info">{reader.wpm} WPM</span>

      <button class="icon-btn" on:click={handleClose}>✕ Exit</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #222;
    color: #eee;
    z-index: 9999;
  }

  .reader {
    max-width: 800px;
    height: 200px;
    width: 100%;
    background: #222;
  }

  .word-display {
    align-items: baseline;
    font-family: "Courier New", Courier, monospace;
    font-size: 3.5rem;
    line-height: 1;
    white-space: nowrap;
    user-select: none;
  }

  .part.right,
  .part.left {
    width: 300px;
    display: inline-block;
  }

  .part.pivot {
    color: var(--theme);
    width: auto;
    text-align: center;
    font-weight: 700;
  }

  .guides {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
  }

  .top,
  .bottom {
    width: 2px;
    height: 20px;
    background: #fff;
  }

  .hud {
    bottom: 0;
    background: linear-gradient(to top, #000d, #0000);
  }

  .progress-bar {
    background: #444;
    height: 4px;
  }

  .fill {
    background: #ff4444;
    transition: width 0.2s;
  }

  .icon-btn {
    background: transparent;
    color: #fff;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .icon-btn:hover {
    background: #333;
  }

  .mini-slider {
    width: 150px;
  }
  .info {
    color: #888;
    font-variant-numeric: tabular-nums;
  }
</style>

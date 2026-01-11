<script>
  import { onMount } from "svelte";

  import { hash, escape } from "./utils";
  import TTS from "./index";

  export let data = "";

  let parsed = TTS.parse(data);
  let text = parsed.text;
  let currentIndex = parsed.current;

  let rate = 1.2;
  let tts = new TTS({
    text,
    rate,
    voiceName: "Samantha (English (United States))",
  });

  let sentences = tts.sentences;
  let speaking = tts.speaking;
  let progress = tts.progress;

  $: {
    tts.text = text;
    tts.rate = rate;
  }

  const unsubscribe = tts.onChange(() => {
    sentences = tts.sentences;
    currentIndex = tts.currentIndex;
    speaking = tts.speaking;
    progress = tts.progress;

    const line = escape(sentences[currentIndex || 0] || "");
    localStorage.setItem(
      `tts-progress-${hash(text || "")}`,
      JSON.stringify({ line, rate }),
    );

    setTimeout(() => {
      const el = document.getElementById("line-" + currentIndex);

      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  });

  onMount(() => {
    speechSynthesis.onvoiceschanged = () => {};

    const saved = localStorage.getItem(`tts-progress-${hash(text || "")}`);
    if (saved) {
      const parsedSaved = JSON.parse(saved);

      let idx = 0;
      if (parsedSaved.line) {
        idx = sentences.findIndex((s) => escape(s) === parsedSaved.line);
        if (idx <= 0) idx = 0;
      }
      if (typeof parsedSaved.rate === "number") {
        rate = Math.max(0.25, Math.min(2, parsedSaved.rate));
      }

      tts.currentIndex = idx;
      currentIndex = idx;
    }

    const lineEl = document.getElementById("line-" + tts.currentIndex);
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return () => {
      unsubscribe?.();
      tts.cancel();
    };
  });
</script>

<div class="overlay p-fix f-col j-ct al-ct">
  <div class="reader p-rel w-100 f j-ct al-ct rx10">
    <div class="lyrics-window tc w-100">
      {#each sentences as s, i}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          id={"line-" + i}
          class="line o-66"
          class:active={i === currentIndex}
          on:click={() => tts.jumpTo(i)}
        >
          {s}
        </div>
      {/each}
    </div>
  </div>

  <div class="hud p-abs w-100 p20 f-col al-ct g10">
    <div class="progress-bar w-100 rx2">
      <div class="fill h-100" style="width: {progress}%"></div>
    </div>

    <div class="f al-ct g20">
      <span class="info">{currentIndex + 1} / {sentences.length} lines</span>

      <button class="icon-btn" on:click={tts.playpause}>
        {speaking ? "⏸ Pause" : "▶ Play"}
      </button>

      <span class="info">{rate.toFixed(2)}x</span>
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
    max-width: 900px;
    width: 100%;
    min-height: 260px;
    background: #222;
    padding: 10px 0;
  }

  .lyrics-window {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    overflow-y: auto;
    max-height: 20ch;
  }

  .line {
    font-size: 1.4rem;
    line-height: 1.4;
    padding: 0.4rem 0.8rem;
    opacity: 0.6;
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
    cursor: pointer;
  }

  .line.active {
    opacity: 1;
    font-weight: 700;
    color: var(--theme, #2af);
    transform: scale(1.02);
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

  .info {
    color: #888;
    font-variant-numeric: tabular-nums;
  }
</style>

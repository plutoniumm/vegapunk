export default class RSVP {
  words: string[] = [];
  idx: number = 0;
  wpm: number = 500;
  isPlaying: boolean = false;

  private timer: number | undefined;
  private onUpdate: () => void;

  constructor(onUpdate: () => void) {
    this.onUpdate = onUpdate;
  }

  public load (text: string) {
    this.stop();
    this.words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    this.idx = 0;
    this.update();
  }

  public play () {
    if (this.words.length === 0 || this.idx >= this.words.length) return;
    this.isPlaying = true;
    this.update();
    this.tick();
  }

  public pause () {
    this.isPlaying = false;
    clearTimeout(this.timer);
    this.update();
  }

  public toggle () {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public stop () {
    this.isPlaying = false;
    clearTimeout(this.timer);
    this.idx = 0;
    this.update();
  }

  public seek (delta: number) {
    this.pause();
    const newIdx = this.idx + delta;
    this.idx = Math.max(0, Math.min(newIdx, this.words.length - 1));

    this.update();
  }

  public setWpm (newWpm: number) {
    this.wpm = newWpm;
    this.update();
  }

  public get currentWord (): string {
    return this.words[this.idx] || "";
  }

  public get progress (): number {
    if (this.words.length === 0) return 0;
    return (this.idx / this.words.length) * 100;
  }

  private tick () {
    if (!this.isPlaying) return;

    if (this.idx >= this.words.length) {
      this.pause();
      return;
    }

    const word = this.words[this.idx];
    const delay = this.calculateDelay(word);

    this.timer = setTimeout(() => {
      this.idx++;

      if (this.idx >= this.words.length) {
        this.pause();
      } else {
        this.update();
        this.tick();
      }
    }, delay) as unknown as number;
  }

  private calculateDelay (word: string): number {
    const baseDelay = 60000 / this.wpm;

    if (word.endsWith(".") || word.endsWith("!") || word.endsWith("?")) {
      return baseDelay * 2.2;
    }
    if (word.endsWith(",") || word.endsWith(";") || word.endsWith(":")) {
      return baseDelay * 1.5;
    }
    if (word.length > 8) {
      return baseDelay * 1.2;
    }

    return baseDelay;
  }

  private update () {
    this.onUpdate();
  }
}
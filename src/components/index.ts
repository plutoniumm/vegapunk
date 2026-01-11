export default class TTS {
  _text = "";
  _rate = 1.0;
  voiceName = "Samantha (English (United States))";
  sentences: string[] = [];
  currentIndex = 0;
  speaking = false;
  progress = 0;
  listeners = new Set<() => void>();

  constructor({ text = "", rate = 1.0, voiceName = "" } = {}) {
    this._text = text;
    this._rate = rate;
    if (voiceName) this.voiceName = voiceName;
    this.processText();
  }

  get text () {
    return this._text;
  }
  set text (val) {
    if (this._text !== val) {
      this._text = val;
      this.processText();
      this.cancel();
      this.currentIndex = 0;
      this.updateState();
    }
  }

  get rate () {
    return this._rate;
  }
  set rate (val) {
    this._rate = val;
  }

  static parse (data: any) {
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return {
        text: parsed?.text || parsed || "",
        current: parsed?.current || 0,
      };
    } catch {
      return { text: String(data), current: 0 };
    }
  }

  processText () {
    if (!this._text) {
      this.sentences = [];
      return;
    }
    // Simple sentence splitter fallback if Intl.Segmenter fails or basic regex
    this.sentences =
      this._text
        .match(/[^.!?]+[.!?]*/g)
        ?.map((s) => s.trim())
        .filter((s) => s) || [this._text];
  }

  onChange (cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  updateState () {
    this.progress = this.sentences.length
      ? (this.currentIndex / this.sentences.length) * 100
      : 0;

    this.listeners.forEach((cb) => cb());
  }

  speak () {
    this.cancel(false);
    this.speaking = true;
    this.loop();
    this.updateState();
  }

  loop () {
    if (!this.speaking) return;
    if (this.currentIndex >= this.sentences.length) {
      this.speaking = false;
      this.currentIndex = 0;
      this.updateState();
      return;
    }

    const text = this.sentences[this.currentIndex];
    const u = new SpeechSynthesisUtterance(text);
    u.rate = this._rate;

    const voices = speechSynthesis.getVoices();
    const v = voices.find((vn) => vn.name === this.voiceName);
    if (v) u.voice = v;

    u.onend = () => {
      if (this.speaking) {
        this.currentIndex++;
        this.updateState();
        this.loop();
      }
    };

    u.onerror = () => {
      this.speaking = false;
      this.updateState();
    };

    speechSynthesis.speak(u);
  }

  playpause = () => {
    if (this.speaking) {
      this.cancel();
    } else {
      this.speak();
    }
  };

  cancel (notify = true) {
    this.speaking = false;
    speechSynthesis.cancel();
    if (notify) this.updateState();
  }

  jumpTo = (index: number) => {
    this.currentIndex = index;
    this.cancel();
    this.speak();
  };
}

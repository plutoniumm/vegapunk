export type Note = {
  id: string;
  text: string;
  lastModified: number;
  savedIndex: number;
};

export class NoteManager {
  private key = "rsvp-notes";
  notes: Note[] = [];

  constructor() {
    const stored = localStorage.getItem(this.key);
    this.notes = stored ? JSON.parse(stored) : [];
    if (!this.notes.length) this.create("Welcome to RSVP Reader! Paste your text here.");
  }

  private save () {
    localStorage.setItem(this.key, JSON.stringify(this.notes));
  }

  create (text = "") {
    const note: Note = {
      id: crypto.randomUUID(),
      text,
      lastModified: Date.now(),
      savedIndex: 0,
    };
    this.notes = [note, ...this.notes];
    this.save();
    return note;
  }

  update (id: string, text: string, savedIndex?: number) {
    this.notes = this.notes.map(n =>
      n.id === id
        ? { ...n, text, lastModified: Date.now(), savedIndex: savedIndex ?? n.savedIndex }
        : n
    );
    this.save();
  }

  delete (id: string) {
    this.notes = this.notes.filter(n => n.id !== id);
    this.save();
  }

  getAll () {
    return [...this.notes].sort((a, b) => b.lastModified - a.lastModified);
  }

  get (id: string) {
    return this.notes.find(n => n.id === id) || null;
  }

  setSavedIndex (id: string, index: number) {
    this.update(id, this.get(id)?.text || "", index);
  }
}

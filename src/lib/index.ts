export type Note = {
  id: string;
  text: string;
  lastModified: number;
  savedIndex: number;
};

export class NoteManager {
  private dbName = "rsvp-notes-db";
  private storeName = "notes";
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() { }

  async initialize (frameText: string = "Welcome to RSVP Reader! Paste your text here."): Promise<void> {
    this.db = await this.openDB();

    const count = await this.count();
    if (count === 0) {
      await this.create(frameText);
    }
  }

  private openDB (): Promise<IDBDatabase> {
    return new Promise((res, err) => {
      const req = indexedDB.open(this.dbName, this.version);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBreq).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };

      req.onsuccess = () => res(req.result);
      req.onerror = () => err(req.error);
    });
  }

  private getStore (mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db)
      throw new Error("DB uninitialized. initialize() first.");

    const tx = this.db.transaction(this.storeName, mode);
    return tx.objectStore(this.storeName);
  }

  async create (text = ""): Promise<Note> {
    const note: Note = {
      id: crypto.randomUUID(),
      text,
      lastModified: Date.now(),
      savedIndex: 0,
    };

    return new Promise((res, err) => {
      const store = this.getStore("readwrite");
      const req = store.add(note);

      req.onsuccess = () => res(note);
      req.onerror = () => err(req.error);
    });
  }

  async update (id: string, text: string, savedIndex?: number): Promise<void> {
    const note = await this.get(id);
    if (!note) return;

    const updatedNote: Note = {
      ...note,
      text,
      lastModified: Date.now(),
      savedIndex: savedIndex ?? note.savedIndex,
    };

    return new Promise((res, err) => {
      const store = this.getStore("readwrite");
      const req = store.put(updatedNote);

      req.onsuccess = () => res();
      req.onerror = () => err(req.error);
    });
  }

  async delete (id: string): Promise<void> {
    return new Promise((res, err) => {
      const store = this.getStore("readwrite");
      const req = store.delete(id);

      req.onsuccess = () => res();
      req.onerror = () => err(req.error);
    });
  }

  async getAll (): Promise<Note[]> {
    return new Promise((res, err) => {
      const store = this.getStore("readonly");
      const req = store.getAll();

      req.onsuccess = () => {
        const notes = req.result as Note[];
        notes.sort((a, b) => b.lastModified - a.lastModified);
        res(notes);
      };
      req.onerror = () => err(req.error);
    });
  }

  async get (id: string): Promise<Note | null> {
    return new Promise((res, err) => {
      const store = this.getStore("readonly");
      const req = store.get(id);

      req.onsuccess = () => res(req.result || null);
      req.onerror = () => err(req.error);
    });
  }

  async setSavedIndex (id: string, index: number): Promise<void> {
    const note = await this.get(id);
    if (note) {
      await this.update(id, note.text, index);
    }
  }

  private async count (): Promise<number> {
    return new Promise((res, err) => {
      const store = this.getStore("readonly");
      const req = store.count();

      req.onsuccess = () => res(req.result);
      req.onerror = () => err(req.error);
    });
  }
}
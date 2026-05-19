type Listener = () => void;

let hiddenImageId: string | null = null;
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach(listener => listener());
};

export const viewerState = {
  getHiddenImageId(): string | null {
    return hiddenImageId;
  },

  setHiddenImageId(id: string | null): void {
    if (hiddenImageId === id) {
      return;
    }

    hiddenImageId = id;
    notify();
  },

  clearHiddenImage(): void {
    if (hiddenImageId === null) {
      return;
    }

    hiddenImageId = null;
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

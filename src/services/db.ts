interface SearchResult {
  term: string;
  results: string[];
  timestamp: number;
}

export class DBService {
  private static DB_NAME = 'wikipedia-autocomplete';
  private static STORE_NAME = 'search-results';
  private static VERSION = 1;
  private static EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DBService.DB_NAME, DBService.VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DBService.STORE_NAME)) {
          db.createObjectStore(DBService.STORE_NAME, { keyPath: 'term' });
        }
      };
    });
  }

  static async set(term: string, results: string[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DBService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DBService.STORE_NAME);

      const data: SearchResult = {
        term,
        results,
        timestamp: Date.now()
      };

      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async get(term: string): Promise<string[] | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DBService.STORE_NAME], 'readonly');
      const store = transaction.objectStore(DBService.STORE_NAME);
      const request = store.get(term);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result as SearchResult;
        if (!data) {
          resolve(null);
          return;
        }

        // Check if data is expired
        if (Date.now() - data.timestamp > DBService.EXPIRY_TIME) {
          this.remove(term); // Remove expired data
          resolve(null);
          return;
        }

        resolve(data.results);
      };
    });
  }

  static async remove(term: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DBService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DBService.STORE_NAME);
      const request = store.delete(term);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async clearExpired(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DBService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DBService.STORE_NAME);
      const request = store.openCursor();

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const data = cursor.value as SearchResult;
          if (Date.now() - data.timestamp > DBService.EXPIRY_TIME) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
} 
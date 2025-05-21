export class CacheService {
  private static PREFIX = 'autocomplete_';

  static set(key: string, value: unknown, expirationInMinutes: number = 30): void {
    const item = {
      value,
      timestamp: new Date().getTime(),
      expirationInMinutes,
    };
    sessionStorage.setItem(this.PREFIX + key, JSON.stringify(item));
  }

  static get(key: string): unknown | null {
    const item = sessionStorage.getItem(this.PREFIX + key);
    if (!item) return null;

    const parsedItem = JSON.parse(item);
    const now = new Date().getTime();
    const expirationTime = parsedItem.timestamp + (parsedItem.expirationInMinutes * 60 * 1000);

    if (now > expirationTime) {
      this.remove(key);
      return null;
    }

    return parsedItem.value;
  }

  static remove(key: string): void {
    sessionStorage.removeItem(this.PREFIX + key);
  }
} 
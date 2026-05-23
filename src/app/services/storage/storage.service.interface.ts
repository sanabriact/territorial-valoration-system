export interface IStorageService {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    getObject<T = any>(key: string): T | null;
    setObject(key: string, value: any): void;
}
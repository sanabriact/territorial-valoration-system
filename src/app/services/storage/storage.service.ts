import { Injectable } from '@angular/core';
import { IStorageService } from './storage.service.interface';

@Injectable({
    providedIn: 'root',
})
export class StorageService implements IStorageService {
    private readonly fallback = new Map<string, string>();

    getItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return this.fallback.get(key) ?? null;
        }
    }

    setItem(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            this.fallback.set(key, value);
        }
    }

    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            this.fallback.delete(key);
        }
    }

    getObject<T = any>(key: string): T | null {
        const raw = this.getItem(key);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch (e) {
            return null;
        }
    }

    setObject(key: string, value: any): void {
        try {
            this.setItem(key, JSON.stringify(value));
        } catch (e) {
            // ignore
        }
    }
}
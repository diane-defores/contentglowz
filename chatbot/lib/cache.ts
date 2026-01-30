/**
 * Simple in-memory cache for analysis results
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

class AnalysisCache {
	private cache: Map<string, CacheEntry<unknown>> = new Map();
	private defaultTTL = 1000 * 60 * 60; // 1 hour

	private makeKey(type: string, repoUrl?: string): string {
		return repoUrl ? `${type}:${repoUrl}` : type;
	}

	set<T>(type: string, repoUrl: string, data: T, ttl?: number): void {
		const key = this.makeKey(type, repoUrl);
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttl ?? this.defaultTTL,
		});
	}

	get<T>(type: string, repoUrl?: string): T | null {
		const key = this.makeKey(type, repoUrl);
		const entry = this.cache.get(key);
		if (!entry) return null;

		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	has(type: string, repoUrl?: string): boolean {
		return this.get(type, repoUrl) !== null;
	}

	delete(type: string, repoUrl?: string): void {
		const key = this.makeKey(type, repoUrl);
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}
}

export const analysisCache = new AnalysisCache();

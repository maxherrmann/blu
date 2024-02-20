export type BluEventTarget<T extends BluEventMap> =
	new () => TypedEventTarget<T>

type BluEventMap = Record<string, Event>

interface TypedEventTarget<T extends BluEventMap> extends EventTarget {
	addEventListener<K extends keyof T>(
		type: K,
		callback: (
			event: T[K] extends Event ? T[K] : never,
		) => T[K] extends Event ? void : never,
		options?: boolean | AddEventListenerOptions,
	): void

	addEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: EventListenerOptions | boolean,
	): void

	removeEventListener<K extends keyof T>(
		type: K,
		callback: (
			event: T[K] extends Event ? T[K] : never,
		) => T[K] extends Event ? void : never,
		options?: boolean | EventListenerOptions,
	): void

	removeEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: EventListenerOptions | boolean,
	): void

	dispatchEvent(event: T[keyof T]): boolean

	dispatchEvent(event: Event): boolean
}

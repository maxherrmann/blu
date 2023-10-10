import { EventEmitter } from "events"

import type { EventMap, default as TypedEmitter } from "typed-emitter"

/**
 * Blu's event emitter base.
 * @public
 */
export const eventEmitter = EventEmitter as new <
	Events extends EventMap,
>() => TypedEmitter<Events>

/**
 * Generic type-safe event emitter.
 * @public
 */
export class BluEventEmitter<
	Events extends EventMap,
> extends eventEmitter<Events> {}

/**
 * Generic typed event map.
 */
export type { EventMap as BluEvents } from "typed-emitter"

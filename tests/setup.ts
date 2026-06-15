// Import the entry point first to establish the same module evaluation order
// as production. This avoids a circular-import pitfall where the bluetoothState
// singleton would otherwise be constructed before configuration's default
// export is assigned.
import "../src/index"
import { afterEach, beforeEach, vi } from "vitest"
import configuration from "../src/configuration"

// Blu logs to the console by default. Silence it for every test (the spies
// remain assertable, e.g. `expect(console.warn).toHaveBeenCalled()`).
beforeEach(() => {
	vi.spyOn(console, "log").mockImplementation(() => undefined)
	vi.spyOn(console, "debug").mockImplementation(() => undefined)
	vi.spyOn(console, "warn").mockImplementation(() => undefined)
	vi.spyOn(console, "error").mockImplementation(() => undefined)
})

// Blu's configuration and Bluetooth interface are module-level singletons.
// Reset them after every test to keep tests isolated.
afterEach(() => {
	configuration.restoreDefaults()
	configuration.useBluetoothInterface(undefined as never)
	vi.restoreAllMocks()
	vi.useRealTimers()
})

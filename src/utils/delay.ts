/**
 * Delay for a given time.
 * @param time - The time to delay in milliseconds.
 * @returns A promise that resolves after the delay.
 */
export default function delay(time: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}

/**
 * Delay for a given time.
 * @param time - The time to delay in milliseconds.
 * @returns A promise that resolves after the delay.
 */
export default function delay(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}

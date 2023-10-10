import { domNode } from "../../utils"

export default function onLoad() {
	/**
	 * The logic for your optional controls defined in `./index.html`.
	 */

	domNode("#starter-kit-message").innerHTML = "Starter kit ready!"
}

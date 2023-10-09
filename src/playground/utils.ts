import { BluError } from "@blu.js/blu"

/**
 * Set the visibility of a collection of DOM nodes.
 * @param collection - The collection ID.
 * @param isVisible - Set the collection visible?
 */
export function setCollectionVisibility(
	collection: string,
	isVisible: boolean,
) {
	const elements = domNodes(`[${collection}]`)
	const invertedElements = domNodes(`[no-${collection}]`)

	for (const element of elements) {
		element.style.display = isVisible ? "revert" : "none"
		element.setAttribute(collection, String(isVisible))
	}

	for (const element of invertedElements) {
		element.style.display = !isVisible ? "revert" : "none"
		element.setAttribute(collection, String(!isVisible))
	}
}

/**
 * Get a DOM node from a parent node.
 * @param selector - The selector.
 * @param parent - The parent node. Defaults to `document`.
 */
export function domNode<T = HTMLElement>(
	selector: string,
	parent: Document | Element = document,
) {
	return parent.querySelector(selector) as T
}

/**
 * Get a collection of DOM nodes from a parent node.
 * @param selector - The selectors.
 * @param parent - The parent node. Defaults to `document`.
 */
export function domNodes<T = HTMLElement>(
	selectors: string,
	parent: Document | Element = document,
) {
	const domNodes: T[] = []

	parent.querySelectorAll(selectors).forEach(element => {
		domNodes.push(element as T)
	})

	return domNodes
}

/**
 * A generic Blu Playground error.
 */
export class BluPlaygroundError extends BluError {}

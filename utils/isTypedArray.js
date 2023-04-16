export default function isTypedArray(subject) {
	return ArrayBuffer.isView(subject)
}
<img src="https://max-herrmann.com/deploy/blu/blu_logo.png?0" height="100" alt="Blu">

**A JavaScript framework for interacting with Bluetooth Low Energy devices from the web.**

## Compatibility

The Blu Framework is built upon the [Web Bluetooth API](https://webbluetoothcg.github.io/web-bluetooth/) and thus requires the browser it runs on to support it. Some specific functionality may only be available in certain browsers.

[➡️ Can I use Web Bluetooth?](https://caniuse.com/web-bluetooth)

## Installation

### NPM

```sh
npm install @blu.js/blu --save
```

### Download

- [**blu.min.js** (ECMAScript Module)](https://github.com/maxherrmann/blu/releases/latest/download/blu.min.js)
- [**blu.min.cjs** (CommonJS Module)](https://github.com/maxherrmann/blu/releases/latest/download/blu.min.cjs)

### CDN

You can use CDNs like [jsDelivr](https://www.jsdelivr.com/?docs=gh) or [UNPKG](https://unpkg.com/) to access Blu directly from the web.

### Add Blu to your project

#### Web

```js
// my-module.js

import blu from "@blu.js/blu"
// or
import { bluetooth, configuration, scanner /* … */ } from "@blu.js/blu"
```

#### Node.js

```js
// my-module.cjs

const blu = require("@blu.js/blu")
// or
const { bluetooth, configuration, scanner /* … */ } = require("@blu.js/blu")
```

### Use the Blu API in your project

#### `async`/`await` syntax

```js
try {
	let device = await blu.scanner.getDevice()

	if (device !== null) {
		await device.connect()

		// …
	}
}
catch(error) {
	// …
}
```

#### `Promise` syntax

```js
blu.scanner.getDevice()
.then(device => {
	if (device !== null) {
		device.connect()
		.then(() => {
			// …
		})
	}
})
.catch(error => {
	// …
})
```

## Usage

### Integration

The Blu Framework is a hybrid ECMAScript/CommonJS module that exports the following…

#### Properties

- `bluetooth:` [`Bluetooth`](https://github.com/maxherrmann/blu/wiki/bluetooth)
- `configuration:` [`Configuration`](https://github.com/maxherrmann/blu/wiki/configuration)
- `logger:` [`Logger`](https://github.com/maxherrmann/blu/wiki/logger)
- `scanner:` [`Scanner`](https://github.com/maxherrmann/blu/wiki/scanner)
- `version:` [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### Classes

- [`ServiceDescription`](https://github.com/maxherrmann/blu/wiki/ServiceDescription)
- [`CharacteristicDescription`](https://github.com/maxherrmann/blu/wiki/CharacteristicDescription)
- [`DescriptorDescription`](https://github.com/maxherrmann/blu/wiki/DescriptorDescription)
- [`Service`](https://github.com/maxherrmann/blu/wiki/Service)
- [`Characteristic`](https://github.com/maxherrmann/blu/wiki/Characteristic)
- [`Descriptor`](https://github.com/maxherrmann/blu/wiki/Descriptor)
- [`Device`](https://github.com/maxherrmann/blu/wiki/Device)
- [`Request`](https://github.com/maxherrmann/blu/wiki/Request)
- [`Response`](https://github.com/maxherrmann/blu/wiki/Response)
- [`BluError`](https://github.com/maxherrmann/blu/wiki/BluError)

### Usage examples

You can find a collection of examples as part of the Blu Playground at [maxherrmann/blu-playground](https://github.com/maxherrmann/blu-playground).

### Configuring Blu for your own device

You can find a detailed guide on how to configure Blu for your own device in this repo’s wiki.

[**➡️ Open the Guide**](https://github.com/maxherrmann/blu/wiki/Configuring-Blu-for-your-own-device)

## Blu Playground

The playground offers you a way to explore examples and test the [Blu API](#blu-api) through your browser’s console. The playground’s source is hosted at [maxherrmann/blu-playground](https://github.com/maxherrmann/blu-playground).

[**➡️ Open the Playground**](https://playground.blu.js.org/)

## Blu API

### Reference
The Blu API is documented in this repo’s wiki.

[**➡️ Open the API reference**](https://github.com/maxherrmann/blu/wiki#blu-api-reference)

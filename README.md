<p align="center">
	<br>
	<img src="https://max-herrmann.com/deploy/blu/blu_logo.png?0" height="100" alt="Blu">
	<br>
	<i><b>Web Bluetooth — streamlined.</b></i>
	<br>
	<br>
	<a href="https://www.npmjs.org/package/@blu.js/blu">
		<img src="https://img.shields.io/npm/v/@blu.js/blu.svg" alt="npm">
	</a>
	<br>
	<br>
</p>

Blu is a framework that streamlines the integration of Web Bluetooth into your projects. Designed with ease of use in mind, Blu offers a robust and intuitive interface for interacting with Bluetooth Low Energy devices from the web, as well as native platforms that don't support Web Bluetooth (yet).

## Table of contents

-   [**Installation**](#installation)
-   [**Key advantages**](#key-advantages)
    -   [Intuitive interface](#intuitive-interface)
    -   [Intuitive communication model](#intuitive-communication-model)
    -   [Global operation queueing](#global-operation-queueing)
    -   [Support for Web Bluetooth polyfills](#support-for-web-bluetooth-polyfills)
    -   [Type-safety](#type-safety)
-   [**Usage**](#usage)
    -   [Import Blu](#import-blu)
    -   [Use Blu in your project](#use-blu-in-your-project)
-   [**Building**](#building)

## Installation

```sh
npm install @blu.js/blu
```

## Key advantages

### Intuitive interface

Blu takes the complexity out of working with Web Bluetooth by providing extendable base classes for each component of the Bluetooth protocol with intuitive interfaces, streamlining the development process.

**😕 Web Bluetooth API**

```js
await device.gatt.connect()

const service = await device.gatt.getPrimaryService("0x180F")
const characteristic = await service.getCharacteristic("0x2A19")
const value = await characteristic.readValue()

return value
```

**✨ Blu**

```js
await device.connect()

const value = await device.service.characteristic.readValue()

return value
```

### Intuitive communication model

Blu streamlines interactions with Bluetooth characteristics by implementing an intuitive communication model based on requests and responses. Fetching data from a Bluetooth device is made simple: Just `request` it and `await` a response. No need for dealing with adding and removing listeners, parsing data and – if you're using TypeScript – casting values for type safety.

**😕 Web Bluetooth API**

```js
return new Promise(resolve => {
	const onCharacteristicValueChanged = () => {
		/**
		 * Ensure that the characteristic's value actually contains the data
		 * I wanted to get and is not the data for a `writeValueWithResponse`
		 * call that was triggered elsewhere in my application.
		 *
		 * ¯\_(ツ)_/¯
		 */

		/**
		 * Parse the data so that my application can actually use it.
		 *
		 * ¯\_(ツ)_/¯
		 */

		characteristic.removeEventListener(
			"characteristicvaluechanged",
			onCharacteristicValueChanged
		)

		resolve(myData)
	}

	characteristic.addEventListener(
		"characteristicvaluechanged",
		onCharacteristicValueChanged
	)

	// Let the characteristic know what data I want to query.
	const GET_MY_DATA_COMMAND = 1
	const PAYLOAD = [0, 1]

	/**
	 * Ensure that the device is actually ready to receive and send the data,
	 * so that it does not throw errors – telling me that it is busy.
	 *
	 * ¯\_(ツ)_/¯
	 */

	await characteristic.writeValueWithResponse(
		new Uint8Array([MY_DATA_OPCODE, ...PAYLOAD]),
	)
})
```

**✨ Blu**

```js
class MyDataResponse extends BluResponse {
	static validatorFunction(response) {
		return response.data?.getUint8(0) === Command.GET_MY_DATA
	}

	get myData() {
		return this.data?.getUint8(1)
	}
}

class MyDataRequest extends BluRequest {
	responseType = MyDataResponse

	constructor(...payload) {
		super(convert.toUint8Array([Command.GET_MY_DATA, ...payload]))
	}
}

const response = await characteristic.request(new MyDataRequest(0, 1))

return response.myData
```

### Global operation queueing

Blu automatically queues all GATT (Generic Attribute Profile) operations your application triggers. This prevents "device busy" errors and potential data loss and enables you to have truly asynchronous communication with a connected device, globally – across your whole application.

### Support for Web Bluetooth polyfills

Blu can also be used in environments where Web Bluetooth is not natively available, i.e. where `globalThis.navigator.bluetooth` is missing, by allowing you to register a custom polyfill. You could, for example take the [bluetooth-le](https://github.com/capacitor-community/bluetooth-le) plugin for [Capacitor](https://capacitorjs.com/) and to run your Blu-based application on iOS devices, where Web Bluetooth support is still lacking due to WebKit.

### Type-safety

Blu is built with TypeScript, offering you a strongly typed and safely extendable interface.

## Usage

### Import Blu

The Blu framework is packaged as a minified ECMAScript module with source maps.

```js
import blu from "@blu.js/blu"

// blu.bluetooth
// blu.configuration
// blu.convert
// blu.scanner
// blu.version
```

```js
import {
	BluDevice,
	BluCharacteristic,
	bluetooth,
	configuration,
	// ...
} from "@blu.js/blu"
```

### Use Blu in your project

You can find a detailed guide on how to use Blu in this repo's wiki.

[➡ **How to implement your own device with Blu**](https://github.com/maxherrmann/blu/wiki/How-to-implement-your-own-device-with-Blu)

## Building

To start building Blu locally, run the following:

```sh
git clone https://github.com/maxherrmann/blu.git && cd blu && npm i
```

### Build scripts

#### Build package

```sh
npm run build
```

Builds the package with [esbuild](https://esbuild.github.io/) and [DTS Bundle Generator](https://github.com/timocov/dts-bundle-generator).

#### Format code

```sh
npm run format
```

Formats the source code with [Prettier](https://prettier.io/).

#### Lint code

```sh
npm run lint
```

Lints the source code with [ESLint](https://eslint.org/).

#### Lint and fix code

```sh
npm run lint:fix
```

Lints the source code with [ESLint](https://eslint.org/) and fixes all auto-solvable issues.

#### Update dependencies

```sh
npm run update
```

Interactively updates all dependencies with [`ncu`](https://github.com/raineorshine/npm-check-updates).

#### Update dependencies

```sh
npm run update:auto
```

Automatically updates all dependencies with [`ncu`](https://github.com/raineorshine/npm-check-updates).

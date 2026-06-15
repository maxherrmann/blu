<p align="center">
	<br>
	<img src="https://max-herrmann.com/deploy/blu/blu_logo.png?0" height="100" alt="Blu">
	<br>
	<i><b>Web Bluetooth — streamlined.</b></i>
	<br>
	<br>
	<a href="https://www.npmjs.org/package/blutooth">
		<img src="https://img.shields.io/npm/v/blutooth.svg" alt="npm">
	</a>
	<br>
	<br>
</p>

Blu is a framework that streamlines the integration of Web Bluetooth into your projects. Designed with ease of use in mind, Blu offers a robust and intuitive interface for interacting with Bluetooth Low Energy devices from the browser and Node.js.

## Table of contents

- [**Installation**](#installation)
- [**Usage**](#usage)
    - [Import Blu](#import-blu)
    - [Use Blu in your project](#use-blu-in-your-project)
- [**Key advantages**](#key-advantages)
    - [Intuitive interface](#intuitive-interface)
    - [Intuitive communication model](#intuitive-communication-model)
    - [Global operation queueing](#global-operation-queueing)
    - [Running in the browser and Node.js](#running-in-the-browser-and-nodejs)
    - [Support for Web Bluetooth polyfills](#support-for-web-bluetooth-polyfills)
    - [Type-safety](#type-safety)

## Installation

```sh
npm i blutooth
```

## Usage

### Import Blu

```js
import blu from "blutooth"

// blu.bluetooth
// blu.configuration
// blu.convert
// blu.scanner
```

See [index.ts](https://github.com/maxherrmann/blu/blob/main/src/index.ts) for all exports.

### Use Blu in your project

You can find a detailed guide on how to use Blu here:

[➡ **How to implement your own device with Blu**](https://github.com/maxherrmann/blu/wiki/How-to-implement-your-own-device-with-Blu)

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

Blu streamlines interactions with Bluetooth characteristics by implementing an intuitive communication model based on requests and responses. Fetching data from a Bluetooth device is made simple: Just `request` it and `await` a response. No need for dealing with adding and removing listeners, parsing data and—if you’re using TypeScript—casting values for type safety.

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
	 * so that it does not throw errors telling me that it is busy.
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
	static validator(response) {
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

Blu automatically queues all GATT (Generic Attribute Profile) operations your application triggers. This prevents “device busy” errors and potential data loss and enables you to have truly asynchronous communication with a connected device, globally – across your whole application.

### Running in the browser and Node.js

Blu can run in the browser and Node.js out of the box. No special setup required.

> [!NOTE]
> Node.js support is only available in Blu >=5.0.0. When running on Node.js, Blu utilizes the [`webbluetooth`](https://www.npmjs.com/package/webbluetooth) library for Bluetooth communication. The library must be installed manually. Since it offers multiple licensing options, we recommend installing the MIT-licensed version `webbluetooth@latest`.

### Running in browsers that do not support Web Bluetooth

Blu can be used in browser environments where Web Bluetooth is not natively supported by utilizing polyfills. The `blu.configuration.useBluetoothInterface()` allows clients to easily switch to a different Bluetooth interface, in case the default interface (`globalThis.navigator.bluetooth`) is missing.

#### WebKit (`WKWebView`)

To get an application that integrates Blu up and running in WebKit (`WKWebView`), you could—for example—use the [bluetooth-le](https://github.com/capacitor-community/bluetooth-le) plugin for [Capacitor](https://capacitorjs.com/). Just configure Blu to use the plugin’s Bluetooth interface and you’re able to ship your cross-platform app to Apple devices.

### Type-safety

Blu is built with TypeScript, offering you a strongly typed and safely extendable interface.

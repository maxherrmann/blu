<p align="center">
    <br>
    <img src="https://max-herrmann.com/deploy/blu/blu_logo.png?0" height="100" alt="Blu">
    <br>
    <i><b>The type-safe framework for interacting with<br>Bluetooth Low Energy devices from the web.</b></i>
    <br>
    <br>
</p>

## Compatibility

The Blu framework is built upon the [Web Bluetooth API](https://webbluetoothcg.github.io/web-bluetooth/) and thus requires the browser it runs on to support it. Some specific functionality may only be available in certain browsers.

[➡ **Can I use Web Bluetooth?**](https://caniuse.com/web-bluetooth)

## Installation

### NPM

```sh
npm install @blu.js/blu --save
```

### Download

[**➡ blu.min.js** (Minified ECMAScript Module)](https://github.com/maxherrmann/blu/releases/latest/download/blu.min.js)

### CDN

You can use CDNs like [jsDelivr](https://www.jsdelivr.com/?docs=gh) or [UNPKG](https://unpkg.com/) to access Blu directly from the web.

### Add Blu to your project

The Blu framework comes as a minified ECMAScript module with source maps.

-   The default export's signature is documented [here](https://github.com/maxherrmann/blu/wiki/blu._default).
-   All named exports are documented [here](https://github.com/maxherrmann/blu/wiki/blu).

```ts
import blu from "@blu.js/blu"
// or
import {
	BluDevice,
	BluCharacteristic,
	configuration /* ... */,
} from "@blu.js/blu"
```

## Usage

### Use the Blu API in your project

#### `async`/`await` syntax

```ts
try {
	const device = await blu.scanner.getDevice()

	await device.connect()

	// ...
} catch (error) {
	// ...
}
```

#### `Promise` syntax

```ts
blu.scanner
	.getDevice()
	.then(device => {
		device.connect()
		.then(() => {
			// ...
		})
		.catch(error => {
			// ...
		})
	})
	.catch(error => {
		// ...
	})
```

### Usage examples

You can find a collection of usage examples with different complexity as part of the [Blu Playground](#blu-playground) in the [src/playground/examples](https://github.com/maxherrmann/blu/tree/main/src/playground/examples) directory.

## Documentation

### Blu API

[**➡ Reference**](https://github.com/maxherrmann/blu/wiki/blu)

### Guides

[**➡ How to implement your own device with Blu**](https://github.com/maxherrmann/blu/wiki/How-to-implement-your-own-device-with-Blu)

## Blu Playground

The playground offers you a way to explore examples and test Blu within your browser.

[**➡ Blu Playground**](https://blu.js.org/)

The playground exposes [Blu's default export](https://github.com/maxherrmann/blu/wiki/blu._default) as a global variable named `blu`, allowing you to access it from the console. Once a device has been connected, it is available as `device`.

### Examples

The playground features a collection of examples that show how Blu can be used.
You can select an example in the playground's sidebar.

#### [**🧱 Starter Kit**](https://github.com/maxherrmann/blu/tree/main/src/playground/examples/starter-kit)

-   The perfect starting point for integrating your own Bluetooth device with Blu.
-   Does not implement any functionality.

#### [**🔋 Battery**](https://github.com/maxherrmann/blu/tree/main/src/playground/examples/battery)

-   Implementation example for a generic Bluetooth device that provides a standardized battery service.
-   Read your device's battery level and get notified when it changes.
-   Works great with Keyboards, Mice, Controllers, Headphones, ...

#### [**🤖 BBC micro:bit**](https://github.com/maxherrmann/blu-playground/tree/main/examples/microbit) (Work in progress)

-   Implementation example for a [BBC micro:bit](https://www.microbit.org/) device.
-   Implements the [default Bluetooth profile for the BBC micro:bit](https://lancaster-university.github.io/microbit-docs/resources/bluetooth/bluetooth_profile.html).
-   Implementation status:
    -   [x] Device Information Service
    -   [x] Accelerometer Service
    -   [ ] Magnetometer Service
    -   [x] Button Service
    -   [ ] IO Pin Service
    -   [ ] LED Service
    -   [ ] Event Service
    -   [ ] DFU Control Service
    -   [x] Temperature Service
    -   [ ] UART Service
-   Tested with the BBC micro:bit v2 rev. 21.

#### Want to share your example and make it available on [blu.js.org](https://blu.js.org/)?

Feel free to [contribute](https://github.com/maxherrmann/blu-playground/compare)! ❤️

## Building

To build Blu locally, first run the following:

```sh
git clone https://github.com/maxherrmann/blu.git && cd blu && npm i
```

### Build Scripts

#### Run in production mode

```sh
npm start
```

Builds the playground in production mode and launches a local web server that watches for changes.

#### Run in development mode

```sh
npm run dev
```

Builds the playground in development mode and launches a local web server that watches for changes.

#### Build package

```sh
npm run build
```

Builds the package in production mode.

> Building the package in production mode also invokes [`api-extractor`](https://api-extractor.com) to generate the package's `.d.ts` rollup and API documentation, as well as [`api-documenter`](https://api-extractor.com/pages/setup/generating_docs/) to create the sources for this repo's [GitHub wiki](https://github.com/maxherrmann/blu/wiki).

#### Build playground

```sh
npm run build:playground
```

Builds the playground in production mode.

> Only used for building the sources for [blu.js.org](https://blu.js.org/).

#### Format

```sh
npm run format
```

Formats the source code with [Prettier](https://prettier.io/).

#### Lint

```sh
npm run lint
```

Lints the source code with [ESLint](https://eslint.org/).

#### Lint and fix

```sh
npm run lint:fix
```

Lints the source code with [ESLint](https://eslint.org/) and automatically fixes all auto-solvable issues.

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

## Prerequisites

### Get familiar with the concepts of Bluetooth and the Web Bluetooth API

[A Developer's Guide to Bluetooth Technology](https://www.bluetooth.com/blog/a-developers-guide-to-bluetooth/) is a great article from the Bluetooth SIG that should get you started with the basic concepts of Bluetooth. The [Web Bluetooth specification] (https://webbluetoothcg.github.io/web-bluetooth/#introduction) and this [article from web.dev](https://web.dev/bluetooth/) provide you with information about Web Bluetooth and its implementation.

### Get familiar with your device

It is necessary that you know your device's Bluetooth interface to effectively use it with Blu. You need to know the specifications for all Bluetooth services, characteristics, and descriptors you want to implement.

An example of an openly accessible Bluetooth interface is the [default Bluetooth profile for the BBC micro:bit](https://lancaster-university.github.io/microbit-docs/resources/bluetooth/bluetooth_profile.html). If your device's specification is not public, you could try to reverse engineer it. Take a look at the [useful links section](#useful-links) for further reading material.

## Setup

To get started, install Blu with a package manager of your choice, e.g., `npm`.

```sh
npm install @blu.js/blu
```

## Configuration

For this guide, let's assume that our device's physical interface contains a button that can be pressed. Our device's Bluetooth interface features a "Button Service" that contains a single "Button State Characteristic," which indicates the state of the button, i.e., whether it is pressed or not.

### Create a device class

First, we create a `myDevice.ts` file and add a device class that extends `BluDevice`. This class will serve as the main interface for our Bluetooth device.

```ts
// myDevice.ts

import { BluDevice } from "@blu.js/blu"

export default class MyDevice extends BluDevice {}
```

### Describe the device's Bluetooth interface

Next, we need to describe our device's Bluetooth interface to let Blu (and ultimately the Web Bluetooth API) know what capabilities it has. To do this, we combine `BluServiceDescription`s, `BluCharacteristicDescription`s, and `BluDescriptorDescription`s (not in our example) to form a descriptive representation of our interface.

```ts
// myDevice.ts

import {
	BluCharacteristicDescription,
	BluDevice,
	BluServiceDescription,
} from "@blu.js/blu"

export default class MyDevice extends BluDevice {
	static override interface: BluServiceDescription[] = [
		new BluServiceDescription({
			// Service UUID
			uuid: "e95d9882-251d-470a-a062-fa1922dfa9a8",
			// Service identifier
			identifier: "buttonService",
			// Service name
			name: "Button Service",
			// Characteristic descriptions
			characteristicDescriptions: [
				new BluCharacteristicDescription({
					// Characteristic UUID
					uuid: "e95dda90-251d-470a-a062-fa1922dfa9a8",
					// Characteristic identifier
					identifier: "buttonStateCharacteristic",
					// Characteristic name
					name: "Button State Characteristic",
					// Expected characteristic properties
					expectedProperties: {
						// Characteristic is expected to be readable
						read: true,
						// Characteristic is expected to be able to send
						// notifications
						notify: true,
					},
				}),
			],
		}),
	]
}
```

### Create a scanner configuration

We need to make sure that browsers are able to scan our device and filter out all other unrelated Bluetooth devices that may be located in the vicinity. To do that, we provide a device scanner configuration.

The device scanner configuration is essentially the same as the Web Bluetooth API's [requestDevice() options](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#options), except that it infers the `optionalServices` property from our device's `interface`.

```ts
// scannerConfig.ts

import type { BluConfigurationOptions } from "@blu.js/blu"

export const deviceScannerConfig: BluConfigurationOptions["deviceScannerConfig"] =
	{
		filters: [
			// Only scan for devices with the name "My Device"
			{ name: "My Device" },
		],
	}
```

### Implement the device's services and characteristics

Now we create a `button.ts` file and use it to implement our device's button-related service and characteristic.

> For simplicity, we will implement everything we need in one file. You can, of course, split your code into multiple files if you want.

Let's start with the button service:

```ts
// button.ts

import { BluService } from "@blu.js/blu"

export class ButtonService extends BluService {
	declare buttonStateCharacteristic: ButtonStateCharacteristic
}
```

> Wondering about the use of `declare` here? There will be an explanation later in the guide.

Our service does not contain any logic and merely acts as a wrapper for its "Button State Characteristic". So let's implement that one next:

```ts
// button.ts

import { BluCharacteristic, BluService } from "@blu.js/blu"

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {}
```

Now we should add our own logic to the characteristic. First, we need to implement a getter for our device button's state. For this, we make use of [private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields) and [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get), as the button state should be read-only when accessed from outside the `ButtonStateCharacteristic`...

```ts
// button.ts

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {
	#buttonState?: unknown // `unknown` for now

	get buttonState() {
		return this.#buttonState
	}
}
```

Now that we have a property that holds the button's state, we need to update its value based on notifications from the characteristic. This is where requests and responses come into play.

As we _described_ earlier, the "Button State Characteristic" has read and notify properties. This means that we can read the characteristic and have it send notifications to us. In our case, we can read the button's state and get notified when the button's state changes.

To put this into code, we create a class that extends `BluResponse` and holds a single `buttonState` getter.

```ts
// button.ts

import { BluCharacteristic, BluResponse, BluService } from "@blu.js/blu"

// ...

class ButtonStateResponse extends BluResponse {
	get buttonState() {
		// Read the button state from the response's data buffer
		return this.data?.getUint8(0)
	}
}
```

Within the `buttonState` getter, we could further transform the value we read from the `data` buffer. An example would be creating a custom object that holds further information about the button state. This is entirely optional, but it allows us to create an interface that exactly fits our needs. For the sake of simplicity, we will just return the raw value in this example.

Now we instruct our characteristic to treat all incoming notifications, i.e., responses, as `ButtonStateResponse`s by overriding its `responseType` property. We can now also infer the `buttonState` type from our response type. Here's how our characteristic looks now:

```ts
// button.ts

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {
	override responseType = ButtonStateResponse

	#buttonState?: ButtonStateResponse["buttonState"]

	get buttonState() {
		return this.#buttonState
	}
}

// ...
```

The last thing we need to do to finish our implementation of the "Button State Characteristic" is to react to the notifications it sends. For this, we can utilize the `BluCharacteristic`s `beforeReady` hook. `beforeReady` is a virtual function that can be used to execute asynchronous tasks before the characteristic is deemed ready to use.

We first need to read the initial button state from the device to pre-populate the characteristic's `#buttonState` property:

```ts
// button.ts

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {
	override responseType = ButtonStateResponse

	#buttonState?: ButtonStateResponse["buttonState"]

	override async beforeReady() {
		// Read the initial button state
		this.#buttonState = (await this.read<ButtonStateResponse>()).buttonState
	}

	get buttonState() {
		return this.#buttonState
	}
}

// ...
```

The result of `this.read()` resolves to `ButtonStateResponse`, because we instructed the characteristic to treat notifications as `ButtonStateResponse`s by overriding its `responseType` earlier. `this.read<ButtonStateResponse>()` is just the same as `this.read() as ButtonStateResponse`.

Next, we add a listener for our characteristic's `notification` event that updates our `#buttonState` property whenever the device's button state changes.

```ts
// button.ts

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {
	override responseType = ButtonStateResponse

	#buttonState: ButtonStateResponse["buttonState"]

	override async beforeReady() {
		// Read the initial button state
		this.#buttonState = (await this.read<ButtonStateResponse>()).buttonState

		this.addEventListener("notification", event => {
			if (event.response instanceof ButtonStateResponse) {
				// Update button state based on response
				this.#buttonState = event.response.buttonState
			}
		})
	}

	get buttonState() {
		return this.#buttonState
	}
}
```

One thing that might seem odd about our implementation at first glance is the fact that we do not provide a method to our clients that reads the button state from the characteristic, e.g., `readButtonState()`. This, however, is intentional, as we try to perform as few Bluetooth GATT operations, i.e., requests, as possible. Since we always know the button state due to the notifications the characteristic sends, we can keep track of it and provide a `buttonState` getter that returns a cached value instead.

We have now successfully implemented all of our services and characteristics and can move on to the device itself.

### Implement the device's interface

In the same file, we alter the `MyDevice` class to provide a better API to our consumers. Let's add a `buttonState` getter that relays the current button state from the `ButtonStateCharacteristic`.

> You can, of course, choose not to implement a custom device class and only control your device through its services and characteristics. However, this will unnecessarily complicate things for consumers of our API.

Here's an example:

```ts
// myDevice.ts

// ...

class MyDevice extends BluDevice {
	// ...

	declare buttonService: ButtonService

	get buttonState() {
		return this.buttonService.buttonStateCharacteristic.buttonState
	}
}
```

The properties `buttonService` and `buttonService.buttonStateCharacteristic` are dynamically added by Blu when connecting the device. Blu infers the property names from the `identifier` property of their respective interface descriptions. When using TypeScript, we need to make sure our compiler does not complain about this by using `declare` on these properties.

**And that's it! We've successfully implemented our device interface.**

## Scan and connect

Finally, we can acquire our device, connect to it, and interact with it.

```ts
// app.ts

import { configuration, scanner } from "@blu.js/blu"
import MyDevice from "./myDevice"
import { deviceScannerConfig } from "./scannerConfig"

// Configure Blu
configuration.set({
	// Instruct Blu that it should treat scanned devices as our device
	deviceType: MyDevice,
	// Instruct Blu that it should only scan for our device
	deviceScannerConfig: deviceScannerConfig,
})

const device = await scanner.getDevice<MyDevice>()

await device.connect()

console.log(device.buttonState)
```

## Useful links

### Bluetooth specification

-   [Web Bluetooth Registries (Web Bluetooth CG)](https://github.com/WebBluetoothCG/registries)
-   [List of assigned numbers, e.g., GATT UUIDs (Bluetooth SIG)](https://www.bluetooth.com/specifications/assigned-numbers/)
-   [List of public Bluetooth specifications (Bluetooth SIG)](https://www.bluetooth.com/specifications/specs/)

### Reverse engineering of Bluetooth protocols

-   [Bluetooth Reverse Engineering: Tools and Techniques (YouTube)](https://www.youtube.com/watch?v=gCQ3iSy6R-U)
-   [Reverse Engineering a Bluetooth Lightbulb (Medium)](https://urish.medium.com/reverse-engineering-a-bluetooth-lightbulb-56580fcb7546)

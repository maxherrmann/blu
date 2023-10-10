## Requirements

### Get to know the basics of web-based Bluetooth development

[A Developer's Guide to Bluetooth Technology](https://www.bluetooth.com/blog/a-developers-guide-to-bluetooth/) is a great article from the Bluetooth SIG that should get you started with the basic concepts of Bluetooth development. The [Web Bluetooth Specification](https://webbluetoothcg.github.io/web-bluetooth/#introduction) and this [article from web.dev](https://web.dev/bluetooth/) provide you with information about Web Bluetooth and its implementation.

### Get familiar with Blu

In order to effectively use Blu with your device, you should first familiarize yourself with the framework. A good starting point is to check out the [playground](https://blu.js.org/), as well as the source code of some of the [examples](https://github.com/maxherrmann/blu-playground/tree/main/src/playground/examples). To get an overview of Blu's API, consult the [API reference](https://github.com/maxherrmann/blu/wiki/blu).

### Get familiar with your device

It is necessary that you know your device's Bluetooth protocol to effectively use it with Blu. You need to know the specification for all Bluetooth services, characteristics and descriptors you wish to implement.

An example for an openly accessible Bluetooth protocol is the [default Bluetooth profile for the BBC micro:bit](https://lancaster-university.github.io/microbit-docs/resources/bluetooth/bluetooth_profile.html). If your device's specification is not public, you could try to reverse engineer it. Take a look at the [useful links section](#useful-links) for further reading material.

## Setup

This guide utilizes the [playground](https://blu.js.org/) to help you set up and test the configuration for your device. If you already feel comfortable with Blu, you could also implement your device configuration in your own environment right away. If that's the case, you can skip right to the [configuration section](#configuration).

### Clone the Blu repository

Before doing anything else, you should first clone the [Blu repository](https://github.com/maxherrmann/blu) and prepare for building the Blu playground yourself.

```sh
git clone https://github.com/maxherrmann/blu.git && cd blu && npm i
```

### Duplicate the Starter Kit example

After cloning the repository, duplicate the Starter Kit example located in the [`/src/playground/examples/starter-kit` directory](https://github.com/maxherrmann/blu/tree/main/src/playground/examples/starter-kit) and rename it. Choose a name that resembles your device, e.g. `my-device`.

```sh
cp -pr src/playground/examples/starter-kit -T src/playground/examples/my-device
```

### Configure your example

Open the `index.ts` file within the newly created directory and edit the `id`, `name` and `description` properties accordingly. Here's an example:

```ts
// /src/playground/examples/my-device/index.ts

export default {
	id: "my-device",
	name: "My Device",
	description: "Implementation example for my device.",
	bluConfig: bluConfig,
	onLoad: onLoad,
} as BluPlaygroundExample
```

### Expose your example to the playground

In order to make your example available in the playground, you have to expose it. Open the [`/src/playground/examples/index.ts` file](https://github.com/maxherrmann/blu/tree/main/src/playground/examples/index.ts) and add your example's ID, which you chose in the last step, to the the existing array. Here's an example:

```ts
// /src/playground/examples/index.ts

import myDevice from "./my-device"
// ...
export default [, /* ... */ myDevice] as BluPlaygroundExample[]
```

### Launch the playground

To launch the playground locally you can use one of the corresponding [build scripts](https://github.com/maxherrmann/blu#build-scripts). For development purposes it is recommended to run:

```sh
npm run dev
```

This will start a local development server that hosts the playground. You can access it by opening [http://localhost:8080](http://localhost:8080) in a browser that is [compatible](https://github.com/maxherrmann/blu#compatibility) with the Blu framework.

> Note: If `webpack-dev-server` can't use the default port `8080` to host the playground, it may use a different port. In that case, you can find more information in your console.

Your newly created example should be loaded automatically. You can select it in the drop-down located in the playground's sidebar:

<img src="https://max-herrmann.com/deploy/blu/blu-wiki_playground-example-selection.png?0" width="300" alt="Example selection drop-down in the playground">

## Configuration

For this guide, let's assume that our device's physical interface contains a button that can be pressed. Our device's Bluetooth protocol features a "Button Service" that contains a single "Button State Characteristic" which indicates the state of the button, i.e. wether it is pressed or not.

### Create the service descriptions

Open the `bluConfig.ts` within your example's directory and add the description for the Button Service to the `protocol` array. Here's an example:

```ts
// /src/playground/examples/my-device/bluConfig.ts

import {
	BluCharacteristic
    BluCharacteristicDescription,
    BluConfigurationOptions,
    BluDevice,
    BluService,
    BluServiceDescription,
} from "@blu.js/blu"

class MyDevice extends BluDevice {
	static override protocol: BluServiceDescription[] = [
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
                    expectedProperties: "R--N",
                }),
            ],
	    }),
    ]
}

// ...
```

> Note: We didn't set a custom `type` in our descriptions yet, as we will do this later.

The most important and thus also required part of a protocol description is the UUID. Only when you provide a correct UUID, Blu – or in this case Web Bluetooth – will be able to find your device's services, characteristics and descriptors and ultimately interact with them. You can learn more about the signature of each of the protocol descriptions in the [API reference](https://github.com/maxherrmann/blu/wiki/blu).

### Create the scanner configuration

Stay within the `bluConfig.ts` file for now and adjust the exported `scannerConfig`. We need to make sure that your browser is able to discover, i.e. scan, a device of your type, as well as filter all other unrelated devices that may be located in your vicinity. Here's an example on how to do that:

```ts
// /src/playground/examples/my-device/bluConfig.ts

// ...

const scannerConfig: BluConfigurationOptions["scannerConfig"] = {
	filters: [
		{ name: "My Device" }, // Only scan for devices with the name "My Device"
	],
	optionalServices: MyDevice.protocol.map(
		serviceDescription => serviceDescription.uuid,
	),
}

// ...
```

You can learn more about `scannerConfig` options in the [API reference](https://github.com/maxherrmann/blu/wiki/blu.bluconfigurationoptions.scannerconfig).

> Note: If you do not include your device's service UUIDs in the `scannerConfig`, they won't be discoverable and thus be inaccessible when connecting your device.

### Implement the device's services and characteristics

Create a new `button.ts` file within your example's directory. We will use this file to implement your device's button-related service and characteristic.

> Note: For simplicity we will implement everything "button-related" in one file. You can of course split your code into multiple files if you want.

Let's start with the button service:

```ts
// /src/playground/examples/my-device/button.ts

import { BluService } from "@blu.js/blu"

export class ButtonService extends BluService {
	buttonStateCharacteristic!: ButtonStateCharacteristic
}
```

In our device protocol, the service does not contain any logic and merely acts as a wrapper for its button state characteristic. So let's implement that one next:

```ts
// /src/playground/examples/my-device/button.ts

import { BluService, BluCharacteristic } from "@blu.js/blu"

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {}
```

Now we should fill the characteristic with custom logic. First, we need to implement a getter for our device button's state. It is recommend to utilize a combination of [private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields) and [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) here, as the button state should be read-only when accessed from outside the `ButtonStateCharacteristic` class ...

```ts
// /src/playground/examples/my-device/button.ts

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {
	#buttonState?: unknown // unknown for now

	get buttonState() {
		return this.#buttonState
	}
}
```

Now that we have a property that holds the button's state, we need to update its value based on notifications from the device. For this we need to communicate with the device. This is where [`Request`](https://github.com/maxherrmann/blu/wiki/blu.blurequest)s and [`Response`](https://github.com/maxherrmann/blu/wiki/bluresponse)s come in to play.

As we "described" to Blu earlier, the Button State Characteristic has the following properties: Read and Notify (`R--N`). This means that you can read from the characteristic and have it send notifications. In our case, you can read the button's state and get notified when the button's state changes.

As notifications can also be seen as responses from the characteristic, we create a class that extends [`Response`](https://github.com/maxherrmann/blu/wiki/blu.bluresponse). The response holds a single `buttonState` getter.

```ts
// /src/playground/examples/my-device/button.ts

import { BluService, BluCharacteristic, BluResponse } from "@blu.js/blu"

// ...

class ButtonStateResponse extends BluResponse {
	get buttonState() {
		// Read the button state from the response's data buffer
		return this.data?.getUint8(0)
	}
}
```

Within the `buttonState` getter, we could further transform the value we read from the `data` buffer. An example would be creating a custom object that holds further information about the button state. This is entirely optional, but allows us to create an interface that fits our needs. For the sake of simplicity we will just return the raw value in this example.

Now we instruct our characteristic to treat all incoming responses, i.e. notifications, as `ButtonStateResponse`s by overriding the `responseType` property. We can now also infer the `buttonState` type from our response type. Here's how our characteristic should look now:

```ts
// /src/playground/examples/my-device/button.ts

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

The last thing we need to do to finish our implementation of the Button State Characteristic, is to react to the notifications it sends. For this we can utilize the [`beforeReady` hook](https://github.com/maxherrmann/blu/wiki/blu.blucharacteristic.beforeready). `beforeReady` is a virtual function that can be used to executed asynchronous tasks before the characteristic is deemed ready to use.

We first need to read the initial button state from the device to pre-populate the characteristic's `#buttonState` property:

```ts
// /src/playground/examples/my-device/button.ts

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {
	override responseType = ButtonStateResponse

	#buttonState?: ButtonStateResponse["buttonState"]

	override async beforeReady() {
		// Read initial button state.
		this.#buttonState = (await this.read<ButtonStateResponse>()).buttonState
	}

	get buttonState() {
		return this.#buttonState
	}
}

// ...
```

> Note: The result of `this.read()` resolves to `ButtonStateResponse`, because we instructed the characteristic to treat responses from the characteristic as `ButtonStateResponse` by overriding the `responseType` earlier. `this.read<ButtonStateResponse>()` is the same as `this.read() as ButtonStateResponse`.

Next, we add a listener for our characteristic's [`notification` event](https://github.com/maxherrmann/blu/wiki/blu.blucharacteristicevents.notification) that updates our `#buttonState` property whenever the device's button state changes. Optionally, we can also emit a respective event that notifies our API users about button state changes. Here's how our characteristic implementation should look now:

```ts
// /src/playground/examples/my-device/button.ts

// ...

export class ButtonStateCharacteristic extends BluCharacteristic {
	override responseType = ButtonStateResponse

	#buttonState: ButtonStateResponse["buttonState"]

	override async beforeReady() {
		// Read initial button state.
		this.#buttonState = (await this.read<ButtonStateResponse>()).buttonState

		this.on("notification", response => {
            if (response instanceof ButtonStateResponse) {
                // Update button state based on response.
                this.#buttonState = response.buttonState

                // (Optional) Emit `button-state-changed` event from the device object.
                this.service.device.emit("button-state-changed", this.buttonState)
            }
		})
	}

	get buttonState() {
		return this.#buttonState
	}
}

// ...
```

One thing you might be wondering about: Why do we emit the `button-state-changed` event from `this.service.device` and not from `this`, i.e. the `ButtonStateCharacteristic`, itself? Because, by doing so, we are providing a better API to our users.

Here's what a user registering an event listener for our `button-state-changed` event would look like if we emitted it directly from `this`:

```ts
device.buttonService.buttonStateCharacteristic.on(
	"button-state-changed",
	() => {},
)
```

And here's the same thing with us emitting the event from `this.service.device`:

```ts
device.on("button-state-changed", () => {})
```

Our solution has the benefit that it does not require our user to be aware of which services and characteristics our device implements. They can just work with the `device` interface itself. Because every Bluetooth protocol-related class in Blu extends from [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter), we can emit events from each one of them.

Another thing that might seem odd at first, is the fact that we do not provide a function, e.g. `readButtonState()`, to our clients that reads the button state from the characteristic. This is due to the fact that we try to perform as few Bluetooth GATT operations, i.e. requests, as possible. Since we always know the button state because of the notifications the characteristic sends, we can keep track of it and provide our clients with a `buttonState` getter that returns a cached value. Thus we do not need to perform a `read` operation every time the client wants to get the button state.

One last thing we need to do is to include our newly created service and characteristic types in the `bluConfig.ts` file we modified earlier...

```ts
// /src/playground/examples/my-device/bluConfig.ts

// ...

import { ButtonService, ButtonStateCharacteristic } from "./button"

class MyDevice extends BluDevice {
	static override protocol: BluServiceDescription[] = [
		new BluServiceDescription({
			// Service UUID
			uuid: "e95d9882-251d-470a-a062-fa1922dfa9a8",
			// Service identifier
			identifier: "buttonService",
			// Service name
			name: "Button Service",
			// Service type
			type: ButtonService,
			// Characteristic descriptions
			characteristicDescriptions: [
				new BluCharacteristicDescription({
					// Characteristic UUID
					uuid: "e95dda90-251d-470a-a062-fa1922dfa9a8",
					// Characteristic identifier
					identifier: "buttonStateCharacteristic",
					// Characteristic name
					name: "Button State Characteristic",
					// Characteristic type
					type: ButtonStateCharacteristic,
					// Expected characteristic properties
					expectedProperties: "R--N",
				}),
			],
		}),
	]
}

// ...
```

We have now successfully implemented all of our services and characteristics and can move on to the device itself.

### Implement the device's interface

In the same file, alter the `MyDevice` class to provide functionality to our users. Let's add a `buttonState` getter that relays the current button state from the `ButtonStateCharacteristic`. Here's an example:

```ts
// /src/playground/examples/my-device/bluConfig.ts

// ...

class MyDevice extends BluDevice {
	// ...

	buttonService!: ButtonService

	get buttonState() {
		return this.buttonService.buttonStateCharacteristic.buttonState
	}
}
```

> Note: The properties `buttonService` and `buttonStateCharacteristic` are automatically added by Blu when connecting the device. Blu infers the property names from the `identifier` property of their respective protocol descriptions. When using TypeScript, we need to make sure our compiler does not complain about this by adding a non-null assertion to each of these properties.

> Note: You can of course choose to not implement a custom device class and only control your device through its services. In this case, you can remove the `deviceType` property from the default export of the file. However, as we discussed earlier, this is not ideal when it comes to API usability.

**And that's it! We've successfully implemented our device interface.**
<br>
Now let's test what we have written...

## Testing

Open the playground we [launched earlier](#launch-the-playground), select your example in the sidebar and connect your device. Once the device has been connected, its interface will be available as a global variable named `device`.

## Control your device through the UI

You can use the playground's extension mechanism to implement custom UI controls for your device. This is a pretty straightforward process. You can take a look at some of the other [examples](https://github.com/maxherrmann/blu-playground/tree/main/src/playground/examples) to understand how to do that.

## Useful links

### Bluetooth specification

-   [List of assigned numbers, e.g. GATT UUIDs (Bluetooth SIG)](https://www.bluetooth.com/specifications/assigned-numbers/)
-   [List of public Bluetooth specifications (Bluetooth SIG)](https://www.bluetooth.com/specifications/specs/)

### Reverse engineering of Bluetooth protocols

-   [Bluetooth Reverse Engineering: Tools and Techniques (YouTube)](https://www.youtube.com/watch?v=gCQ3iSy6R-U)
-   [Reverse Engineering a Bluetooth Lightbulb (Medium)](https://urish.medium.com/reverse-engineering-a-bluetooth-lightbulb-56580fcb7546)

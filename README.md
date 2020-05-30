# RIjSC

Rather Impractical javaScript Computer, or RIjSC for short, is a demo 16-bit virtual machine written in JavaScript. If it isn't obvious it's by no means meant to be anything serious but I'm not stopping you from writing custom software for it.

# System
The system consists of two parts. rijsc_controller.js and rijsc_core.js

## rijsc_controller.js

Handles DOM interaction and messaging with rijsc_core

## rijsc_core.js

The actual vm is implemented as web-worker that takes tasks from rijsc_controller.js, compiles and runs them, and then sends the result back to rijsc_controller.js

# Program flow

Tasks are created in the main thread like this:

```javascript
let MM = new MessageManager();

let myTask = {
  code: <string>
  type: "frame"|"value"
};

MM.Task(task)
// MM.Task returns a Promise that is resolved when the task has been completed in the rijsc_core
.then(result => doSomething(result))

// result can either be a number if the task type was "value" or it will be a ImageData-object if type was "frame"
// It can also be a String if there was an error, but it will nonetheless be a resolved promise.
```

RIjSC has it's own internal LIFO (Last-In-First-Out) where tasks are stored before running them. The controller may upload multiple tasks to the LIFO even if the earlier ones have not yet been run.

Next the core "scheduler" takes the last task from the LIFO and sends it to compiler. Compiler goes through tokens in the program assembly that translates instructions to js functions and resolves label addresses and then stores the program binary to internal 64kiB ArrayBuffer - (RAM).

If the compilation was successful, the program is next sent to executor which starts execution from RAM[0] and then goes through instructions until it hits instruction `0xa` (`ret`). This raises a internal flag which means to end the program and return.

This successful exection, or runtime error (caused by incorrect assembly) causes the scheduler to first send a message with a result back to the main thread (risjc_controller), then reset internal registers and lastly take the next task in the LIFO.

# Memory

RIjSC has four kinds of memory available.

* Main Memory (`mrd`,`mwr`) - 65kiB Uint8Array. Addressing starts in RAM after program binary. So `mrd ax 0` would read the next byte in RAM after the last byte of program. You can't write to the current program data (please try tho).

* Video memory (`vrd`,`vwr`) - 40kiB Uint8ClampedArray. This is meant to be used as "framebuffer" for "frame" output types, but there's nothing stopping you from using it to store values just like main Memory.

* Stack (`push`,`pop`) - Uint16Array(256) works like a stack, push and pop values from the top.

* Registers (`ax` - `fx`) - 6 x 16bit registers to work with your data. `ax` is the implicit target for all arithmetic instructions (`add`,`sub`,`mul`...) so keep that in mind. `fx` is implictly used to set the amount of bytes to be copied with `vcp` instruction. Other registers don't have any special meaning.

# Instruction documentation

TODO

# Other interesting bits(heh)

## RAM persistence

RAM is not cleared when a new task is loaded. So, while the new task is written to the beginning of RAM overwriting previous data, the old program and it's data will remain in the rest of the RAM. This means that you can jump to arbitrary/undefined instructions using any of the jump instructions.

## printing stuff

RIjSC has no knowledge about how to handle strings. However, it has a built-in data-block stored to load a  8x8 1bpp bitmap of characters A-Z via `chl` instruction. This is used in the sample program to load that data into the beginning of RAM and then used to render that to the 24bpp 100x100 framebuffer via `vwr`-instruction.

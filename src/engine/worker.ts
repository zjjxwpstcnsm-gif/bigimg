import { run, readableError } from "./run";
import type { Job } from "./protocol";
self.onmessage = async (event: MessageEvent<Job>) => {
  try {
    await run(event.data, (message) => {
      if (message.type === "done")
        self.postMessage(message, { transfer: [message.pixels.buffer] });
      else self.postMessage(message);
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: readableError(error),
      detail: String(error),
    });
  }
};

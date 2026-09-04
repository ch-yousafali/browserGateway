import type { PipelineSocket } from "./pipeline.js";
/** Attach an event listener to a PipelineSocket, regardless of whether it
 *  came from Node `ws` (`on`) or a browser/Workers WebSocket
 *  (`addEventListener`). Silent no-op if neither shape is available. */
export declare function listen(sock: PipelineSocket, evt: string, cb: (data: unknown) => void): void;
/** Decode a base64 string to a Uint8Array using the platform's `atob`. Fast
 *  path — no allocation beyond the output buffer. */
export declare function base64ToBytes(b64: string): Uint8Array;
//# sourceMappingURL=socket-io.d.ts.map
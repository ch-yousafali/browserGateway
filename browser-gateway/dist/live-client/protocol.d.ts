import { z } from "zod";
export declare const ClientMessageSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"mouse">;
    event: z.ZodObject<{
        kind: z.ZodEnum<{
            press: "press";
            release: "release";
            move: "move";
            wheel: "wheel";
        }>;
        x: z.ZodNumber;
        y: z.ZodNumber;
        button: z.ZodOptional<z.ZodEnum<{
            none: "none";
            left: "left";
            right: "right";
            middle: "middle";
        }>>;
        modifiers: z.ZodOptional<z.ZodNumber>;
        clickCount: z.ZodOptional<z.ZodNumber>;
        deltaX: z.ZodOptional<z.ZodNumber>;
        deltaY: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"key">;
    event: z.ZodObject<{
        kind: z.ZodEnum<{
            down: "down";
            up: "up";
            char: "char";
        }>;
        text: z.ZodOptional<z.ZodString>;
        code: z.ZodOptional<z.ZodString>;
        key: z.ZodOptional<z.ZodString>;
        keyCode: z.ZodOptional<z.ZodNumber>;
        modifiers: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"navigate">;
    url: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodEnum<{
        back: "back";
        forward: "forward";
        reload: "reload";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"close">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"setViewport">;
    width: z.ZodNumber;
    height: z.ZodNumber;
    deviceScaleFactor: z.ZodOptional<z.ZodNumber>;
    mobile: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"paste">;
    text: z.ZodString;
}, z.core.$strip>], "type">;
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
/** Server→client metadata frame (binary frames carry image bytes only). */
export interface ServerFrameMetaMessage {
    type: "frameMeta";
    deviceWidth: number;
    deviceHeight: number;
    scrollX: number;
    scrollY: number;
}
/** Server→client URL change announcement. */
export interface ServerUrlMessage {
    type: "url";
    url: string;
}
/** Server→client error notification before close. */
export interface ServerErrorMessage {
    type: "error";
    code: string;
    message: string;
}
/** Server→client warning that the keep-alive timer is about to expire. */
export interface ServerExpiringMessage {
    type: "expiring";
    secondsRemaining: number;
}
/** Server→client notification that the keep-alive timer has expired. Session
 *  is closed immediately after this message. */
export interface ServerExpiredMessage {
    type: "expired";
}
export type ServerControlMessage = ServerFrameMetaMessage | ServerUrlMessage | ServerErrorMessage | ServerExpiringMessage | ServerExpiredMessage;
//# sourceMappingURL=protocol.d.ts.map
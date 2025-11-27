export type ToolError = {
    code: string;
    message: string;
    details?: unknown;
};
export declare const E: {
    readonly REDIS_UNAVAILABLE: "ERR_REDIS_UNAVAILABLE";
    readonly DOCKER_NOT_AVAILABLE: "ERR_DOCKER_NOT_AVAILABLE";
    readonly PLAYWRIGHT_TIMEOUT: "ERR_PLAYWRIGHT_TIMEOUT";
    readonly EXTERNAL_TOOL_MISSING: "ERR_EXTERNAL_TOOL_MISSING";
    readonly RATE_LIMITED: "ERR_RATE_LIMITED";
    readonly UNKNOWN_TOOL: "ERR_UNKNOWN_TOOL";
    readonly RUN_NOT_FOUND: "ERR_RUN_NOT_FOUND";
    readonly UNEXPECTED: "ERR_UNEXPECTED";
};
export declare function err(code: string, message: string, details?: unknown): ToolError;
//# sourceMappingURL=errors.d.ts.map
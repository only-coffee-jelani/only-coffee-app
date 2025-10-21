"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
function createSuccessResponse(data, message) {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    };
}
function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
    };
}
//# sourceMappingURL=api-response.dto.js.map
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
}
export declare function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T>;
export declare function createErrorResponse(code: string, message: string, details?: any): ApiResponse;

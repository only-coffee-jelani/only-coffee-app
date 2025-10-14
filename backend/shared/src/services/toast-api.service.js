"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ToastApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let ToastApiService = ToastApiService_1 = class ToastApiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ToastApiService_1.name);
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.config = {
            apiBaseUrl: this.configService.get('toast.apiBaseUrl'),
            clientId: this.configService.get('toast.clientId'),
            clientSecret: this.configService.get('toast.clientSecret'),
            restaurantGuid: this.configService.get('toast.restaurantGuid'),
            maxRetries: this.configService.get('toast.maxRetries'),
            retryDelay: this.configService.get('toast.retryDelay'),
            timeout: this.configService.get('toast.timeout'),
        };
        this.axiosInstance = axios_1.default.create({
            baseURL: this.config.apiBaseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.axiosInstance.interceptors.request.use(async (config) => {
            await this.ensureValidToken();
            if (this.accessToken) {
                config.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            config.headers['Toast-Restaurant-External-ID'] = this.config.restaurantGuid;
            return config;
        }, (error) => Promise.reject(error));
        this.axiosInstance.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status === 401) {
                this.accessToken = null;
                this.tokenExpiresAt = null;
                await this.ensureValidToken();
                if (error.config) {
                    return this.axiosInstance.request(error.config);
                }
            }
            return Promise.reject(error);
        });
    }
    async ensureValidToken() {
        if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
            return;
        }
        try {
            this.logger.log('Fetching new Toast API access token');
            const response = await axios_1.default.post(`${this.config.apiBaseUrl}/authentication/v1/authentication/login`, {
                clientId: this.config.clientId,
                clientSecret: this.config.clientSecret,
                userAccessType: 'TOAST_MACHINE_CLIENT',
            }, {
                headers: { 'Content-Type': 'application/json' },
            });
            this.accessToken = response.data.token.accessToken;
            this.tokenExpiresAt = new Date(Date.now() + 50 * 60 * 1000);
            this.logger.log('Successfully obtained Toast API access token');
        }
        catch (error) {
            this.logger.error('Failed to obtain Toast API access token', error);
            throw new Error('Toast API authentication failed');
        }
    }
    async createCheck(check) {
        try {
            this.logger.log(`Creating check in Toast POS`);
            const response = await this.axiosInstance.post(`/orders/v2/checks`, check);
            this.logger.log(`Successfully created check: ${response.data.guid}`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to create Toast check', error);
            throw new Error('Failed to create order in Toast POS');
        }
    }
    async getCheck(checkGuid) {
        try {
            const response = await this.axiosInstance.get(`/orders/v2/checks/${checkGuid}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get Toast check ${checkGuid}`, error);
            throw new Error('Failed to retrieve check from Toast POS');
        }
    }
    async updateCheck(checkGuid, check) {
        try {
            this.logger.log(`Updating check ${checkGuid} in Toast POS`);
            const response = await this.axiosInstance.put(`/orders/v2/checks/${checkGuid}`, check);
            this.logger.log(`Successfully updated check: ${checkGuid}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to update Toast check ${checkGuid}`, error);
            throw new Error('Failed to update check in Toast POS');
        }
    }
    async getMenuItems() {
        try {
            this.logger.log('Fetching menu items from Toast POS');
            const response = await this.axiosInstance.get(`/menus/v2/menus`);
            const items = [];
            if (response.data && Array.isArray(response.data)) {
                for (const menu of response.data) {
                    if (menu.groups && Array.isArray(menu.groups)) {
                        for (const group of menu.groups) {
                            if (group.items && Array.isArray(group.items)) {
                                items.push(...group.items);
                            }
                        }
                    }
                }
            }
            this.logger.log(`Fetched ${items.length} menu items from Toast`);
            return items;
        }
        catch (error) {
            this.logger.error('Failed to fetch Toast menu items', error);
            throw new Error('Failed to fetch menu from Toast POS');
        }
    }
    async getMenuItem(itemGuid) {
        try {
            const response = await this.axiosInstance.get(`/menus/v2/items/${itemGuid}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch Toast menu item ${itemGuid}`, error);
            throw new Error('Failed to fetch menu item from Toast POS');
        }
    }
    async applyLoyalty(checkGuid, loyaltyIdentifier) {
        try {
            this.logger.log(`Applying loyalty to check ${checkGuid}`);
            await this.axiosInstance.post(`/orders/v2/checks/${checkGuid}/appliedLoyalty`, {
                loyaltyIdentifier,
            });
            this.logger.log(`Successfully applied loyalty to check ${checkGuid}`);
        }
        catch (error) {
            this.logger.error(`Failed to apply loyalty to check ${checkGuid}`, error);
            throw new Error('Failed to apply loyalty to Toast check');
        }
    }
    async voidCheck(checkGuid) {
        try {
            this.logger.log(`Voiding check ${checkGuid} in Toast POS`);
            await this.axiosInstance.delete(`/orders/v2/checks/${checkGuid}`);
            this.logger.log(`Successfully voided check: ${checkGuid}`);
        }
        catch (error) {
            this.logger.error(`Failed to void Toast check ${checkGuid}`, error);
            throw new Error('Failed to void check in Toast POS');
        }
    }
    async healthCheck() {
        try {
            await this.ensureValidToken();
            return true;
        }
        catch (error) {
            this.logger.error('Toast API health check failed', error);
            return false;
        }
    }
};
exports.ToastApiService = ToastApiService;
exports.ToastApiService = ToastApiService = ToastApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ToastApiService);
//# sourceMappingURL=toast-api.service.js.map
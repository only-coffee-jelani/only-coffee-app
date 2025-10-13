import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ToastOrderItem {
  guid?: string;
  name: string;
  quantity: number;
  unitOfMeasure: 'NONE';
  price: number;
  modifiers?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  specialRequests?: string;
}

export interface ToastCheck {
  guid?: string;
  displayNumber?: string;
  entityType: 'Check';
  checkNumber?: number;
  openedDate?: string;
  closedDate?: string;
  deletedDate?: string | null;
  deleted: boolean;
  selections: ToastOrderItem[];
  customer?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  promisedDate?: string; // Pickup time
  notes?: string;
  appliedLoyaltyInfo?: {
    loyaltyIdentifier: string;
    vendorIdentifier?: string;
    accrualFamilyGuid?: string;
  };
}

export interface ToastMenuItem {
  guid: string;
  name: string;
  description?: string;
  price: number;
  pricingStrategy: string;
  pricingRules?: any[];
  visibility: string;
  modifierGroups?: string[];
  images?: Array<{ url: string }>;
  calories?: number;
  isDiscountable: boolean;
  tags?: string[];
  sku?: string;
}

export interface ToastMenuGroup {
  guid: string;
  name: string;
  description?: string;
  items: string[]; // Array of menu item GUIDs
  visibility: string;
}

@Injectable()
export class ToastApiService {
  private readonly logger = new Logger(ToastApiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly config: {
    apiBaseUrl: string;
    clientId: string;
    clientSecret: string;
    restaurantGuid: string;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
  };
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiBaseUrl: this.configService.get<string>('toast.apiBaseUrl'),
      clientId: this.configService.get<string>('toast.clientId'),
      clientSecret: this.configService.get<string>('toast.clientSecret'),
      restaurantGuid: this.configService.get<string>('toast.restaurantGuid'),
      maxRetries: this.configService.get<number>('toast.maxRetries'),
      retryDelay: this.configService.get<number>('toast.retryDelay'),
      timeout: this.configService.get<number>('toast.timeout'),
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        config.headers['Toast-Restaurant-External-ID'] = this.config.restaurantGuid;
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          this.accessToken = null;
          this.tokenExpiresAt = null;
          await this.ensureValidToken();

          // Retry the original request
          if (error.config) {
            return this.axiosInstance.request(error.config);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return; // Token is still valid
    }

    try {
      this.logger.log('Fetching new Toast API access token');

      const response = await axios.post(
        `${this.config.apiBaseUrl}/authentication/v1/authentication/login`,
        {
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
          userAccessType: 'TOAST_MACHINE_CLIENT',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      this.accessToken = response.data.token.accessToken;

      // Set expiration to 50 minutes (tokens typically last 60 minutes)
      this.tokenExpiresAt = new Date(Date.now() + 50 * 60 * 1000);

      this.logger.log('Successfully obtained Toast API access token');
    } catch (error) {
      this.logger.error('Failed to obtain Toast API access token', error);
      throw new Error('Toast API authentication failed');
    }
  }

  /**
   * Create a check (order) in Toast POS
   */
  async createCheck(check: ToastCheck): Promise<ToastCheck> {
    try {
      this.logger.log(`Creating check in Toast POS`);

      const response = await this.axiosInstance.post(
        `/orders/v2/checks`,
        check,
      );

      this.logger.log(`Successfully created check: ${response.data.guid}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create Toast check', error);
      throw new Error('Failed to create order in Toast POS');
    }
  }

  /**
   * Get check details from Toast POS
   */
  async getCheck(checkGuid: string): Promise<ToastCheck> {
    try {
      const response = await this.axiosInstance.get(
        `/orders/v2/checks/${checkGuid}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Toast check ${checkGuid}`, error);
      throw new Error('Failed to retrieve check from Toast POS');
    }
  }

  /**
   * Update a check in Toast POS
   */
  async updateCheck(checkGuid: string, check: Partial<ToastCheck>): Promise<ToastCheck> {
    try {
      this.logger.log(`Updating check ${checkGuid} in Toast POS`);

      const response = await this.axiosInstance.put(
        `/orders/v2/checks/${checkGuid}`,
        check,
      );

      this.logger.log(`Successfully updated check: ${checkGuid}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update Toast check ${checkGuid}`, error);
      throw new Error('Failed to update check in Toast POS');
    }
  }

  /**
   * Get menu items from Toast POS
   */
  async getMenuItems(): Promise<ToastMenuItem[]> {
    try {
      this.logger.log('Fetching menu items from Toast POS');

      const response = await this.axiosInstance.get(
        `/menus/v2/menus`,
      );

      // Toast returns menu structure, we need to extract items
      const items: ToastMenuItem[] = [];

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
    } catch (error) {
      this.logger.error('Failed to fetch Toast menu items', error);
      throw new Error('Failed to fetch menu from Toast POS');
    }
  }

  /**
   * Get a specific menu item from Toast POS
   */
  async getMenuItem(itemGuid: string): Promise<ToastMenuItem> {
    try {
      const response = await this.axiosInstance.get(
        `/menus/v2/items/${itemGuid}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Toast menu item ${itemGuid}`, error);
      throw new Error('Failed to fetch menu item from Toast POS');
    }
  }

  /**
   * Send loyalty info to Toast
   */
  async applyLoyalty(checkGuid: string, loyaltyIdentifier: string): Promise<void> {
    try {
      this.logger.log(`Applying loyalty to check ${checkGuid}`);

      await this.axiosInstance.post(
        `/orders/v2/checks/${checkGuid}/appliedLoyalty`,
        {
          loyaltyIdentifier,
        },
      );

      this.logger.log(`Successfully applied loyalty to check ${checkGuid}`);
    } catch (error) {
      this.logger.error(`Failed to apply loyalty to check ${checkGuid}`, error);
      throw new Error('Failed to apply loyalty to Toast check');
    }
  }

  /**
   * Cancel/void a check in Toast POS
   */
  async voidCheck(checkGuid: string): Promise<void> {
    try {
      this.logger.log(`Voiding check ${checkGuid} in Toast POS`);

      await this.axiosInstance.delete(
        `/orders/v2/checks/${checkGuid}`,
      );

      this.logger.log(`Successfully voided check: ${checkGuid}`);
    } catch (error) {
      this.logger.error(`Failed to void Toast check ${checkGuid}`, error);
      throw new Error('Failed to void check in Toast POS');
    }
  }

  /**
   * Health check - verify Toast API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      return true;
    } catch (error) {
      this.logger.error('Toast API health check failed', error);
      return false;
    }
  }
}

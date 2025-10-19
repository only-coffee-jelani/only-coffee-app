import { Order } from './order.entity';
import { MenuItem } from './menu-item.entity';
export declare class OrderItem {
    id: string;
    orderId: string;
    menuItemId: string | null;
    itemName: string;
    toastItemId: string | null;
    quantity: number;
    basePrice: number;
    modifiersPrice: number;
    totalPrice: number;
    modifiers: Array<{
        name: string;
        value: string;
        price: number;
    }>;
    specialInstructions: string | null;
    order: Order;
    menuItem: MenuItem | null;
}

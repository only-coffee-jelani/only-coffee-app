import { Order } from './order.entity';
import { MenuItem } from './menu-item.entity';
import { OrderItemModifier } from './order-item-modifier.entity';
export declare class OrderItem {
    orderItemId: string;
    orderId: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    createdAt: Date;
    order: Order;
    menuItem: MenuItem;
    orderItemModifiers: OrderItemModifier[];
}

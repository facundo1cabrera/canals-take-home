import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const OrderStatus = {
    PENDING: "PENDING",
    PAID: "PAID",
    FAILED: "FAILED"
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export type Address = {
    id: Generated<string>;
    customerId: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude: number | null;
    longitude: number | null;
};
export type Customer = {
    id: Generated<string>;
    name: string;
    email: string;
    createdAt: Generated<Timestamp>;
};
export type Inventory = {
    id: Generated<string>;
    warehouseId: string;
    productId: string;
    quantity: number;
};
export type Order = {
    id: Generated<string>;
    customerId: string;
    warehouseId: string;
    shippingAddressId: string;
    totalAmount: number;
    status: Generated<OrderStatus>;
    createdAt: Generated<Timestamp>;
};
export type OrderItem = {
    id: Generated<string>;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
};
export type Product = {
    id: Generated<string>;
    name: string;
    price: number;
};
export type Warehouse = {
    id: Generated<string>;
    name: string;
    latitude: number;
    longitude: number;
};
export type DB = {
    addresses: Address;
    customers: Customer;
    inventory: Inventory;
    order_items: OrderItem;
    orders: Order;
    products: Product;
    warehouses: Warehouse;
};

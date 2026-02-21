import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

const ShippingAddressInputSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
});

const CreateOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const CreateOrderBodySchema = z.object({
  customerId: z.string().uuid(),
  shippingAddress: ShippingAddressInputSchema,
  items: z.array(CreateOrderItemSchema).min(1),
  creditCardNumber: z.string().min(1),
});

const OrderItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  quantity: z.number(),
  unitPrice: z.string(),
});

export const CreateOrderResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  warehouseId: z.string(),
  shippingAddressId: z.string(),
  totalAmount: z.string(),
  status: z.enum(['PENDING', 'PAID', 'FAILED']),
  createdAt: z.string().datetime(),
  items: z.array(OrderItemResponseSchema),
});

const CustomerOptionSchema = z.object({ id: z.string(), name: z.string(), email: z.string() });
const ProductOptionSchema = z.object({ id: z.string(), name: z.string(), price: z.string() });

export const contract = c.router({
  getCustomers: {
    method: 'GET',
    path: '/customers',
    responses: { 200: z.array(CustomerOptionSchema) },
    summary: 'List customers (for dropdowns)',
  },
  getProducts: {
    method: 'GET',
    path: '/products',
    responses: { 200: z.array(ProductOptionSchema) },
    summary: 'List products (for dropdowns)',
  },
  getOrders: {
    method: 'GET',
    path: '/orders',
    responses: {
      200: z.array(CreateOrderResponseSchema),
    },
    summary: 'List all orders',
  },
  createOrder: {
    method: 'POST',
    path: '/orders',
    body: CreateOrderBodySchema,
    responses: {
      201: CreateOrderResponseSchema,
      400: z.object({ error: z.object({ message: z.string(), code: z.string().optional() }) }),
      404: z.object({ error: z.object({ message: z.string(), code: z.string().optional() }) }),
      422: z.object({ error: z.object({ message: z.string(), code: z.string().optional() }) }),
    },
    summary: 'Create an order',
  },
});

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

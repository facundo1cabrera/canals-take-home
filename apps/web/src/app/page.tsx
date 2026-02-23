'use client';

import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { CreateOrderBody } from '@repo/contracts';

const initialShipping = {
  street: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
};

export default function HomePage() {
  const [customerId, setCustomerId] = useState('');
  const [shipping, setShipping] = useState(initialShipping);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);
  const [creditCardNumber, setCreditCardNumber] = useState('');

  const { data: orders, isLoading: ordersLoading, error: ordersError } = apiClient.getOrders.useQuery(
    ['orders']
  );
  const { data: customers } = apiClient.getCustomers.useQuery(['customers']);
  const { data: products } = apiClient.getProducts.useQuery(['products']);

  const queryClient = useQueryClient();
  const createOrderMutation = apiClient.createOrder.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const orderList = orders?.status === 200 ? orders.body : [];
  const customerList = customers?.status === 200 ? customers.body : [];
  const productList = products?.status === 200 ? products.body : [];

  const selectedProductIds = new Set(items.map((i) => i.productId).filter(Boolean));
  const canAddMoreLines = productList.length === 0 || selectedProductIds.size < productList.length;
  const addItemRow = () => {
    if (!canAddMoreLines) return;
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  };
  const updateItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: field === 'quantity' ? Number(value) : value };
      return next;
    });
  };
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const getAvailableProductsForRow = (rowIndex: number) => {
    const currentProductId = items[rowIndex]?.productId;
    return productList.filter(
      (p) =>
        p.id === currentProductId ||
        !items.some((it, j) => j !== rowIndex && it.productId === p.id)
    );
  };

  const getProductById = (id: string) => productList.find((p) => p.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: CreateOrderBody = {
      customerId,
      shippingAddress: shipping,
      items: items.filter((i) => i.productId && i.quantity > 0),
      creditCardNumber,
    };
    if (body.items.length === 0) return;
    try {
      await createOrderMutation.mutateAsync({ body });
      setCustomerId('');
      setShipping(initialShipping);
      setItems([{ productId: '', quantity: 1 }]);
      setCreditCardNumber('');
    } catch {
      // Error shown via mutation.error
    }
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:border-canals-accent focus:outline-none focus:ring-1 focus:ring-canals-accent';

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
            <p className="mt-0.5 text-sm text-gray-500">View and create orders.</p>
          </div>

          {/* Orders list */}
          <section className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-end gap-4 flex-wrap">
              {orderList.length > 0 && (
                <p className="text-sm text-gray-500">Showing {orderList.length} order{orderList.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            {ordersLoading && <p className="p-4 text-sm text-gray-500">Loading orders…</p>}
            {ordersError && (
              <p className="p-4 text-sm text-red-600">
                Failed to load orders. Is the API running?
              </p>
            )}
            {!ordersLoading && !ordersError && orderList.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No orders yet. Create one below.</p>
            )}
            {!ordersLoading && orderList.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
                      <th className="py-3 px-4 font-medium">ID</th>
                      <th className="py-3 px-4 font-medium">Customer</th>
                      <th className="py-3 px-4 font-medium">Warehouse</th>
                      <th className="py-3 px-4 font-medium">Total</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderList.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">
                          {order.id.slice(0, 8)}…
                        </td>
                        <td className="py-3 px-4 text-gray-700">{order.customerId.slice(0, 8)}…</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">
                          {order.warehouseId.slice(0, 8)}…
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          ${order.totalAmount}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              order.status === 'PAID'
                                ? 'text-canals-accent font-medium'
                                : order.status === 'FAILED'
                                  ? 'text-red-600'
                                  : 'text-amber-600'
                            }
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Create order form */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-800">Create order</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={`${inputBase} cursor-pointer`}
                  required
                >
                <option value="">Select customer</option>
                {customerList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-gray-600">Shipping address</legend>
              <input
                placeholder="Street"
                value={shipping.street}
                onChange={(e) => setShipping((s) => ({ ...s, street: e.target.value }))}
                className={inputBase}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="City"
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  className={inputBase}
                  required
                />
                <input
                  placeholder="State"
                  value={shipping.state}
                  onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                  className={inputBase}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Country"
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                  className={inputBase}
                  required
                />
                <input
                  placeholder="Postal code"
                  value={shipping.postalCode}
                  onChange={(e) => setShipping((s) => ({ ...s, postalCode: e.target.value }))}
                  className={inputBase}
                  required
                />
              </div>
            </fieldset>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600">Items</label>
                <button
                  type="button"
                  onClick={addItemRow}
                  disabled={!canAddMoreLines}
                  className="text-sm text-canals-accent hover:text-canals-accent-dark font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add line
                </button>
              </div>
              {!canAddMoreLines && items.length > 0 && (
                <p className="mb-2 text-xs text-gray-500">Each product can only be added once. Remove a line to add a different product.</p>
              )}
              <div className="space-y-3">
                {items.map((item, i) => {
                  const availableProducts = getAvailableProductsForRow(i);
                  const selectedProduct = item.productId ? getProductById(item.productId) : null;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 ${
                        selectedProduct
                          ? 'border-canals-accent/40 bg-canals-accent-lighter/30'
                          : 'border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      {selectedProduct && (
                        <p className="mb-2 text-sm font-medium text-gray-800">
                          {selectedProduct.name}
                          <span className="ml-2 font-normal text-gray-500">
                            ${selectedProduct.price} each
                          </span>
                        </p>
                      )}
                      <div className="flex gap-2 items-center">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(i, 'productId', e.target.value)}
                          className={`flex-1 ${inputBase} cursor-pointer ${item.productId ? 'border-canals-accent/50 font-medium text-gray-900' : ''}`}
                          required={i === 0}
                        >
                          <option value="">Select product</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ${p.price}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2 shrink-0 min-w-[6rem]">
                          <label className="text-xs text-gray-500 whitespace-nowrap">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                            className={`w-24 ${inputBase}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 shrink-0"
                          aria-label="Remove line"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Credit card number
              </label>
              <input
                type="text"
                placeholder="End in even digit for success (mock)"
                value={creditCardNumber}
                onChange={(e) => setCreditCardNumber(e.target.value)}
                className={inputBase}
                required
              />
            </div>

            {createOrderMutation.isError && (
              <p className="text-sm text-red-600">
                {(() => {
                  const e = createOrderMutation.error as { body?: { error?: { message?: string } } } | undefined;
                  return e?.body?.error?.message ?? 'Order failed. Try a card ending in an even digit (mock).';
                })()}
              </p>
            )}
            {createOrderMutation.isSuccess && (
              <p className="text-sm text-canals-accent font-medium">Order created successfully.</p>
            )}

            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="rounded-lg bg-canals-accent px-4 py-2 font-medium text-white hover:bg-canals-accent-dark disabled:opacity-50"
            >
              {createOrderMutation.isPending ? 'Creating…' : 'Create order'}
            </button>
          </form>
          </section>
        </div>
      </div>
    </main>
  );
}

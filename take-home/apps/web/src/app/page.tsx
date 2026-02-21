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

  const addItemRow = () => setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  const updateItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: field === 'quantity' ? Number(value) : value };
      return next;
    });
  };
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

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

  return (
    <main className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-10">
        <header>
          <h1 className="text-2xl font-semibold text-stone-900">Orders</h1>
          <p className="mt-1 text-sm text-stone-500">View and create orders.</p>
        </header>

        {/* Orders list */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-stone-800">All orders</h2>
          {ordersLoading && <p className="text-sm text-stone-500">Loading orders…</p>}
          {ordersError && (
            <p className="text-sm text-red-600">
              Failed to load orders. Is the API running?
            </p>
          )}
          {!ordersLoading && !ordersError && orderList.length === 0 && (
            <p className="text-sm text-stone-500">No orders yet. Create one below.</p>
          )}
          {!ordersLoading && orderList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-2 pr-4 font-medium">ID</th>
                    <th className="pb-2 pr-4 font-medium">Customer</th>
                    <th className="pb-2 pr-4 font-medium">Total</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.map((order) => (
                    <tr key={order.id} className="border-b border-stone-100">
                      <td className="py-3 pr-4 font-mono text-xs text-stone-600">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td className="py-3 pr-4 text-stone-700">{order.customerId.slice(0, 8)}…</td>
                      <td className="py-3 pr-4 font-medium text-stone-800">
                        ${order.totalAmount}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            order.status === 'PAID'
                              ? 'text-emerald-600'
                              : order.status === 'FAILED'
                                ? 'text-red-600'
                                : 'text-amber-600'
                          }
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-stone-500">
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
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-stone-800">Create order</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
              <legend className="text-sm font-medium text-stone-600">Shipping address</legend>
              <input
                placeholder="Street"
                value={shipping.street}
                onChange={(e) => setShipping((s) => ({ ...s, street: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="City"
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
                <input
                  placeholder="State"
                  value={shipping.state}
                  onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Country"
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
                <input
                  placeholder="Postal code"
                  value={shipping.postalCode}
                  onChange={(e) => setShipping((s) => ({ ...s, postalCode: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
            </fieldset>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-stone-600">Items</label>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  + Add line
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(i, 'productId', e.target.value)}
                      className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      required={i === 0}
                    >
                      <option value="">Product</option>
                      {productList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      className="w-20 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-stone-400 hover:text-red-500"
                      aria-label="Remove line"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">
                Credit card number
              </label>
              <input
                type="text"
                placeholder="End in even digit for success (mock)"
                value={creditCardNumber}
                onChange={(e) => setCreditCardNumber(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
              <p className="text-sm text-emerald-600">Order created successfully.</p>
            )}

            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {createOrderMutation.isPending ? 'Creating…' : 'Create order'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

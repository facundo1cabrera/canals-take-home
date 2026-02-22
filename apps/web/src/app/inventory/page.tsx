'use client';

import { apiClient } from '@/lib/api-client';
import { useState } from 'react';

export default function InventoryPage() {
  const { data: warehouses, isLoading, error } = apiClient.getWarehouses.useQuery(
    ['warehouses']
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const warehouseList = warehouses?.status === 200 ? warehouses.body : [];

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              View warehouse inventory levels.
            </p>
          </div>

          <section className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-end gap-4 flex-wrap">
              {warehouseList.length > 0 && (
                <p className="text-sm text-gray-500">
                  Showing {warehouseList.length} warehouse{warehouseList.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {isLoading && (
              <p className="p-4 text-sm text-gray-500">Loading warehouses…</p>
            )}
            {error && (
              <p className="p-4 text-sm text-red-600">
                Failed to load warehouses. Is the API running?
              </p>
            )}
            {!isLoading && !error && warehouseList.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No warehouses found.</p>
            )}

            {!isLoading && warehouseList.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
                      <th className="py-3 px-4 font-medium w-10"></th>
                      <th className="py-3 px-4 font-medium">Name</th>
                      <th className="py-3 px-4 font-medium">Latitude</th>
                      <th className="py-3 px-4 font-medium">Longitude</th>
                      <th className="py-3 px-4 font-medium text-right">Products</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseList.map((warehouse) => {
                      const isExpanded = expandedIds.has(warehouse.id);
                      const totalProducts = warehouse.inventory.length;

                      return (
                        <WarehouseRow
                          key={warehouse.id}
                          warehouse={warehouse}
                          isExpanded={isExpanded}
                          totalProducts={totalProducts}
                          onToggle={() => toggleExpand(warehouse.id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function WarehouseRow({
  warehouse,
  isExpanded,
  totalProducts,
  onToggle,
}: {
  warehouse: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    inventory: {
      productId: string;
      productName: string;
      productPrice: string;
      quantity: number;
    }[];
  };
  isExpanded: boolean;
  totalProducts: number;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-4 text-gray-400">
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </td>
        <td className="py-3 px-4 font-medium text-gray-800">{warehouse.name}</td>
        <td className="py-3 px-4 text-gray-600">{warehouse.latitude.toFixed(4)}</td>
        <td className="py-3 px-4 text-gray-600">{warehouse.longitude.toFixed(4)}</td>
        <td className="py-3 px-4 text-right text-gray-500">{totalProducts}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="p-0">
            <div className="bg-gray-50/60 border-b border-gray-100">
              {warehouse.inventory.length === 0 ? (
                <p className="px-8 py-4 text-sm text-gray-500">
                  No inventory in this warehouse.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                      <th className="py-2 px-8 font-medium">Product</th>
                      <th className="py-2 px-4 font-medium">Unit Price</th>
                      <th className="py-2 px-4 font-medium text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouse.inventory.map((item) => (
                      <tr
                        key={item.productId}
                        className="border-t border-gray-100/80"
                      >
                        <td className="py-2 px-8 text-gray-700">{item.productName}</td>
                        <td className="py-2 px-4 text-gray-600">${item.productPrice}</td>
                        <td className="py-2 px-4 text-right">
                          <span
                            className={
                              item.quantity > 10
                                ? 'text-canals-accent font-medium'
                                : item.quantity > 0
                                  ? 'text-amber-600 font-medium'
                                  : 'text-red-600 font-medium'
                            }
                          >
                            {item.quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

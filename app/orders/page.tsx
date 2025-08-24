// Performance-optimized Orders page with lazy loading and modern components
"use client";
import React, { useState, lazy, Suspense, useMemo } from "react";
import { useOrderForm } from "../dashboard/useOrderForm";
import {
  generateInvoicePDF,
  getOrderSummaryText,
} from "../dashboard/invoiceUtils";
import { SOCIETIES } from "../dashboard/constants";
import {
  DataTable,
  TableColumn,
  TableAction,
  StatusBadge,
  CurrencyCell,
  DateCell,
} from "../components/DataTable";

// Lazy load the modals for better performance
const ModernOrderFormModal = lazy(() =>
  import("../components/ModernOrderFormModal").then((module) => ({
    default: module.ModernOrderFormModal,
  }))
);

// Loading component for modal suspense
const ModalLoading = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 flex flex-col items-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      <p className="mt-4 text-gray-600">Loading order form...</p>
    </div>
  </div>
);

export default function OptimizedModernOrders() {
  const orderForm = useOrderForm();
  const {
    showModal,
    setShowModal,
    orderList,
    filterDeliveryDate,
    setFilterDeliveryDate,
    filterSocityName,
    setFilterSocityName,
    filteredOrders,
    editOrderId,
  } = orderForm;

  const [discountFilter, setDiscountFilter] = useState<string>("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedOrderWallet, setSelectedOrderWallet] = useState<any>(null);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [loadingOrderSummary, setLoadingOrderSummary] = useState<string | null>(
    null
  ); // Track which order is loading

  // Memoize filtered orders to prevent unnecessary recalculations
  const filteredByDiscount = useMemo(() => {
    return filteredOrders.filter((order: any) => {
      if (discountFilter === "applied") return (order.discount || 0) > 0;
      if (discountFilter === "not-applied") return (order.discount || 0) === 0;
      return true;
    });
  }, [filteredOrders, discountFilter]);

  // Memoize handler functions to prevent unnecessary re-renders
  const handleShowModal = useMemo(
    () => () => {
      setShowModal(true);
    },
    [setShowModal]
  );

  // Copy order summary with wallet details
  const copyOrderSummary = async (order: any) => {
    try {
      setLoadingOrderSummary(order._id);

      // Fetch complete order details with wallet information
      const response = await fetch(`/api/orders/${order._id}`);
      const data = await response.json();

      if (data.success) {
        const summaryText = getOrderSummaryText(data.order);
        await navigator.clipboard.writeText(summaryText);

        // Show success feedback (optional)
        const button = document.querySelector(
          `[data-order-id="${order._id}"] .copy-summary-btn`
        );
        if (button) {
          const originalText = button.textContent;
          button.textContent = "Copied!";
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      } else {
        console.error("Failed to fetch order details:", data.error);
        // Fallback to basic summary without wallet details
        const summaryText = getOrderSummaryText(order);
        await navigator.clipboard.writeText(summaryText);
      }
    } catch (error) {
      console.error("Error copying order summary:", error);
      // Fallback to basic summary without wallet details
      const summaryText = getOrderSummaryText(order);
      await navigator.clipboard.writeText(summaryText);
    } finally {
      setLoadingOrderSummary(null);
    }
  };

  // Show wallet history for an order
  const showWalletHistory = async (order: any) => {
    try {
      setSelectedOrderWallet(order);
      const response = await fetch(`/api/orders/wallet?orderId=${order._id}`);
      const data = await response.json();

      if (data.success) {
        setWalletTransactions(data.transactions || []);
      } else {
        setWalletTransactions([]);
      }

      setShowWalletModal(true);
    } catch (error) {
      console.error("Error fetching wallet history:", error);
      setWalletTransactions([]);
      setShowWalletModal(true);
    }
  };

  // Define table columns
  const orderColumns: TableColumn[] = [
    {
      key: "customerName",
      label: "Customer",
      render: (value, order) => (
        <div className="font-medium text-gray-900">
          {order.customer?.customerName || value || "N/A"}
        </div>
      ),
    },
    {
      key: "customerNumber",
      label: "Mobile",
      render: (value, order) => (
        <div className="text-gray-500">
          {order.customer?.countryCode || "+91"}
          {order.customer?.mobileNumber || value}
        </div>
      ),
    },
    {
      key: "address",
      label: "Address",
      render: (_, order) => (
        <div className="text-gray-500">
          {order.customer?.flatNumber || order.flatNumber},{" "}
          {order.customer?.societyName || order.socityName}
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (items) => (
        <div className="max-w-xs">
          {items && items.length > 0 ? (
            <>
              {items.slice(0, 2).map((item: any, idx: number) => (
                <div key={idx} className="text-xs">
                  {item.name} ({item.quantity} {item.unit})
                </div>
              ))}
              {items.length > 2 && (
                <div className="text-xs text-blue-600">
                  +{items.length - 2} more
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400">No items</span>
          )}
        </div>
      ),
    },
    {
      key: "finalAmount",
      label: "Total",
      render: (_, order) => (
        <div>
          <CurrencyCell amount={order.finalAmount} />
          {order.discount > 0 && (
            <div className="text-xs text-green-600">
              Discount: ₹{order.discount}
            </div>
          )}
          {order.walletUsed && (
            <div className="text-xs text-blue-600">
              Wallet: ₹{order.walletAmount || 0}
            </div>
          )}
          {order.lastWalletAdjustment && (
            <div
              className={`text-xs ${
                order.lastWalletAdjustment.type === "credit"
                  ? "text-green-600"
                  : "text-orange-600"
              }`}
            >
              {order.lastWalletAdjustment.type === "credit" ? "Refund" : "Adj"}:
              ₹{order.lastWalletAdjustment.amount}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <StatusBadge
          status={status}
          variant={status === "Delivered" ? "success" : "warning"}
        />
      ),
    },
    {
      key: "deliveryDate",
      label: "Delivery Date",
      render: (date) => <DateCell date={date} />,
    },
  ];

  // Define table actions
  const orderActions: TableAction[] = [
    {
      label: "Edit",
      variant: "secondary",
      onClick: (order) => {
        window.location.href = `/orders/create?edit=${order._id}`;
      },
    },
    {
      label: "Quick Edit",
      variant: "secondary",
      onClick: (order) => {
        orderForm.startEditOrder(order);
      },
    },
    {
      label: "Copy Summary",
      variant: "primary",
      onClick: (order) => {
        copyOrderSummary(order);
      },
      isLoading: (order) => loadingOrderSummary === order._id,
      loadingText: "Copying...",
    },
    {
      label: "Download PDF",
      variant: "success",
      onClick: (order) => {
        generateInvoicePDF(order);
      },
    },
    {
      label: "Wallet History",
      variant: "secondary",
      onClick: (order) => {
        showWalletHistory(order);
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="flex items-center space-x-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-colors"
            onClick={() => (window.location.href = "/orders/create")}
          >
            + Create New Order
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors"
            onClick={handleShowModal}
          >
            Quick Order (Modal)
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 lg:gap-6 xl:gap-8 mb-6 items-center">
        <div>
          <label className="block text-sm font-semibold mb-1">
            Filter by Delivery Date
          </label>
          <input
            type="date"
            value={filterDeliveryDate}
            onChange={(e) => setFilterDeliveryDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            Filter by Society
          </label>
          <select
            value={filterSocityName}
            onChange={(e) => setFilterSocityName(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Societies</option>
            {SOCIETIES.map((society) => (
              <option key={society} value={society}>
                {society}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            Filter by Discount
          </label>
          <select
            value={discountFilter}
            onChange={(e) => setDiscountFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Orders</option>
            <option value="applied">With Discount</option>
            <option value="not-applied">No Discount</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        data={filteredByDiscount}
        columns={orderColumns}
        actions={orderActions}
        title={`Orders (${filteredByDiscount.length} total)`}
        emptyMessage="No orders found matching your filters"
        getRowId={(order) => order._id}
      />

      {/* Modal - Lazy loaded for performance */}
      {showModal && (
        <Suspense fallback={<ModalLoading />}>
          <ModernOrderFormModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onOrderCreated={() => {
              // Refresh the order list after creation
              window.location.reload();
            }}
            editOrderId={editOrderId}
          />
        </Suspense>
      )}

      {/* Wallet History Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Wallet History - Order #{selectedOrderWallet?._id}
              </h2>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {selectedOrderWallet && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Order Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <div className="font-medium">
                      {selectedOrderWallet.customer?.customerName ||
                        selectedOrderWallet.customerName}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Mobile:</span>
                    <div className="font-medium">
                      {selectedOrderWallet.customer?.countryCode || "+91"}
                      {selectedOrderWallet.customer?.mobileNumber ||
                        selectedOrderWallet.customerNumber}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <div className="font-medium">
                      ₹{selectedOrderWallet.finalAmount}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="font-medium">
                      {selectedOrderWallet.status}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Wallet Transactions</h3>

              {walletTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No wallet transactions found for this order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {walletTransactions.map((transaction, index) => (
                    <div
                      key={transaction._id || index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.type === "debit"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {transaction.type === "debit"
                                ? "DEBIT"
                                : "CREDIT"}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(transaction.date).toLocaleString()}
                            </span>
                            {transaction.metadata?.isReversal && (
                              <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                                REVERSAL
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium">
                            {transaction.note}
                          </p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-semibold ${
                              transaction.type === "debit"
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {transaction.type === "debit" ? "-" : "+"}₹
                            {transaction.amount}
                          </div>
                          <div className="text-xs text-gray-500">
                            Balance: ₹{transaction.balanceAfter}
                          </div>
                        </div>
                      </div>

                      {transaction.itemDetails &&
                        transaction.itemDetails.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h4 className="text-sm font-medium mb-2">
                              Item Details:
                            </h4>
                            <div className="space-y-1">
                              {transaction.itemDetails.map(
                                (item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-xs text-gray-600"
                                  >
                                    <span>
                                      {item.name} ({item.quantity} {item.unit})
                                    </span>
                                    <span>₹{item.amount}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {transaction.metadata && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            {transaction.metadata.originalAmount && (
                              <div>
                                Original Amount: ₹
                                {transaction.metadata.originalAmount}
                              </div>
                            )}
                            {transaction.metadata.adjustmentReason && (
                              <div>
                                Reason: {transaction.metadata.adjustmentReason}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowWalletModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { AIOrder, AIOrderItem, CustomerMessage } from "../../lib/types/aiOrder";

interface AIOrderDetailsModalProps {
  aiOrder: AIOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const AIOrderDetailsModal: React.FC<AIOrderDetailsModalProps> = ({
  aiOrder,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <span>AI Order Details</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Customer Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer ID:</span>
                    <span className="font-medium">{aiOrder.customer_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">
                      {aiOrder.customer_phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">
                      {new Date(aiOrder.order_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Analysis
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Confidence:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${
                            aiOrder.ai_confidence >= 0.8
                              ? "bg-green-500"
                              : aiOrder.ai_confidence >= 0.6
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${aiOrder.ai_confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">
                        {Math.round(aiOrder.ai_confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        aiOrder.verification_status === "verified"
                          ? "bg-green-100 text-green-800"
                          : aiOrder.verification_status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : aiOrder.verification_status ===
                            "needs_clarification"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {aiOrder.verification_status
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Total:</span>
                    <span className="font-medium">
                      ₹{aiOrder.estimated_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Order Items ({aiOrder.items.length})
                </h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    {aiOrder.items.map((item: AIOrderItem, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <span className="font-medium">
                          ₹{(item.estimated_price || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {aiOrder.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    📝 Notes
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{aiOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unrecognized Products */}
          {aiOrder.unrecognized_products &&
            aiOrder.unrecognized_products.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ⚠️ Unrecognized Products
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {aiOrder.unrecognized_products.map(
                      (product: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                        >
                          {product}
                        </span>
                      )
                    )}
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    These products were mentioned but couldn't be matched to
                    your inventory.
                  </p>
                </div>
              </div>
            )}

          {/* Customer Messages */}
          {aiOrder.customer_messages &&
            aiOrder.customer_messages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  💬 Customer Messages ({aiOrder.customer_messages.length})
                </h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <div className="space-y-3">
                    {aiOrder.customer_messages.map(
                      (message: CustomerMessage, index: number) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                message.message_type === "order"
                                  ? "bg-green-100 text-green-700"
                                  : message.message_type === "clarification"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {message.message_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-800">
                            {message.message_text}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Timeline */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Timeline
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>
                📅 Created: {new Date(aiOrder.createdAt).toLocaleString()}
              </span>
              <span>
                🔄 Updated: {new Date(aiOrder.last_updated).toLocaleString()}
              </span>
              {aiOrder.processed_to_final_order && aiOrder.final_order_id && (
                <span className="text-green-600">
                  ✅ Processed to Order: {aiOrder.final_order_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

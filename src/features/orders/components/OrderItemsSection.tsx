// Order items management section
import React, { memo, useCallback } from "react";
import { Button, Select, Input, Alert } from "../../../components/ui";
import { OrderItem, OrderFormState } from "../../../types";
import { UNITS } from "../../../constants";

interface Product {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface OrderItemsSectionProps {
  form: OrderFormState;
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  onItemChange: (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  disabled?: boolean;
}

export const OrderItemsSection = memo<OrderItemsSectionProps>(
  function OrderItemsSection(props) {
    const {
      form,
      products,
      productsLoading,
      productsError,
      onItemChange,
      onAddItem,
      onRemoveItem,
      disabled = false,
    } = props;
    const calculateAndSetPrice = useCallback(
      (index: number, product: Product, orderItem: OrderItem) => {
        let price = Number(product.price);
        const productUnit = product.unit;
        const productQty = Number(product.quantity);
        const orderUnit = orderItem.unit || productUnit;
        const orderQty = Number(orderItem.quantity) || productQty;

        // Unit conversion logic
        if (productUnit === "GM" && orderUnit === "KG") {
          price = price * ((orderQty * 1000) / productQty);
        } else if (productUnit === "KG" && orderUnit === "GM") {
          price = price * (orderQty / 1000 / (productQty / 1000));
        } else if (productUnit === orderUnit) {
          price = price * (orderQty / productQty);
        }

        onItemChange(index, "price", price ? Math.round(price) : 0);
      },
      [onItemChange]
    );

    const handleItemChange = useCallback(
      (index: number, field: keyof OrderItem, value: string | number) => {
        onItemChange(index, field, value);

        // Auto-fill price and unit based on selected product
        if (field === "name" && value) {
          const selectedProduct = products.find(
            (product) => product.name === value
          );
          if (selectedProduct) {
            onItemChange(index, "unit", selectedProduct.unit);
            onItemChange(index, "quantity", selectedProduct.quantity || 1);
            calculateAndSetPrice(index, selectedProduct, form.items[index]);
          }
        } else if (
          (field === "quantity" || field === "unit") &&
          form.items[index].name
        ) {
          const selectedProduct = products.find(
            (product) => product.name === form.items[index].name
          );
          if (selectedProduct) {
            calculateAndSetPrice(index, selectedProduct, {
              ...form.items[index],
              [field]: value,
            });
          }
        }
      },
      [onItemChange, products, form.items, calculateAndSetPrice]
    );

    const productOptions = [
      {
        value: "",
        label: productsLoading ? "Loading products..." : "Select Product",
      },
      ...products.map((product) => ({
        value: product.name,
        label: product.name,
      })),
    ];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Order Items
          {productsLoading && (
            <span className="ml-2 text-sm text-blue-600">
              Loading product catalog...
            </span>
          )}
          {productsError && (
            <span className="ml-2 text-sm text-red-600">
              Error loading product catalog
            </span>
          )}
        </h3>

        {productsError && (
          <Alert variant="error">
            Failed to load products: {productsError}
          </Alert>
        )}

        <div>
          <div className="grid grid-cols-4 gap-2 mb-2 px-2">
            <span className="font-semibold text-sm">Product</span>
            <span className="font-semibold text-sm">Quantity</span>
            <span className="font-semibold text-sm">Unit</span>
            <span className="font-semibold text-sm">Price</span>
          </div>

          {form.items.map((item, index) => (
            <div
              key={index}
              className="mb-2 p-2 border rounded grid grid-cols-5 gap-2 items-center"
            >
              <Select
                value={item.name}
                onChange={(e) =>
                  handleItemChange(index, "name", e.target.value)
                }
                options={productOptions}
                disabled={disabled || productsLoading}
                className="text-sm"
                required
              />

              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                placeholder="Qty"
                min="1"
                disabled={disabled}
                className="text-sm"
                required
              />

              <Select
                value={item.unit || "GM"}
                onChange={(e) =>
                  handleItemChange(index, "unit", e.target.value)
                }
                options={UNITS}
                disabled={disabled}
                className="text-sm"
                required
              />

              <Input
                type="number"
                value={item.price}
                onChange={(e) =>
                  handleItemChange(index, "price", e.target.value)
                }
                placeholder="Price"
                min="0"
                disabled={disabled}
                className="text-sm"
                readOnly
                required
              />

              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onRemoveItem(index)}
                disabled={disabled || form.items.length === 1}
                aria-label="Remove Item"
              >
                ×
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="success"
            onClick={onAddItem}
            disabled={disabled}
            className="w-full"
          >
            + Add Item
          </Button>
        </div>
      </div>
    );
  }
);

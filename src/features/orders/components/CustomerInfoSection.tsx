// Customer information form section
import React, { memo, useCallback } from "react";
import { Input, Select } from "../../../components/ui";
import { Customer, OrderFormState } from "../../../types";
import { SOCIETIES, ORDER_STATUSES } from "../../../constants";

interface CustomerInfoSectionProps {
  form: OrderFormState;
  selectedCustomer: Customer | null;
  onFieldChange: (field: keyof OrderFormState, value: string | number) => void;
  disabled?: boolean;
}

export const CustomerInfoSection = memo<CustomerInfoSectionProps>(
  function CustomerInfoSection(props) {
    const { form, selectedCustomer, onFieldChange, disabled = false } = props;
    const isFieldDisabled = useCallback(
      (field: string): boolean => {
        return (
          disabled ||
          (!!selectedCustomer &&
            ["customerName", "flatNumber", "socityName"].includes(field))
        );
      },
      [disabled, selectedCustomer]
    );

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Customer Information
        </h3>

        <Input
          label="Customer Name"
          value={form.customerName}
          onChange={(e) => onFieldChange("customerName", e.target.value)}
          placeholder="Customer name (optional)"
          disabled={isFieldDisabled("customerName")}
        />

        <Input
          label="Flat Number"
          value={form.flatNumber}
          onChange={(e) => onFieldChange("flatNumber", e.target.value)}
          disabled={isFieldDisabled("flatNumber")}
          required
        />

        <Select
          label="Society Name"
          value={form.socityName || "The Vienza"}
          onChange={(e) => onFieldChange("socityName", e.target.value)}
          options={[
            { value: "", label: "Select Society" },
            ...SOCIETIES.map((society) => ({ value: society, label: society })),
          ]}
          disabled={isFieldDisabled("socityName")}
          required
        />

        <Select
          label="Status"
          value={form.status}
          onChange={(e) => onFieldChange("status", e.target.value)}
          options={ORDER_STATUSES}
          disabled={disabled}
          required
        />

        <Input
          label="Discount"
          type="number"
          value={form.discount}
          onChange={(e) => onFieldChange("discount", e.target.value)}
          placeholder="Order Discount"
          disabled={disabled}
        />

        <Input
          label="Delivery Date"
          type="date"
          value={form.deliveryDate}
          onChange={(e) => onFieldChange("deliveryDate", e.target.value)}
          disabled={disabled}
          required
        />
      </div>
    );
  }
);

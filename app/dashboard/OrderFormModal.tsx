import React from "react";
import { SOCIETIES, ITEMS, UNITS } from "./constants";

export function OrderFormModal({
  showModal,
  setShowModal,
  form,
  setForm,
  handleChange,
  addItem,
  handleSubmit,
}: {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  addItem: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  if (!showModal) return null;

  // Fix type for handleItemChange
  const handleItemChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const items: Array<{
      name: string;
      quantity: number | string;
      unit: string;
      price: number | string;
    }> = [...form.items];
    const name = e.target.name as keyof (typeof items)[0];
    items[idx][name] = e.target.value;
    console.log("Item changed:", items[idx]);
    // Auto-fill price based on item, unit, and quantity
    if (name === "name" || name === "unit" || name === "quantity") {
      const selectedItem = ITEMS.find((it) => it.name === items[idx].name);
      if (selectedItem) {
        let price = selectedItem.price;
        let itemUnit = selectedItem.unit;
        let itemQty = Number(selectedItem.quantity);
        let orderUnit = items[idx].unit || itemUnit;
        let orderQty = Number(items[idx].quantity) || itemQty;
        // Conversion logic
        if (itemUnit === "GM" && orderUnit === "KG") {
          // Convert price per gm to per kg
          price = price * ((orderQty * 1000) / itemQty);
        } else if (itemUnit === "KG" && orderUnit === "GM") {
          // Convert price per kg to per gm
          price = price * (orderQty / 1000 / (itemQty / 1000));
        } else if (itemUnit === orderUnit) {
          price = price * (orderQty / itemQty);
        }
        items[idx].price = price ? Math.round(price) : "";
      }
    }
    setForm({ ...form, items });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Customer Number</label>
            <input
              name="customerNumber"
              value={form.customerNumber}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Flat Number</label>
            <input
              name="flatNumber"
              value={form.flatNumber}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Socity Name</label>
            <select
              name="socityName"
              value={form.socityName || "The Vienza"}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Select Socity</option>
              {SOCIETIES.map((soc: string) => (
                <option key={soc} value={soc}>
                  {soc}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            >
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Discount</label>
            <input
              name="discount"
              value={form.discount}
              onChange={handleChange}
              placeholder="Order Discount"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Delivery Date</label>
            <input
              name="deliveryDate"
              type="date"
              value={form.deliveryDate || ""}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-2">Items</label>
            <div className="grid grid-cols-4 gap-2 mb-2 px-2">
              <span className="font-semibold">Name</span>
              <span className="font-semibold">Quantity</span>
              <span className="font-semibold">Unit</span>
              <span className="font-semibold">Price</span>
            </div>
            {form.items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="mb-2 p-2 border rounded grid grid-cols-5 gap-2 items-center"
              >
                <select
                  name="name"
                  value={item.name}
                  onChange={(e) => handleItemChange(idx, e)}
                  required
                  className="border rounded px-2 py-1"
                >
                  <option value="">Select Item</option>
                  {ITEMS.map((it: { name: string; price: number }) => (
                    <option key={it.name} value={it.name}>
                      {it.name}
                    </option>
                  ))}
                </select>
                <input
                  name="quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, e)}
                  placeholder="Qty"
                  required
                  className="border rounded px-2 py-1 w-full"
                  type="number"
                  min="1"
                />
                <select
                  name="unit"
                  value={item.unit || "GM"}
                  onChange={(e) => handleItemChange(idx, e)}
                  required
                  className="border rounded px-2 py-1 w-full"
                >
                  {UNITS.map((unit: { value: string; label: string }) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
                <input
                  name="price"
                  value={item.price}
                  onChange={(e) => handleItemChange(idx, e)}
                  placeholder="Price"
                  required
                  className="border rounded px-2 py-1 w-full"
                  type="number"
                  min="0"
                  readOnly
                />
                <button
                  type="button"
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  onClick={() => {
                    const items = [...form.items];
                    items.splice(idx, 1);
                    setForm({ ...form, items });
                  }}
                  aria-label="Remove Item"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              + Add Item
            </button>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

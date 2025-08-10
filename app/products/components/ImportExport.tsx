"use client";

import { useState, useRef } from "react";

interface ImportExportProps {
  onImportComplete: () => void;
}

export default function ImportExport({ onImportComplete }: ImportExportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/products/import");

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products-export-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to export products");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export products");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      parseAndImportCSV(csvText);
    };
    reader.readAsText(file);
  };

  const parseAndImportCSV = async (csvText: string) => {
    try {
      setIsImporting(true);

      const lines = csvText.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        alert("CSV file must have at least a header row and one data row");
        return;
      }

      const headers = lines[0]
        .split(",")
        .map((h) => h.replace(/"/g, "").trim());
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(",")
          .map((v) => v.replace(/"/g, "").trim());
        const product: any = {};

        headers.forEach((header, index) => {
          const value = values[index];

          if (
            header === "price" ||
            header === "quantity" ||
            header === "stockQuantity" ||
            header === "sortOrder"
          ) {
            product[header] = value ? Number(value) : undefined;
          } else if (header === "isActive" || header === "isAvailable") {
            product[header] = value === "true";
          } else {
            product[header] = value;
          }
        });

        products.push(product);
      }

      // Send to import API
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });

      const result = await response.json();

      if (result.success) {
        setImportResults(result.results);
        onImportComplete();
      } else {
        alert(result.error || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import CSV file");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      "name,nameGujarati,nameEnglish,price,unit,quantity,category,isActive,isAvailable,stockQuantity,sortOrder",
      '"ગુવાર (Guvar)","ગુવાર","Guvar",60,GM,500,vegetables,true,true,5000,1',
      '"ચોળી (Chawli)","ચોળી","Chawli",50,GM,500,vegetables,true,true,5000,2',
      '"બટાટા (Potato)","બટાટા","Potato",35,KG,1,root-vegetables,true,true,100,3',
    ].join("\n");

    const blob = new Blob([sampleData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-products.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </button>

        <button
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Import CSV
        </button>

        <button
          onClick={downloadSampleCSV}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Download Sample CSV
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Import Products from CSV
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Select a CSV file with product data to import. The file should
                  include columns: name, price, unit, quantity, category, etc.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full p-2 border rounded"
                  disabled={isImporting}
                />
              </div>

              <div className="text-xs text-gray-500">
                <p>• Existing products with the same name will be updated</p>
                <p>• New products will be created</p>
                <p>• Required fields: name, price, unit, quantity</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {isImporting && (
              <div className="mt-4 text-center">
                <div className="text-blue-600">Importing products...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Results Modal */}
      {importResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Import Results</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>New products imported:</span>
                <span className="font-medium text-green-600">
                  {importResults.imported}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Existing products updated:</span>
                <span className="font-medium text-blue-600">
                  {importResults.updated}
                </span>
              </div>

              {importResults.errors.length > 0 && (
                <div>
                  <p className="text-red-600 font-medium">
                    Errors ({importResults.errors.length}):
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto text-sm">
                    {importResults.errors.map(
                      (error: string, index: number) => (
                        <div key={index} className="text-red-500">
                          {error}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setImportResults(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

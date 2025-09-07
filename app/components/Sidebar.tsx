"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "📊",
    },
    {
      label: "Orders",
      href: "/orders",
      icon: "📋",
    },
    {
      label: "Customers",
      href: "/customers",
      icon: "👥",
    },
    {
      label: "Products",
      href: "/products",
      icon: "📦",
    },
    {
      label: "System Status",
      href: "/status",
      icon: "⚙️",
    },
  ];

  return (
    <div
      className={`bg-gray-800 text-white w-64 xl:w-72 2xl:w-80 min-h-screen p-4 xl:p-6 2xl:p-8 ${className}`}
    >
      <div className="mb-8">
        <h1 className="text-xl xl:text-2xl font-bold text-center">
          Order Management
        </h1>
      </div>

      <nav>
        <ul className="space-y-2 xl:space-y-3">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname.startsWith("/dashboard"));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 xl:space-x-4 p-3 xl:p-4 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className="text-lg xl:text-xl">{item.icon}</span>
                  <span className="font-medium xl:text-lg">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

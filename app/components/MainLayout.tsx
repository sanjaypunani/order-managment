"use client";
import React from "react";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 xl:p-12 2xl:p-16">
          <div className="max-w-none xl:max-w-7xl 2xl:max-w-full mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

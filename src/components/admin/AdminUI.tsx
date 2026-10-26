"use client";

import AdminBar from "./AdminBar";
import AdminWindow from "./AdminWindow";
import PageEditor from "./PageEditor";
import ProductEditor from "./ProductEditor";
import { ToastProvider } from "./Toast";

/** Everything the admin sees on top of the public site. Loaded lazily, only after a successful session check. */
export default function AdminUI() {
  return (
    <ToastProvider>
      <AdminBar />
      <AdminWindow />
      <ProductEditor />
      <PageEditor />
    </ToastProvider>
  );
}

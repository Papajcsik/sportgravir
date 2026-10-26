"use client";

import { useAdmin } from "./AdminProvider";

/** Pencil that appears for the logged-in admin only; opens the product editor on top of the page they are looking at. */
export function EditButton({ id, label = "Szerkesztés", className = "" }: { id: number; label?: string; className?: string }) {
  const { admin, openEditor } = useAdmin();
  if (!admin) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openEditor(id);
      }}
      className={`edit-pop inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 font-sans text-[12px] font-medium leading-none text-black shadow-md transition-[filter,transform] hover:brightness-110 active:scale-95 ${className}`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
      {label}
    </button>
  );
}

/** "+ Új termék" for the admin, shown at the top of the shop. */
export function AddProductButton({ className = "" }: { className?: string }) {
  const { admin, openEditor } = useAdmin();
  if (!admin) return null;
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => openEditor("new")}
        className="edit-pop inline-flex items-center gap-2 rounded-[3px] bg-gold px-5 py-3 font-sans text-[13px] font-medium uppercase tracking-[1.5px] text-black shadow-md transition-[filter,transform] hover:brightness-110 active:scale-95"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          +
        </span>
        Új termék
      </button>
    </div>
  );
}

/** The same pencil for a text page or article. */
export function PageEditButton({ id, label = "Oldal szerkesztése", className = "" }: { id: number; label?: string; className?: string }) {
  const { admin, openPageEditor } = useAdmin();
  if (!admin) return null;
  return (
    <button
      type="button"
      onClick={() => openPageEditor(id)}
      className={`edit-pop inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-2 font-sans text-[13px] font-semibold leading-none text-black shadow-md transition-[filter,transform] hover:brightness-110 active:scale-95 ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
      {label}
    </button>
  );
}

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const FIELD_BASE =
  "w-full rounded-md border border-line bg-paper-raised px-3 text-body text-ink placeholder:text-slate focus:border-ink focus:outline-none";

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-caption font-medium text-ink-soft">{children}</label>;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-11 ${FIELD_BASE} ${className}`.trim()} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`py-2 ${FIELD_BASE} ${className}`.trim()} {...props} />;
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`h-11 ${FIELD_BASE} ${className}`.trim()} {...props} />;
}

export function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-caption text-stamp">{children}</p>;
}

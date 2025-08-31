"use client";

import * as React from "react";
import * as Radix from "@radix-ui/react-select";

export const Select = Radix.Root;
export const SelectGroup = Radix.Group;
export const SelectValue = Radix.Value;

type TriggerProps = React.ComponentPropsWithoutRef<typeof Radix.Trigger>;
export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof Radix.Trigger>,
  TriggerProps
>(function SelectTrigger({ className = "", ...props }, ref) {
  // Force a readable, opaque trigger
  const cls =
    "w-full inline-flex items-center justify-between rounded-md border border-input bg-background text-foreground px-3 py-2 " +
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background " +
    "disabled:opacity-50 disabled:pointer-events-none " +
    className;
  return <Radix.Trigger ref={ref} className={cls} {...props} />;
});

type ContentProps = React.ComponentPropsWithoutRef<typeof Radix.Content>;
export const SelectContent = React.forwardRef<
  React.ElementRef<typeof Radix.Content>,
  ContentProps
>(function SelectContent(
  { className = "", position = "popper", ...props },
  ref
) {
  // Opaque popover with border + shadow + high z-index
  const cls =
    "z-50 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md " +
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 " +
    "data-[side=top]:slide-in-from-bottom-2 " +
    className;

  return (
    <Radix.Portal>
      <Radix.Content ref={ref} className={cls} position={position} sideOffset={6} {...props} />
    </Radix.Portal>
  );
});

type LabelProps = React.ComponentPropsWithoutRef<typeof Radix.Label>;
export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof Radix.Label>,
  LabelProps
>(function SelectLabel({ className = "", ...props }, ref) {
  return (
    <Radix.Label
      ref={ref}
      className={"px-2 py-1.5 text-sm font-medium text-muted-foreground " + className}
      {...props}
    />
  );
});

type SeparatorProps = React.ComponentPropsWithoutRef<typeof Radix.Separator>;
export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof Radix.Separator>,
  SeparatorProps
>(function SelectSeparator({ className = "", ...props }, ref) {
  return (
    <Radix.Separator
      ref={ref}
      className={"-mx-1 my-1 h-px bg-border " + className}
      {...props}
    />
  );
});

type ScrollBtnProps = React.ComponentPropsWithoutRef<typeof Radix.ScrollUpButton>;
export const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof Radix.ScrollUpButton>,
  ScrollBtnProps
>(function SelectScrollUpButton({ className = "", ...props }, ref) {
  return (
    <Radix.ScrollUpButton
      ref={ref}
      className={"flex cursor-default items-center justify-center py-1 text-muted-foreground " + className}
      {...props}
    />
  );
});

type ScrollDownBtnProps = React.ComponentPropsWithoutRef<typeof Radix.ScrollDownButton>;
export const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof Radix.ScrollDownButton>,
  ScrollDownBtnProps
>(function SelectScrollDownButton({ className = "", ...props }, ref) {
  return (
    <Radix.ScrollDownButton
      ref={ref}
      className={"flex cursor-default items-center justify-center py-1 text-muted-foreground " + className}
      {...props}
    />
  );
});

/** ---------- Hardened Item (prevents empty values) ---------- */
type ItemProps = React.ComponentPropsWithoutRef<typeof Radix.Item> & {
  value: string | number | undefined | null;
};

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof Radix.Item>,
  ItemProps
>(function SelectItem({ value, children, className = "", ...props }, ref) {
  const str = value == null ? "" : String(value);
  const trimmed = str.trim();
  if (trimmed === "") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[safe-select] Skipping <SelectItem> with empty value.");
    }
    return null;
  }

  // Opaque rows + clear focus/checked styles
  const cls =
    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm " +
    "outline-none focus:bg-accent focus:text-accent-foreground " +
    "data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground " +
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 " +
    className;

  return (
    <Radix.Item ref={ref} value={trimmed} className={cls} {...props}>
      {children}
    </Radix.Item>
  );
});

/** Convenience to render lists safely */
export function SelectItemsFrom<T extends Record<string, any>>({
  items,
  getValue = (x: T) => String(x.id),
  getLabel = (x: T) => String(x.name ?? x.label ?? x.title ?? x.id),
}: {
  items?: T[];
  getValue?: (x: T) => string | number | null | undefined;
  getLabel?: (x: T) => React.ReactNode;
}) {
  if (!items?.length) return null;
  return (
    <>
      {items.map((it, idx) => {
        const v = getValue(it);
        const s = v == null ? "" : String(v).trim();
        if (s === "") return null;
        return (
          <SelectItem key={`${s}-${idx}`} value={s}>
            {getLabel(it)}
          </SelectItem>
        );
      })}
    </>
  );
}
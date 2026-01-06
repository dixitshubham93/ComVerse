"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "./utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "bg-[#2a3444]/50 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2 border border-white/5",
          )}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={cn(
              "bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full shadow-[0_0_10px_rgba(40,245,204,0.3)]",
            )}
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="border-2 border-[#28f5cc] bg-[#04372f] ring-offset-background block size-5 shrink-0 rounded-full shadow-[0_0_15px_rgba(40,245,204,0.5)] transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28f5cc] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          />
        ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };

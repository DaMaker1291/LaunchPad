import * as React from "react";
import { cn } from "../../lib/utils.js";

function Avatar({ className, ...props }) {
  return (
    <div
      data-slot="avatar"
      className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }) {
  return (
    <img
      data-slot="avatar-image"
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn("bg-muted flex h-full w-full items-center justify-center rounded-full font-medium text-sm", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };

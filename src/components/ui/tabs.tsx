import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "tabs-scroll inline-flex w-full min-w-0 max-w-full flex-nowrap items-center justify-start gap-1.5 overflow-x-auto overscroll-x-contain rounded-lg border bg-muted p-1.5 text-muted-foreground shadow-sm sm:w-auto sm:gap-1 sm:p-1",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { tooltipLabel?: string }
>(({ className, children, tooltipLabel, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, ...props }, forwardedRef) => {
  const triggerRef = React.useRef<React.ElementRef<typeof TabsPrimitive.Trigger>>(null);
  const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [inferredLabel, setInferredLabel] = React.useState<string>();

  const label = tooltipLabel ?? inferredLabel;

  const clearHoldTimer = React.useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    touchStartRef.current = null;
  }, []);

  React.useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || trigger.dataset.state !== "active") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    trigger.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  });

  React.useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const nextLabel = tooltipLabel ?? trigger.textContent?.trim();
    if (nextLabel) setInferredLabel(nextLabel);

    const update = () => {
      const isSmallScreen = window.matchMedia("(max-width: 639px)").matches;
      const isTextClipped = trigger.scrollWidth > trigger.clientWidth + 1;
      setShowTooltip(isSmallScreen || isTextClipped);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(trigger);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [children, tooltipLabel]);

  React.useEffect(() => () => clearHoldTimer(), [clearHoldTimer]);

  const setRefs = React.useCallback(
    (node: React.ElementRef<typeof TabsPrimitive.Trigger> | null) => {
      triggerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const trigger = (
    <TabsPrimitive.Trigger
      ref={setRefs}
      className={cn(
        "inline-flex min-h-9 shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-3 py-2 text-sm font-semibold leading-none ring-offset-background cursor-pointer transition-[color,background-color,border-color,box-shadow] duration-200 hover:border-border hover:bg-background/70 hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-8 sm:py-1.5 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:font-bold data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:hover:bg-primary data-[state=active]:hover:text-primary-foreground",
        className,
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || event.pointerType === "mouse" || !showTooltip) return;
        touchStartRef.current = { x: event.clientX, y: event.clientY };
        holdTimerRef.current = setTimeout(() => setTooltipOpen(true), 550);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const start = touchStartRef.current;
        if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) return;
        clearHoldTimer();
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        clearHoldTimer();
        if (tooltipOpen) setTimeout(() => setTooltipOpen(false), 1600);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        clearHoldTimer();
        setTooltipOpen(false);
      }}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );

  if (!label) return trigger;

  return (
    <TooltipProvider delayDuration={350}>
      <Tooltip open={showTooltip ? tooltipOpen : false} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        {showTooltip && (
          <TooltipContent side="top" className="max-w-[min(18rem,calc(100vw-2rem))] text-center leading-relaxed">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

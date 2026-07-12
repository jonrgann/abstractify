import { cn } from "@/lib/utils";

/**
 * The AboundAI signature accent bar that sits directly under the top nav:
 * red (30%) / blue (flex) / navy (12%).
 */
export function BrandStripe({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-[3px] w-full", className)} aria-hidden="true">
      <span className="block h-full basis-[30%] bg-brand-red" />
      <span className="block h-full flex-1 bg-brand-blue" />
      <span className="block h-full basis-[12%] bg-brand-navy" />
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex flex-col items-start gap-1.5 leading-none", className)}
    >
      <span className="inline-flex overflow-hidden rounded-md bg-white px-1.5 py-0.5">
        <Image
          src="/aboundai-logo.png"
          alt="AboundAI"
          width={94}
          height={30}
          priority
          className="h-[30px] w-auto"
        />
      </span>
      <span className="pl-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Automated Title Research
      </span>
    </Link>
  );
}

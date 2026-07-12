import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { BrandMark } from "@/components/brand-mark";
import { BrandStripe } from "@/components/brand-stripe";
import { hasEnvVars } from "@/lib/utils";

export function SiteHeader() {
  return (
    <>
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center px-4 sm:px-6 text-sm">
          <BrandMark />
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
        </div>
      </nav>
      <BrandStripe />
    </>
  );
}

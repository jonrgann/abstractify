import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <SiteHeader />
        <div className="flex-1 flex flex-col gap-20 max-w-lg py-5 bg-background w-full">
          {children}
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}

import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <SiteHeader />
        <div className="flex-1 flex flex-col gap-20 max-w-lg py-5 bg-background">
          <div className="w-lg">
            <LoginForm />
          </div>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}

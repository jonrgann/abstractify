
import { AuthButton } from "@/components/auth-button";
import { useState } from "react"
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card"
import { LoginForm } from "@/components/login-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MaskedScrollArea } from "@/components/masked-scroll";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-12 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="items-center">
              <Link href={"/"} className="text-lg font-semibold leading-tight">Abstractify</Link>
              <p className="text-muted-foreground leading-tight">Automated Title Research</p>
            </div>
            <AuthButton />
          </div>
        </nav>
          <main className="flex-1 flex flex-col gap-2 px-4 max-w-5xl w-full">
          <div className="flex flex-col gap-6 w-full h-[640px]">
            <Card className="overflow-hidden p-0 w-full h-full">
              <CardContent className="grid p-0 md:grid-cols-[360px_1fr] h-full">
                {!user ? (
                  <LoginForm />
                ) : (
                  <div className="p-4">
                  </div>
                )}
                <div className="bg-muted relative hidden md:block ">
                  {/* <img
                    src="/placeholder.svg"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                  /> */}
                  <ScrollArea className="h-[640px] w-full rounded-md px-6 ">
                    <div className="mt-4">

                    </div>
                </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
          </main>
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="/"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Abstractify
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}

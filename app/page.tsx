
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
import { redirect } from 'next/navigation';

export default async function Home() {
  redirect('/agent'); // Redirect to '/another-page'

  return (<></>);
}

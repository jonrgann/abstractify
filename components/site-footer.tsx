import { ThemeSwitcher } from "@/components/theme-switcher";

export function SiteFooter() {
  return (
    <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
      <p>
        Powered by{" "}
        <a
          href="/"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          AboundAI
        </a>
      </p>
      <ThemeSwitcher />
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, User, Users } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/history", label: "История", icon: History },
  { href: "/company", label: "Компания", icon: Users },
  { href: "/profile", label: "Профиль", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-10 border-t backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

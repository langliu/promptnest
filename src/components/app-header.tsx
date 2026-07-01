import {
  Link,
  useNavigate,
  useRouteContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogOut } from "lucide-react";
import { AppLogoMark } from "@/components/app-logo";
import { logoutFn } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function NavLink({
  to,
  children,
  exact,
}: {
  to: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isActive = exact ? pathname === to : pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors",
        isActive ? "text-white" : "text-white/55 hover:text-white/90",
      )}
    >
      {children}
    </Link>
  );
}

export function AppHeader() {
  const { auth } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const router = useRouter();
  const logout = useServerFn(logoutFn);

  const handleLogout = async () => {
    await logout();
    await router.invalidate();
    await navigate({ to: "/login" });
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/55 to-transparent"
      />

      <div className="relative flex justify-center px-5 pt-5 sm:px-8 sm:pt-6">
        <nav
          className={cn(
            "pointer-events-auto relative isolate flex h-12 w-full max-w-7xl",
            "items-center justify-between px-4 sm:px-4",
            "rounded-xl",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_20px_50px_-16px_rgba(0,0,0,0.8)]",
          )}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-white/[0.07] backdrop-blur-3xl backdrop-saturate-150"
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 rounded-xl border border-white/20",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)]",
            )}
          />

          <div className="relative z-10 flex min-w-0 items-center">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-lg py-1.5 pr-3 pl-2 text-white transition-opacity hover:opacity-90"
            >
              <AppLogoMark />
              <span className="text-[0.9375rem] font-medium tracking-tight">
                PromptNest
              </span>
            </Link>

            <div className="ml-1 hidden items-center sm:flex">
              <NavLink to="/" exact>
                首页
              </NavLink>
              <NavLink to="/gallery">画廊</NavLink>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <Button
              render={<Link to="/prompts/new" />}
              nativeButton={false}
              className={cn(
                "h-9 shrink-0 rounded-lg border-0 bg-white px-5",
                "text-sm font-medium text-black shadow-[0_2px_10px_rgba(0,0,0,0.3)]",
                "hover:bg-white/92 active:bg-white/85",
              )}
            >
              新建 Prompt
            </Button>
            {auth.isAuthenticated && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                className="text-white/55 hover:bg-white/10 hover:text-white"
                aria-label="退出登录"
              >
                <LogOut className="size-4" />
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

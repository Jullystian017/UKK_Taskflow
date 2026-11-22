"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Command, ArrowRight, Loader2, KeyRound, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Silakan masukkan email dan kata sandi.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("at least 6 characters") ||
          error.message.toLowerCase().includes("password should be")
        ) {
          setErrorMessage("Kata sandi minimal 6 karakter.");
        } else if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Email atau kata sandi tidak sesuai.");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage("Email belum dikonfirmasi. Silakan periksa inbox email Anda.");
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        toast.success("Berhasil masuk ke TaskFlow!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-muted/20">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex size-10 items-center justify-center">
            <Command className="size-6 text-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            TaskFlow
          </h1>
          <p className="text-xs text-muted-foreground">
            Platform manajemen produktivitas & tugas UKK
          </p>
        </div>

        {/* Card Form Login */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Masuk ke Akun
            </h2>
            <p className="text-xs text-muted-foreground">
              Masukkan email dan kata sandi Anda untuk melanjutkan.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">
                  Kata Sandi (Min. 6 Karakter)
                </Label>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 h-9 text-sm"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 text-xs font-semibold gap-1.5 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer Navigation Link */}
        <div className="text-center text-xs text-muted-foreground">
          Belum memiliki akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

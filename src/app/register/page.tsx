"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Command, ArrowRight, Loader2, KeyRound, Mail, User, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setErrorMessage("Silakan lengkapi semua kolom pendaftaran.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("at least 6 characters") ||
          error.message.toLowerCase().includes("password should be")
        ) {
          setErrorMessage("Kata sandi minimal 6 karakter.");
        } else if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("user already exists")
        ) {
          setErrorMessage("Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk.");
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      // Jika pendaftaran langsung memberikan sesi (auto-confirm aktif)
      if (data.session) {
        toast.success("Akun berhasil dibuat! Mengalihkan ke dashboard...");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Verifikasi email dimatikan: langsung login otomatis dan masuk ke dashboard
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (loginData?.session) {
        toast.success("Akun berhasil dibuat! Mengalihkan ke dashboard...");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (loginError) {
        toast.success("Akun berhasil didaftarkan! Silakan masuk.");
        router.push("/login");
        return;
      }

      setIsSuccess(true);
      toast.success("Pendaftaran berhasil!");
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kendala koneksi pendaftaran. Silakan coba lagi.");
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
            Registrasi akun baru untuk manajemen tugas terpadu
          </p>
        </div>

        {/* Card Form Register */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-1">
                <CheckCircle2 className="size-6" />
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Akun Berhasil Didaftarkan!
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tautan konfirmasi telah dikirimkan ke <strong>{email}</strong> jika email verifikasi diaktifkan di Supabase, atau Anda dapat langsung masuk.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full h-9 text-xs font-semibold"
                >
                  Ke Halaman Masuk
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  Buat Akun Baru
                </h2>
                <p className="text-xs text-muted-foreground">
                  Lengkapi data berikut untuk mulai menggunakan TaskFlow.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs">
                    Nama Lengkap
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Nama Anda"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 h-9 text-sm"
                      required
                    />
                  </div>
                </div>

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
                  <Label htmlFor="password" className="text-xs">
                    Kata Sandi (Min. 6 Karakter)
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-9 text-sm"
                      autoComplete="new-password"
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs">
                    Konfirmasi Kata Sandi
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 pr-9 h-9 text-sm"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={showConfirmPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                      aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar Akun</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer Navigation Link */}
        <div className="text-center text-xs text-muted-foreground">
          Sudah memiliki akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Masuk di Sini
          </Link>
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

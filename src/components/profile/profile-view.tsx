"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  KeyRound,
  ShieldCheck,
  Check,
  Copy,
  Loader2,
  Calendar,
  Briefcase,
  FileText,
  Eye,
  EyeOff,
  LogOut,
  FolderKanban,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Workspace, Project, Todo } from "@/types";

interface ProfileViewProps {
  workspaces?: Workspace[];
  projects?: Project[];
  todos?: Todo[];
  onProfileUpdated?: (profile: { name: string; avatar: string }) => void;
  onBackToWorkspace?: () => void;
}

const PRESET_AVATARS = [
  {
    id: "avatar-1",
    label: "Developer",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces",
  },
  {
    id: "avatar-2",
    label: "Student",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=128&h=128&fit=crop&crop=faces",
  },
  {
    id: "avatar-3",
    label: "Creative",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
  },
  {
    id: "avatar-4",
    label: "Minimalist",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=faces",
  },
  {
    id: "avatar-5",
    label: "Coder",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&h=128&fit=crop&crop=faces",
  },
];

export function ProfileView({
  workspaces = [],
  projects = [],
  todos = [],
  onProfileUpdated,
  onBackToWorkspace,
}: ProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [fullName, setFullName] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("");
  const [bio, setBio] = React.useState<string>("");
  const [avatarUrl, setAvatarUrl] = React.useState<string>(PRESET_AVATARS[0].url);
  const [createdAt, setCreatedAt] = React.useState<string>("");

  const [isLoadingUser, setIsLoadingUser] = React.useState(true);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Ubah Password States
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

  const [copiedId, setCopiedId] = React.useState(false);

  // Ambil data user dari Supabase Auth
  React.useEffect(() => {
    async function fetchUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          setEmail(user.email || "");

          const metadata = user.user_metadata || {};
          const name = metadata.full_name || user.email?.split("@")[0] || "Pengguna";
          setFullName(name);
          setRole(metadata.role || "Siswa UKK / Web Developer");
          setBio(metadata.bio || "Fokus menyelesaikan target proyek dan tugas harian secara terstruktur.");

          if (metadata.avatar_url) {
            setAvatarUrl(metadata.avatar_url);
          }

          if (user.created_at) {
            const date = new Date(user.created_at);
            setCreatedAt(
              date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            );
          }
        }
      } catch (err) {
        console.error("Gagal memuat data profil:", err);
      } finally {
        setIsLoadingUser(false);
      }
    }

    fetchUserData();
  }, [supabase]);

  // Handler Simpan Data Profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          role: role.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
        },
      });

      if (error) {
        toast.error(`Gagal menyimpan: ${error.message}`);
        return;
      }

      toast.success("Informasi profil dan foto berhasil diperbarui!");
      onProfileUpdated?.({
        name: fullName.trim(),
        avatar: avatarUrl,
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kendala saat memperbarui profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler Ganti Kata Sandi
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error("Silakan masukkan kata sandi baru.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("at least 6 characters") ||
          error.message.toLowerCase().includes("password should be")
        ) {
          toast.error("Kata sandi baru minimal 6 karakter.");
        } else {
          toast.error(`Gagal mengubah kata sandi: ${error.message}`);
        }
        return;
      }

      toast.success("Kata sandi berhasil diperbarui!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kendala saat memperbarui kata sandi.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handler Copy UID
  const handleCopyUserId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    toast.success("User ID berhasil disalin ke clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handler Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil keluar dari akun.");
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Gagal keluar.");
    }
  };

  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "TF";

  const completedTodosCount = todos.filter((t) => t.status === "done").length;
  const inProgressTodosCount = todos.filter((t) => t.status === "in_progress").length;

  if (isLoadingUser) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.12)-1px)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Memuat data profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-theme(spacing.12)-1px)] max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Profil Pengguna
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola identitas akun, foto profil, dan pengaturan keamanan Anda.
          </p>
        </div>
        {onBackToWorkspace && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToWorkspace}
            className="text-xs self-start sm:self-auto h-8"
          >
            Kembali ke Workspace
          </Button>
        )}
      </div>

      {/* Ringkasan Statistik Produktivitas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FolderKanban className="size-4" />
            <span className="text-xs font-medium">Workspaces</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {workspaces.length}
          </p>
        </Card>
        <Card className="p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Briefcase className="size-4" />
            <span className="text-xs font-medium">Proyek</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {projects.length}
          </p>
        </Card>
        <Card className="p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium">Tugas Selesai</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {completedTodosCount}
          </p>
        </Card>
        <Card className="p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium">Sedang Berjalan</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {inProgressTodosCount}
          </p>
        </Card>
      </div>

      {/* Form Edit Profil */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            Informasi Pribadi
          </CardTitle>
          <CardDescription className="text-xs">
            Perbarui nama tampilan, jabatan, dan foto profil Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Foto Profil & Avatar Picker */}
            <div className="space-y-3">
              <Label className="text-xs font-medium">Foto Profil</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="size-16 rounded-2xl ring-2 ring-border">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="text-base font-semibold rounded-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Pilih avatar preset atau tempelkan URL foto eksternal:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`size-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          avatarUrl === preset.url
                            ? "border-primary ring-2 ring-primary/20 scale-105"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        title={preset.label}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="size-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Custom URL Avatar */}
              <div className="pt-1">
                <Input
                  type="url"
                  placeholder="https://... (URL foto custom)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-xs font-medium">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Anda"
                    className="pl-9 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Peran / Jabatan */}
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs font-medium">
                  Peran / Jabatan
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Contoh: Siswa UKK / Junior Web Developer"
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-medium">
                Bio Singkat
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="bio"
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ceritakan sedikit tentang fokus atau target Anda..."
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="h-8 text-xs font-semibold px-4"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan Profil"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informasi Akun & Kredensial */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            Detail Akun
          </CardTitle>
          <CardDescription className="text-xs">
            Informasi identitas akun yang terdaftar di database Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Email Terdaftar
              </Label>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">{email || "Tidak ada email"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0 font-normal ml-2">
                  <ShieldCheck className="size-3 mr-1 text-emerald-600" />
                  Terverifikasi
                </Badge>
              </div>
            </div>

            {/* Waktu Bergabung */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Tanggal Pendaftaran Akun
              </Label>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs font-medium">
                <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                <span>{createdAt || "Hari ini"}</span>
              </div>
            </div>
          </div>

          {/* User ID (UID) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              User ID (UID Supabase)
            </Label>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 font-mono text-xs">
              <span className="truncate text-muted-foreground">{userId}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyUserId}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0 ml-2"
              >
                {copiedId ? (
                  <>
                    <Check className="size-3 text-emerald-600 mr-1" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="size-3 mr-1" />
                    Salin UID
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keamanan & Ganti Kata Sandi */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            Keamanan Akun
          </CardTitle>
          <CardDescription className="text-xs">
            Perbarui kata sandi akun Anda untuk menjaga keamanan data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kata Sandi Baru */}
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-medium">
                  Kata Sandi Baru
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="pl-9 pr-9 h-9 text-xs"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi Baru */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-new-password" className="text-xs font-medium">
                  Konfirmasi Kata Sandi Baru
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="pl-9 pr-9 h-9 text-xs"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isUpdatingPassword || !newPassword}
                variant="outline"
                className="h-8 text-xs font-semibold px-4"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Memperbarui Sandi...
                  </>
                ) : (
                  "Perbarui Kata Sandi"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sesi & Logout */}
      <Card className="border-destructive/20 bg-destructive/5 shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-destructive">
              Keluar dari Sesi
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Akhiri sesi aktif Anda di perangkat ini.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="h-8 text-xs font-semibold self-start sm:self-auto gap-1.5"
          >
            <LogOut className="size-3.5" />
            <span>Keluar Akun</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

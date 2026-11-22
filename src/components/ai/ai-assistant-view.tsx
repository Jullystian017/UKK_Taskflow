"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowUp,
  RotateCcw,
  Check,
  Copy,
  Flame,
  ListTodo,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { Todo, Project, Workspace, Priority } from "@/types";
import { useDashboard } from "@/context/dashboard-context";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
}

export interface TaskProposal {
  title: string;
  description?: string;
  priority: Priority;
  due_date?: string | null;
  subtasks?: string[];
}

interface AiAssistantViewProps {
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  activeWorkspace?: Workspace;
  todos: Todo[];
  projects: Project[];
  onSyncTodos?: (todos: Todo[]) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Calendar,
    title: "Jadwalkan kegiatan",
    desc: "Ketik kegiatan dan tanggalnya, AI otomatis jadwalkan langsung ke kalender",
    prompt: "Saya ada tugas makalah bab 3 harus kumpul lusa jam 9 pagi, tolong jadwalkan ke kalender dan buatkan checklist langkah kerjanya.",
  },
  {
    icon: Flame,
    title: "Prioritas hari ini",
    desc: "Tugas mana yang paling mendesak dan penting?",
    prompt: "Analisis seluruh tugas saya dan buatkan urutan prioritas yang harus saya kerjakan hari ini beserta alasannya.",
  },
  {
    icon: ListTodo,
    title: "Breakdown langkah kerja",
    desc: "Bagi tugas besar menjadi subtask konkret",
    prompt: "Bantu buatkan rincian langkah kerja (subtasks) konkret untuk tugas prioritas tinggi saya yang masih berjalan.",
  },
  {
    icon: Lightbulb,
    title: "Evaluasi & Pengingat",
    desc: "Cek tugas deadline dekat & beban pekan ini",
    prompt: "Bagaimana beban kerja dan tenggat waktu saya minggu ini? Apakah ada potensi tugas yang terlambat atau harus segera diselesaikan?",
  },
];

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Helper untuk mengekstrak usulan tugas JSON dari pesan AI
function extractTaskProposal(content: string): { cleanContent: string; proposal: TaskProposal | null } {
  // Cek blok format khusus json:task_proposal
  const proposalMatch = content.match(/```json:task_proposal\s*([\s\S]*?)\s*```/);
  if (proposalMatch) {
    try {
      const parsed = JSON.parse(proposalMatch[1]);
      if (parsed.title) {
        const clean = content.replace(proposalMatch[0], "").trim();
        return {
          cleanContent: clean,
          proposal: {
            title: String(parsed.title),
            description: parsed.description ? String(parsed.description) : "",
            priority: parsed.priority === "high" || parsed.priority === "low" ? parsed.priority : "medium",
            due_date: parsed.due_date ? String(parsed.due_date) : null,
            subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks.map(String) : [],
          },
        };
      }
    } catch {
      // Abaikan jika parse gagal
    }
  }

  // Cek blok generic ```json jika ada properti title
  const genericMatch = content.match(/```json\s*(\{[\s\S]*?"title"[\s\S]*?\})\s*```/);
  if (genericMatch) {
    try {
      const parsed = JSON.parse(genericMatch[1]);
      if (parsed.title) {
        const clean = content.replace(genericMatch[0], "").trim();
        return {
          cleanContent: clean,
          proposal: {
            title: String(parsed.title),
            description: parsed.description ? String(parsed.description) : "",
            priority: parsed.priority === "high" || parsed.priority === "low" ? parsed.priority : "medium",
            due_date: parsed.due_date ? String(parsed.due_date) : null,
            subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks.map(String) : [],
          },
        };
      }
    } catch {
      // Abaikan jika parse gagal
    }
  }

  return { cleanContent: content, proposal: null };
}

// Helper untuk memformat teks inline: ubah **bold** dan *italic* ke span tanpa menyisakan simbol *
function formatInlineText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index).replace(/\*/g, ""));
    }
    const token = match[0];
    parts.push(
      <strong key={match.index} className="font-semibold">
        {token.slice(2, -2).replace(/\*/g, "")}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex).replace(/\*/g, ""));
  }

  return parts;
}

// Helper untuk membersihkan emotikon dan simbol markdown mentah (#, *, •)
function renderCleanMessageContent(content: string) {
  // 1. Bersihkan semua ragam emoji unicode
  let clean = content.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );

  // 2. Bersihkan artefak awalan seperti ". *", ". **", "* *"
  clean = clean
    .replace(/^[\s.]+\*\s*\*/gm, "- ")
    .replace(/^[\s.]+\*\*/gm, "- ")
    .replace(/^[\s.]+\*\s*/gm, "- ")
    .replace(/^[\s.]+\s*-\s*/gm, "- ");

  const lines = clean.split("\n");

  return lines.map((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return <div key={idx} className="h-1.5" />;

    // Heading: ### Judul atau ## Judul
    if (/^#{1,4}\s+/.test(line)) {
      const headingText = line.replace(/^#{1,4}\s+/, "").replace(/[*#]/g, "");
      return (
        <h4 key={idx} className="font-semibold text-sm mt-2.5 mb-1 text-foreground">
          {headingText}
        </h4>
      );
    }

    // Numbered list: 1. Item
    const numMatch = line.match(/^(\d+\.)\s+(.*)/);
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5">
          <span className="text-muted-foreground select-none shrink-0 text-xs mt-0.5 font-medium">
            {numMatch[1]}
          </span>
          <div className="flex-1 text-foreground leading-relaxed">
            {formatInlineText(numMatch[2])}
          </div>
        </div>
      );
    }

    // Bullet list: - Item atau * Item atau • Item
    const bulletMatch = line.match(/^([-*•])\s+(.*)/);
    if (bulletMatch) {
      return (
        <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5">
          <span className="text-muted-foreground select-none shrink-0 text-xs mt-0.5">
            —
          </span>
          <div className="flex-1 text-foreground leading-relaxed">
            {formatInlineText(bulletMatch[2])}
          </div>
        </div>
      );
    }

    return (
      <p key={idx} className="text-foreground leading-relaxed">
        {formatInlineText(line)}
      </p>
    );
  });
}

export function AiAssistantView({
  workspaces,
  activeWorkspaceId,
  activeWorkspace: propActiveWorkspace,
  todos,
  projects,
  onSyncTodos,
}: AiAssistantViewProps) {
  const { aiMessages, setAiMessages } = useDashboard();
  const messages = aiMessages;
  const setMessages = setAiMessages;
  const [inputMessage, setInputMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [savedProposalMessageIds, setSavedProposalMessageIds] = React.useState<Set<string>>(new Set());

  const activeWorkspace = React.useMemo(() => {
    return propActiveWorkspace ?? workspaces?.find((w) => w.id === activeWorkspaceId);
  }, [propActiveWorkspace, workspaces, activeWorkspaceId]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend ?? inputMessage).trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: createMessageId("user"),
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          workspaceName: activeWorkspace?.name ?? "My Tasks",
          tasks: todos,
          projects,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mendapatkan respon.");
      }

      const data = await response.json();
      const aiReply: Message = {
        id: createMessageId("ai"),
        role: "model",
        content: data.reply ?? "Maaf, belum dapat menghasilkan respon.",
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kendala koneksi.");
      const errorMsg: Message = {
        id: createMessageId("err"),
        role: "model",
        content: "Maaf, terjadi kendala saat memproses permintaan. Silakan coba kembali.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simpan usulan jadwal AI langsung ke kalender
  const handleSaveProposal = React.useCallback(
    (proposal: TaskProposal, messageId: string) => {
      if (!onSyncTodos) {
        toast.error("Koneksi penyimpanan belum tersedia.");
        return;
      }

      const targetWsId = activeWorkspaceId || workspaces?.[0]?.id || "ws-default";
      const currentWorkspaceProjects = projects.filter(
        (p) => p.workspace_id === targetWsId
      );
      const targetProjectId = currentWorkspaceProjects[0]?.id ?? projects[0]?.id ?? "proj-default";

      const todayStr = new Date().toISOString().split("T")[0];
      let finalDueDate = proposal.due_date ?? null;
      if (finalDueDate && finalDueDate < todayStr) {
        finalDueDate = todayStr;
      }

      const timestamp = Date.now();
      const todoId = `todo-${timestamp}`;
      const newTodo: Todo = {
        id: todoId,
        title: proposal.title,
        description: proposal.description ?? "",
        project_id: targetProjectId,
        priority: proposal.priority,
        status: "todo",
        due_date: finalDueDate,
        is_event: true, // Khusus jadwal kalender, tidak akan muncul sebagai tugas di kanban workspace
        subtasks: (proposal.subtasks ?? []).map((stTitle, idx) => ({
          id: `sub-${timestamp}-${idx}`,
          todo_id: todoId,
          title: stTitle,
          is_done: false,
        })),
        created_at: new Date(timestamp).toISOString(),
      };

      onSyncTodos([newTodo, ...todos]);
      setSavedProposalMessageIds((prev) => new Set(prev).add(messageId));

      const dateNotice = proposal.due_date ? ` (Tenggat: ${proposal.due_date})` : "";
      toast.success(`Jadwal "${newTodo.title}" berhasil disimpan ke Kalender${dateNotice}!`);
    },
    [onSyncTodos, activeWorkspaceId, workspaces, projects, todos]
  );

  const handleCopy = (text: string, id: string) => {
    // Hapus blok JSON jika ada saat menyalin teks
    const { cleanContent } = extractTaskProposal(text);
    navigator.clipboard.writeText(cleanContent);
    setCopiedId(id);
    toast.success("Respon disalin ke clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Messages List / Empty State */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 scrollbar-thin">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length > 0 && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMessages([])}
                className="h-7 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                <span>Bersihkan Chat</span>
              </Button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="space-y-6 py-8 text-center animate-in fade-in-50 duration-300">
              <div className="space-y-2">
                <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted/60 border shadow-2xs">
                  <Sparkles className="size-6 text-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Ada yang bisa saya bantu hari ini?
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Kelola tugas, rencanakan jadwal kegiatan, dan buat rincian langkah kerja secara terarah.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                {STARTER_PROMPTS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="group flex flex-col justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/40 hover:border-foreground/30 transition-all text-left shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                          <Icon className="size-4" />
                        </div>
                        <h4 className="text-xs font-semibold text-foreground">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isCopied = copiedId === msg.id;
            const { cleanContent, proposal } = isUser
              ? { cleanContent: msg.content, proposal: null }
              : extractTaskProposal(msg.content);

            return (
              <div
                key={`${msg.id || "msg"}-${idx}`}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground mt-0.5">
                    <Sparkles className="size-3.5" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-xs font-normal shadow-xs"
                      : "bg-muted/50 border text-foreground rounded-bl-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-white dark:text-zinc-900 font-normal">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {renderCleanMessageContent(cleanContent)}

                      {/* Usulan Jadwal Otomatis (Interactive Proposal Card) */}
                      {proposal && (
                        <div className="mt-3.5 rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <Calendar className="size-3.5 text-primary" />
                              <span>Rencana Jadwal Kalender</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] capitalize px-1.5 py-0 font-medium"
                              >
                                {proposal.priority}
                              </Badge>
                              {proposal.due_date && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium border border-border/40">
                                  <Calendar className="size-3" />
                                  <span>{proposal.due_date}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-foreground">
                              {proposal.title}
                            </h4>
                            {proposal.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {proposal.description}
                              </p>
                            )}
                          </div>

                          {proposal.subtasks && proposal.subtasks.length > 0 && (
                            <div className="space-y-1 rounded-lg bg-muted/40 p-2.5 border border-border/50 text-xs">
                              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                <ListTodo className="size-3 text-primary" />
                                <span>Langkah Kerja ({proposal.subtasks.length} checklist):</span>
                              </div>
                              {proposal.subtasks.map((st, i) => (
                                <div key={i} className="flex items-start gap-2 text-foreground/85 pl-1 py-0.5">
                                  <span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0 mt-1.5" />
                                  <span className="text-[11px] leading-tight flex-1">{st}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="pt-1">
                            {savedProposalMessageIds.has(msg.id) ? (
                              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                <Check className="size-3.5" />
                                <span>Tersimpan di Kalender</span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleSaveProposal(proposal, msg.id)}
                                className="gap-1.5 text-xs font-medium h-8 shadow-xs cursor-pointer"
                              >
                                <Calendar className="size-3.5" />
                                <span>Simpan ke Kalender</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isUser && (
                    <div className="flex justify-end pt-1 -mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="size-6 text-muted-foreground hover:text-foreground"
                        title="Salin pesan"
                      >
                        {isCopied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-muted-foreground">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Sparkles className="size-3.5 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-muted/40 border text-xs">
                <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce" />
                <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:0.2s]" />
                <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. Floating Modern Input Bar */}
      <div className="p-4 sm:pb-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center rounded-2xl border bg-card p-1.5 shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-foreground/30 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Tanyakan tugas atau rencanakan jadwal..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 max-h-32 resize-none bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-hidden disabled:opacity-50"
            />
            <Button
              size="icon"
              disabled={!inputMessage.trim() || isLoading}
              onClick={() => handleSendMessage()}
              className="size-8 rounded-xl shrink-0 transition-transform active:scale-95"
            >
              <ArrowUp className="size-4" />
              <span className="sr-only">Kirim</span>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Tekan Enter untuk kirim, Shift + Enter untuk baris baru
          </p>
        </div>
      </div>
    </div>
  );
}

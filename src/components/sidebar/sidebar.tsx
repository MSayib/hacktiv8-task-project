"use client";

import { useTranslations } from "next-intl";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { Plus, Trash2, MoreHorizontal, Pencil, X, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { exportAsMarkdown, exportAllAsZip } from "@/lib/export";

function groupByDate(conversations: { createdAt: string }[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const last7 = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, number[]> = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  conversations.forEach((c, i) => {
    const d = new Date(c.createdAt);
    if (d >= today) groups.today.push(i);
    else if (d >= yesterday) groups.yesterday.push(i);
    else if (d >= last7) groups.previous7Days.push(i);
    else groups.older.push(i);
  });

  return groups;
}

export function Sidebar() {
  const t = useTranslations("sidebar");
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeConversationId);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActive = useChatStore((s) => s.setActiveConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);
  const deleteAll = useChatStore((s) => s.deleteAllConversations);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const groups = groupByDate(conversations);
  const groupLabels: Record<string, string> = {
    today: t("today"),
    yesterday: t("yesterday"),
    previous7Days: t("previous7Days"),
    older: t("older"),
  };

  const handleRename = (id: string, currentTitle: string) => {
    const newTitle = prompt(t("rename"), currentTitle);
    if (newTitle && newTitle.trim()) {
      renameConversation(id, newTitle.trim());
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-sidebar transition-transform duration-200 md:relative md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-semibold">{t("title")}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 pb-3">
          <Button
            onClick={() => createConversation()}
            className="w-full justify-start gap-2 gradient-primary text-white"
          >
            <Plus className="h-4 w-4" />
            {t("title") === "Riwayat Chat" ? "Percakapan Baru" : "New Chat"}
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {t("noConversations")}
            </p>
          ) : (
            <div className="p-2">
              {Object.entries(groups).map(
                ([key, indices]) =>
                  indices.length > 0 && (
                    <div key={key} className="mb-3">
                      <p className="mb-1 px-2 text-[11px] font-medium uppercase text-muted-foreground">
                        {groupLabels[key]}
                      </p>
                      {indices.map((i) => {
                        const conv = conversations[i];
                        return (
                          <div
                            key={conv.id}
                            className={cn(
                              "group flex items-center gap-1 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-sidebar-accent",
                              activeId === conv.id && "bg-sidebar-accent"
                            )}
                            onClick={() => {
                              setActive(conv.id);
                              setSidebarOpen(false);
                            }}
                          >
                            <span className="flex-1 truncate" title={conv.title}>
                              {conv.title}
                            </span>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRename(conv.id, conv.title);
                                  }}
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" />
                                  {t("rename")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportAsMarkdown(conv);
                                  }}
                                >
                                  <FileDown className="mr-2 h-3.5 w-3.5" />
                                  {t("export")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConversation(conv.id);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  {t("delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  )
              )}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-3 space-y-1">
          {conversations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={() => exportAllAsZip(conversations)}
            >
              <Download className="h-3.5 w-3.5" />
              {t("exportAll")}
            </Button>
          )}
          {conversations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs text-destructive"
              onClick={() => {
                if (confirm(t("deleteAllConfirm"))) deleteAll();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("deleteAll")}
            </Button>
          )}
        </div>

        <Separator />
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
              MS
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Muhamad Sayib R.</p>
              <p className="text-[10px] text-muted-foreground">Student</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

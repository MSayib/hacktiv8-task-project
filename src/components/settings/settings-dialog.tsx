"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Pencil, Trash2, Eye, EyeOff, Copy, Check, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { SYSTEM_INSTRUCTION } from "@/lib/constants";

function ModelParametersTab() {
  const t = useTranslations("settings");
  const parameters = useSettingsStore((s) => s.parameters);
  const setParameters = useSettingsStore((s) => s.setParameters);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label htmlFor="enable-params">{t("enableCustomParams")}</Label>
        <Switch
          id="enable-params"
          checked={parameters.enabled}
          onCheckedChange={(val) => setParameters({ enabled: val })}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t("temperature")}</Label>
            <Input
              type="number"
              value={parameters.temperature}
              onChange={(e) =>
                setParameters({
                  temperature: Math.min(2, Math.max(0, parseFloat(e.target.value) || 0)),
                })
              }
              disabled={!parameters.enabled}
              className="w-20 h-7 text-xs text-center"
              min={0}
              max={2}
              step={0.1}
            />
          </div>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={[parameters.temperature]}
            onValueChange={(val) =>
              setParameters({ temperature: Array.isArray(val) ? val[0] : val })
            }
            disabled={!parameters.enabled}
          />
          <p className="text-[10px] text-muted-foreground">
            {t("temperatureDescription")}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t("topK")}</Label>
            <Input
              type="number"
              value={parameters.topK}
              onChange={(e) =>
                setParameters({
                  topK: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)),
                })
              }
              disabled={!parameters.enabled}
              className="w-20 h-7 text-xs text-center"
              min={1}
              max={100}
              step={1}
            />
          </div>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[parameters.topK]}
            onValueChange={(val) =>
              setParameters({ topK: Array.isArray(val) ? val[0] : val })
            }
            disabled={!parameters.enabled}
          />
          <p className="text-[10px] text-muted-foreground">
            {t("topKDescription")}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t("topP")}</Label>
            <Input
              type="number"
              value={parameters.topP}
              onChange={(e) =>
                setParameters({
                  topP: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)),
                })
              }
              disabled={!parameters.enabled}
              className="w-20 h-7 text-xs text-center"
              min={0}
              max={1}
              step={0.05}
            />
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[parameters.topP]}
            onValueChange={(val) =>
              setParameters({ topP: Array.isArray(val) ? val[0] : val })
            }
            disabled={!parameters.enabled}
          />
          <p className="text-[10px] text-muted-foreground">
            {t("topPDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdvancedTab() {
  const t = useTranslations("settings");

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("systemInstruction")}</Label>
        <ScrollArea className="h-48 rounded-md border bg-muted/30 p-3">
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-mono">
            {SYSTEM_INSTRUCTION}
          </pre>
        </ScrollArea>
        <p className="text-[10px] text-muted-foreground">
          System instruction bersifat read-only untuk transparansi.
        </p>
      </div>
    </div>
  );
}

function ApiKeyTab() {
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);
  const setApiKeyOverride = useSettingsStore((s) => s.setApiKeyOverride);
  const setCustomModels = useSettingsStore((s) => s.setCustomModels);
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string; modelCount?: number } | null>(null);

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return "••••••••••••" + key.slice(-4);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKeyOverride.key);
    setCopied(true);
    toast.success("API key disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!inputKey.trim()) {
      toast.error("API key tidak boleh kosong");
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      });

      const data = await res.json();

      if (data.valid) {
        setApiKeyOverride({ key: inputKey.trim(), saved: true });
        setCustomModels(data.models ?? []);
        setValidationResult({ valid: true, modelCount: data.models?.length ?? 0 });
        toast.success(`API key valid! ${data.models?.length ?? 0} model Gemini tersedia.`);
        setInputKey("");
      } else {
        setValidationResult({ valid: false, error: data.error || "API key tidak valid" });
        toast.error(data.error || "API key tidak valid");
      }
    } catch {
      setValidationResult({ valid: false, error: "Gagal memvalidasi API key" });
      toast.error("Gagal memvalidasi API key");
    } finally {
      setValidating(false);
    }
  };

  const handleEdit = () => {
    setInputKey(apiKeyOverride.key);
    setApiKeyOverride({ saved: false });
    setValidationResult(null);
  };

  const handleDelete = () => {
    setApiKeyOverride({ enabled: false, key: "", saved: false });
    setCustomModels([]);
    setInputKey("");
    setValidationResult(null);
    toast.success("API key dihapus");
  };

  const handleToggleEnabled = async (val: boolean) => {
    if (val) {
      setApiKeyOverride({ enabled: true });
      // If key was already saved, re-fetch models (like pressing Save again)
      if (apiKeyOverride.saved && apiKeyOverride.key) {
        setValidating(true);
        setValidationResult(null);
        try {
          const res = await fetch("/api/validate-key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: apiKeyOverride.key }),
          });
          const data = await res.json();
          if (data.valid) {
            setCustomModels(data.models ?? []);
            setValidationResult({ valid: true, modelCount: data.models?.length ?? 0 });
          } else {
            // Key became invalid — reset saved state
            setApiKeyOverride({ saved: false, key: "" });
            setCustomModels([]);
            setValidationResult({ valid: false, error: data.error || "API key tidak lagi valid" });
            toast.error("API key tidak lagi valid. Silakan masukkan key baru.");
          }
        } catch {
          setValidationResult({ valid: false, error: "Gagal memvalidasi API key" });
          toast.error("Gagal memvalidasi API key");
        } finally {
          setValidating(false);
        }
      }
    } else {
      // Turning off — if key was never saved/validated, reset everything
      if (!apiKeyOverride.saved) {
        setApiKeyOverride({ enabled: false, key: "", saved: false });
        setCustomModels([]);
        setInputKey("");
        setValidationResult(null);
      } else {
        setApiKeyOverride({ enabled: false });
        setCustomModels([]);
        setValidationResult(null);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Label>Gemini API Key</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gunakan API key pribadi dari Google AI Studio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {validating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <Switch
            checked={apiKeyOverride.enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={validating}
          />
        </div>
      </div>

      {apiKeyOverride.enabled && (
        <>
          <Separator />

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/30">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Perhatian Keamanan:
            </p>
            <ul className="mt-1 space-y-0.5 text-amber-700 dark:text-amber-300">
              <li>Key TIDAK disimpan di server</li>
              <li>Key dikirim via HTTPS ke server lalu diteruskan ke Google Gemini API</li>
              <li>Key hilang saat tab/browser ditutup</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>API Key</Label>

              {apiKeyOverride.saved ? (
                /* Saved state — show masked key with action buttons */
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-sm font-mono">
                      {showKey ? apiKeyOverride.key : maskKey(apiKeyOverride.key)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setShowKey(!showKey)}
                      title={showKey ? "Sembunyikan" : "Lihat"}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleCopy}
                      title="Salin"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={handleEdit}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs text-destructive hover:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3 w-3" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                /* Input state — text input with save button */
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      placeholder="AIza..."
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                      }}
                    />
                    <Button
                      size="sm"
                      className="gap-1.5 shrink-0"
                      onClick={handleSave}
                      disabled={!inputKey.trim() || validating}
                    >
                      {validating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {validating ? "Validasi..." : "Simpan"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Validation result feedback */}
              {validationResult && (
                <div className={`flex items-center gap-2 rounded-md border p-2.5 text-xs ${
                  validationResult.valid
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                    : "border-destructive/30 bg-destructive/5 text-destructive"
                }`}>
                  {validationResult.valid ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>API key valid — {validationResult.modelCount} model Gemini tersedia.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{validationResult.error}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function SettingsDialog() {
  const t = useTranslations("settings");
  const open = useUIStore((s) => s.settingsOpen);
  const setOpen = useUIStore((s) => s.setSettingsOpen);
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);
  const setApiKeyOverride = useSettingsStore((s) => s.setApiKeyOverride);
  const setCustomModels = useSettingsStore((s) => s.setCustomModels);

  const handleOpenChange = (isOpen: boolean) => {
    // When dialog is closing, revert unsaved API key state
    if (!isOpen && apiKeyOverride.enabled && !apiKeyOverride.saved) {
      setApiKeyOverride({ enabled: false, key: "", saved: false });
      setCustomModels([]);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            Konfigurasi model dan preferensi aplikasi.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="params">
          <TabsList className="w-full">
            <TabsTrigger value="params">{t("modelParams")}</TabsTrigger>
            <TabsTrigger value="advanced">{t("advanced")}</TabsTrigger>
            <TabsTrigger value="apikey">Gemini API Key</TabsTrigger>
          </TabsList>
          <TabsContent value="params" className="mt-4">
            <ModelParametersTab />
          </TabsContent>
          <TabsContent value="advanced" className="mt-4">
            <AdvancedTab />
          </TabsContent>
          <TabsContent value="apikey" className="mt-4">
            <ApiKeyTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

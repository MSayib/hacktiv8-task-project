"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { SYSTEM_INSTRUCTION } from "@/lib/constants";
import type { Provider } from "@/types/models";

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
  const t = useTranslations("settings");
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);
  const setApiKeyOverride = useSettingsStore((s) => s.setApiKeyOverride);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Label>{t("useCustomKey")}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gunakan API key pribadi Anda
          </p>
        </div>
        <Switch
          checked={apiKeyOverride.enabled}
          onCheckedChange={(val) => setApiKeyOverride({ enabled: val })}
        />
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
              <li>Key dikirim via HTTPS ke server lalu diteruskan ke provider</li>
              <li>Key hilang saat tab/browser ditutup</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("provider")}</Label>
              <Select
                value={apiKeyOverride.provider}
                onValueChange={(val: string | null) => {
                  if (val) setApiKeyOverride({ provider: val as Provider });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Gemini</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="sk-... atau AIza..."
                value={apiKeyOverride.key}
                onChange={(e) =>
                  setApiKeyOverride({ key: e.target.value })
                }
              />
              {apiKeyOverride.key && (
                <p className="text-[10px] text-muted-foreground">
                  Key: ••••••••
                  {apiKeyOverride.key.slice(-4)}
                </p>
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <TabsTrigger value="apikey">{t("apiKey")}</TabsTrigger>
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

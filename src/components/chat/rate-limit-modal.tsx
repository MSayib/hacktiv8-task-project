"use client";

import { Gauge, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/stores/settings-store";
import { AVAILABLE_MODELS } from "@/lib/constants";
import { formatTokenCount } from "@/lib/models";

interface RateLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RateLimitModal({ open, onOpenChange }: RateLimitModalProps) {
  const modelId = useSettingsStore((s) => s.modelId);
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);
  const customModels = useSettingsStore((s) => s.customModels);

  const isCustomKey = apiKeyOverride.enabled && apiKeyOverride.saved;
  const modelDef = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const customModel = isCustomKey
    ? customModels.find((m) => m.id === modelId)
    : null;

  const limits = modelDef?.rateLimit ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Rate Limit
          </DialogTitle>
          <DialogDescription>
            Informasi batas penggunaan API untuk model saat ini.
          </DialogDescription>
        </DialogHeader>

        {/* API Key & model info */}
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs flex items-center justify-between">
          <div>
            <span className="text-muted-foreground">API Key: </span>
            <span className="font-medium">
              {isCustomKey ? "Custom (Personal)" : "System"}
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground truncate ml-2 max-w-[180px]">
            {modelDef?.name ?? customModel?.name ?? modelId}
          </span>
        </div>

        {/* Known rate limits for built-in models */}
        {limits && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <LimitCard label="RPM" sublabel="Request/Menit" value={limits.rpm.toString()} />
              <LimitCard label="RPD" sublabel="Request/Hari" value={limits.rpd.toString()} />
              <LimitCard label="TPM" sublabel="Token/Menit" value={formatTokenCount(limits.tpm)} />
            </div>

            <Separator />

            {/* How rate limits work */}
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground text-xs">Cara kerja rate limit:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>
                  <strong>RPM</strong> — Maks. <strong>{limits.rpm}</strong> request per menit.
                  Reset setiap 60 detik.
                </li>
                <li>
                  <strong>RPD</strong> — Maks. <strong>{limits.rpd}</strong> request per hari.
                  Reset tengah malam Waktu Pasifik (~14:00 WIB).
                </li>
                <li>
                  <strong>TPM</strong> — Maks. <strong>{formatTokenCount(limits.tpm)}</strong> token (input + output) per menit.
                </li>
              </ul>
              <p className="pt-1">
                Jika salah satu batas tercapai, API mengembalikan error <code className="bg-muted px-1 rounded">429</code> dan
                harus menunggu hingga periode reset.
              </p>
            </div>
          </div>
        )}

        {/* Custom model — no known limits */}
        {!limits && isCustomKey && (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              Rate limit untuk model <strong>{customModel?.name ?? modelId}</strong> bergantung
              pada tier akun Google AI Anda (Free, Pay-as-you-go, atau Enterprise).
            </p>
            <p>
              Gunakan dashboard Google AI Studio untuk melihat sisa quota secara real-time.
            </p>
          </div>
        )}

        {/* No limits info at all (shouldn't happen, but fallback) */}
        {!limits && !isCustomKey && (
          <div className="text-xs text-muted-foreground">
            Informasi rate limit tidak tersedia untuk model ini.
          </div>
        )}

        <Separator />

        {/* Dashboard link */}
        <a
          href="https://aistudio.google.com/rate-limit"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs hover:bg-accent/50 transition-colors group"
        >
          <div>
            <p className="font-medium text-foreground">Google AI Studio — Rate Limit</p>
            <p className="text-muted-foreground mt-0.5">
              Lihat sisa quota real-time langsung dari dashboard Google
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-3" />
        </a>

        <div className="text-[10px] text-muted-foreground">
          Gemini API tidak menyediakan endpoint untuk cek sisa quota.
          Gunakan link di atas untuk monitoring real-time.
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LimitCard({ label, sublabel, value }: { label: string; sublabel: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-2.5 text-center space-y-0.5">
      <p className="text-lg font-bold font-mono leading-none">{value}</p>
      <p className="text-[10px] font-medium">{label}</p>
      <p className="text-[9px] text-muted-foreground leading-tight">{sublabel}</p>
    </div>
  );
}

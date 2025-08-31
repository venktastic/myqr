"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
// Types for 'qrcode' come from @types/qrcode
import * as QRCode from "qrcode";
import { motion } from "framer-motion";
import { Download, ImagePlus, Copy, RefreshCw, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Ecl = "L" | "M" | "Q" | "H";

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export default function Page() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(16);
  const [ecl, setEcl] = useState<Ecl>("H");

  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoPct, setLogoPct] = useState(20);
  const [knockoutPct, setKnockoutPct] = useState(4);
  const [rounded, setRounded] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const logoSide = useMemo(() => Math.round((size * logoPct) / 100), [size, logoPct]);
  const knockoutPad = useMemo(() => Math.round((size * knockoutPct) / 100), [size, knockoutPct]);

  async function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    await QRCode.toCanvas(canvas, text || " ", {
      errorCorrectionLevel: ecl,
      width: size,
      margin: Math.max(0, Math.round(margin / 8)),
      color: { dark: fgColor, light: bgColor },
    });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = Math.floor((size - logoSide) / 2);
    const centerY = Math.floor((size - logoSide) / 2);

    const pad = knockoutPad;
    const x = Math.max(0, centerX - pad);
    const y = Math.max(0, centerY - pad);
    const w = Math.min(size - x, logoSide + pad * 2);
    const h = Math.min(size - y, logoSide + pad * 2);

    ctx.save();
    roundRectPath(ctx, x, y, w, h, rounded ? Math.floor(Math.min(w, h) * 0.08) : 0);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    if (showGuide) {
      ctx.save();
      roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, rounded ? Math.floor(Math.min(w, h) * 0.08) : 0);
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    if (logoDataUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(logoSide / img.width, logoSide / img.height);
          const drawW = Math.round(img.width * scale);
          const drawH = Math.round(img.height * scale);
          const dx = Math.round((size - drawW) / 2);
          const dy = Math.round((size - drawH) / 2);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, dx, dy, drawW, drawH);
          resolve();
        };
        img.src = logoDataUrl;
      });
    } else {
      ctx.save();
      ctx.fillStyle = "#111827";
      ctx.font = `bold ${Math.round(logoSide * 0.28)}px ui-sans-serif, system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("LOGO", size / 2, size / 2);
      ctx.restore();
    }
  }

  useEffect(() => {
    void draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, size, margin, ecl, fgColor, bgColor, logoDataUrl, logoPct, knockoutPct, rounded, showGuide]);

  function handleLogoFile(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setLogoDataUrl(String(e.target?.result ?? ""));
    reader.readAsDataURL(file);
  }

  function downloadPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-logo-${Date.now()}.png`;
    a.click();
  }

  function copyPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        // Safe feature-detect without `any`
        const CI = (globalThis as unknown as {
          ClipboardItem?: new (items: Record<string, Blob>) => ClipboardItem;
        }).ClipboardItem;

        if (navigator.clipboard && CI) {
          await navigator.clipboard.write([new CI({ "image/png": blob })]);
          alert("PNG copied to clipboard ✅");
        } else {
          throw new Error("Clipboard images not supported");
        }
      } catch {
        alert("Copy failed. Try download instead.");
      }
    });
  }

  function resetAll() {
    setText("https://example.com");
    setSize(512);
    setMargin(16);
    setEcl("H");
    setFgColor("#000000");
    setBgColor("#ffffff");
    setLogoPct(20);
    setKnockoutPct(4);
    setRounded(true);
    setShowGuide(true);
    setLogoDataUrl(null);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">MyQR</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Instantly create a crisp QR code with your custom image.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="text">Text / URL</Label>
                <Input id="text" placeholder="Paste any text or link" value={text} onChange={(e) => setText(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Size (px)</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[size]} min={256} max={1024} step={32} onValueChange={([v]) => setSize(v)} />
                    <span className="w-12 text-right text-sm">{size}</span>
                  </div>
                </div>
                <div>
                  <Label>Quiet Zone (px)</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[margin]} min={0} max={64} step={2} onValueChange={([v]) => setMargin(v)} />
                    <span className="w-12 text-right text-sm">{margin}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Error Correction</Label>
                  <Select value={ecl} onValueChange={(v) => setEcl(v as Ecl)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">L (7%)</SelectItem>
                      <SelectItem value="M">M (15%)</SelectItem>
                      <SelectItem value="Q">Q (25%)</SelectItem>
                      <SelectItem value="H">H (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dots</Label>
                    <Input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
                  </div>
                  <div>
                    <Label>Background</Label>
                    <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo size (% of QR)</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[logoPct]} min={10} max={35} step={1} onValueChange={([v]) => setLogoPct(v)} />
                    <span className="w-10 text-right text-sm">{logoPct}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>White padding (% of QR)</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[knockoutPct]} min={2} max={10} step={1} onValueChange={([v]) => setKnockoutPct(v)} />
                    <span className="w-10 text-right text-sm">{knockoutPct}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={rounded} onCheckedChange={setRounded} id="rounded" />
                  <Label htmlFor="rounded">Rounded logo box</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={showGuide} onCheckedChange={setShowGuide} id="guide" />
                  <Label htmlFor="guide">Show thin guide</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo image</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 rounded-2xl border p-2 px-4 cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    <ImagePlus className="h-4 w-4" />
                    <span>Upload logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoFile(e.target.files?.[0])} />
                  </label>
                  {logoDataUrl && (
                    <Button variant="secondary" className="gap-2" onClick={() => setLogoDataUrl(null)}>
                      <Trash2 className="h-4 w-4" /> Clear logo
                    </Button>
                  )}
                </div>
                {logoDataUrl && <div className="mt-2 text-xs text-muted-foreground">Logo loaded ✓</div>}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button className="gap-2" onClick={downloadPNG}><Download className="h-4 w-4" /> Download PNG</Button>
                <Button variant="secondary" className="gap-2" onClick={copyPNG}><Copy className="h-4 w-4" /> Copy PNG</Button>
                <Button variant="ghost" className="gap-2" onClick={resetAll}><RefreshCw className="h-4 w-4" /> Reset</Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Tip: Keep the logo under <strong>25%</strong> of the QR side and use <strong>H</strong> error correction for most reliable scans.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="sticky top-6 shadow-xl">
            <CardHeader><CardTitle className="text-xl">Live Preview</CardTitle></CardHeader>
          <CardContent>
              <div className="w-full flex items-center justify-center p-4">
                <canvas ref={canvasRef} width={size} height={size} className="rounded-2xl shadow border" aria-label="QR preview" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

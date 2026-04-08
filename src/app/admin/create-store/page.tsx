"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { nanoid } from "nanoid";
import { createDemoStoreWithTimelogs, createStoreAndEmployees } from "@/lib/db";
import { Loader2, Download, Store as StoreIcon, PlusCircle, CheckCircle2, FlaskConical } from "lucide-react";

export default function AdminCreateStore() {
  const [storeName, setStoreName] = useState("");
  const [pin, setPin] = useState("");
  const [employeesInput, setEmployeesInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  
  const qrRef = useRef<SVGSVGElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !employeesInput.trim() || !pin.trim()) return;

    setLoading(true);
    try {
      const token = nanoid(10); // 10 chars is secure enough and short
      const names = employeesInput.split("\n").filter(n => n.trim().length > 0);
      
      await createStoreAndEmployees(storeName, token, pin, names);
      
      setGeneratedToken(token);
      setSuccess(true);
    } catch {
      alert("Failed to create store. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoStore = async () => {
    setLoading(true);
    try {
      const token = nanoid(10);
      const result = await createDemoStoreWithTimelogs(token);

      setStoreName(result.storeName);
      setPin("1234");
      setEmployeesInput("Kim\nAlex\nMaria\nNoah");
      setGeneratedToken(token);
      setSuccess(true);
    } catch {
      alert("Failed to create demo store. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current;
    
    let svgData = new XMLSerializer().serializeToString(svg);
    if (!svgData.includes("xmlns=")) {
      svgData = svgData.replace("<svg", "<svg xmlns=\"http://www.w3.org/2000/svg\"");
    }
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 40; // Add padding for text
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = "black";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(storeName, canvas.width / 2, img.height + 25);
      }
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${storeName.replace(/\s+/g, "_")}_QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-6 flex flex-col items-center">
      <div className="max-w-xl w-full">
        <header className="mb-8 text-center mt-8">
          <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <StoreIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create New Store</h1>
          <p className="text-white/70 mt-2">Admin Onboarding Portal</p>
        </header>

        {success && generatedToken ? (
          <div className="bg-surface p-8 rounded-[32px] shadow-xl border border-surfacestroke text-center animate-in slide-in-from-bottom-4">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="w-16 h-16 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Store Created!</h2>
            <p className="text-foreground/60 mb-8">
              Store <strong>{storeName}</strong> has been created with its employees.
            </p>

            <div className="bg-background p-6 rounded-2xl inline-block mb-6 border border-surfacestroke">
              <QRCodeSVG 
                value={`${window.location.origin}/scan/${generatedToken}`}
                size={200}
                level="H"
                includeMargin
                ref={qrRef}
              />
              <p className="text-sm text-foreground/50 font-mono mt-4 break-all max-w-[200px] mx-auto">
                {generatedToken}
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <button
                onClick={downloadQR}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-4 rounded-full font-bold hover:bg-primary-dark transition-colors"
              >
                <Download className="w-5 h-5" />
                Download printable QR
              </button>
              
              <button
                onClick={() => {
                  setSuccess(false);
                  setStoreName("");
                  setEmployeesInput("");
                  setGeneratedToken(null);
                }}
                className="w-full text-foreground/50 font-medium py-3 hover:text-foreground transition-colors"
              >
                Create another store
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-[32px] shadow-xl border border-surfacestroke">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">
                  Store Name
                </label>
                <input
                  required
                  type="text"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="e.g. Downtown Coffee"
                  className="w-full p-3 bg-background text-foreground border border-surfacestroke rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">
                  Manager PIN
                </label>
                <input
                  required
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full p-3 bg-background text-foreground border border-surfacestroke rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">
                  Employee Names
                </label>
                <p className="text-xs text-foreground/50 mb-2">Enter one name per line.</p>
                <textarea
                  required
                  value={employeesInput}
                  onChange={e => setEmployeesInput(e.target.value)}
                  placeholder="Alice&#10;Bob&#10;Charlie"
                  rows={6}
                  className="w-full p-3 bg-background text-foreground border border-surfacestroke rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 px-4 rounded-full font-bold hover:bg-primary-dark transition-transform active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Create Store & Generate QR
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCreateDemoStore}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-4 px-4 rounded-full font-bold hover:opacity-90 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <FlaskConical className="w-5 h-5" />
                    Create demo store with fake reports data
                  </>
                )}
              </button>

              <p className="text-xs text-foreground/50 text-center">
                Demo data includes multiple shifts, a missing clock-out, a cross-day shift, and a micro-shift for report testing.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

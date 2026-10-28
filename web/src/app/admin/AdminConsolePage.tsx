"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import {
  Archive,
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FlaskConical,
  Loader2,
  PlusCircle,
  QrCode,
  RefreshCcw,
  Search,
  Store as StoreIcon,
  Users,
} from "lucide-react";

import OwnerGuard from "@/components/OwnerGuard";
import {
  createDemoStore,
  createStore,
  createStoreEmployee,
  getOwnerStoreRoster,
  getOwnerStores,
  updateStoreEmployee,
} from "@/lib/client-api";
import { Employee, OwnerStoreSummary } from "@/types";

type PreviewTone = "created" | "demo";

type PreviewStatus = {
  tone: PreviewTone;
  title: string;
};

type PendingDuplicate = {
  storeName: string;
  pin: string;
  employeeNames: string[];
  matches: OwnerStoreSummary[];
};

type StoreRoster = {
  store: OwnerStoreSummary;
  employees: Employee[];
};

function normalizeStoreName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function sortStoresNewestFirst(stores: OwnerStoreSummary[]) {
  return [...stores].sort((left, right) => right.created_at.getTime() - left.created_at.getTime());
}

function buildScanUrl(qrToken: string) {
  if (typeof window === "undefined") {
    return `/scan/${qrToken}`;
  }

  return `${window.location.origin}/scan/${qrToken}`;
}

function getQrFileName(storeName: string) {
  return `${storeName.replace(/\s+/g, "_")}_QR.png`;
}

function isDemoStore(store: OwnerStoreSummary) {
  return store.name.toLowerCase().includes("demo");
}

function formatTokenPreview(token: string) {
  if (token.length <= 10) {
    return token;
  }

  return `${token.slice(0, 5)}...${token.slice(-4)}`;
}

export default function AdminConsolePage() {
  const [storeName, setStoreName] = useState("");
  const [pin, setPin] = useState("");
  const [employeesInput, setEmployeesInput] = useState("");
  const [registryQuery, setRegistryQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeCreationError, setStoreCreationError] = useState("");
  const [demoStoreError, setDemoStoreError] = useState("");
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState("");
  const [ownerStores, setOwnerStores] = useState<OwnerStoreSummary[]>([]);
  const [previewStore, setPreviewStore] = useState<OwnerStoreSummary | null>(null);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<PendingDuplicate | null>(null);
  const [pendingDownloadStore, setPendingDownloadStore] = useState<OwnerStoreSummary | null>(null);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [storeRoster, setStoreRoster] = useState<StoreRoster | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState("");
  const [rosterActionKey, setRosterActionKey] = useState<string | null>(null);
  const [rosterActionError, setRosterActionError] = useState("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [employeeNameDrafts, setEmployeeNameDrafts] = useState<Record<string, string>>({});
  const [pendingArchiveEmployeeId, setPendingArchiveEmployeeId] = useState<string | null>(null);
  const [copiedTokenStoreId, setCopiedTokenStoreId] = useState<string | null>(null);

  const previewQrRef = useRef<SVGSVGElement>(null);
  const downloadQrRef = useRef<SVGSVGElement>(null);

  const clearForm = () => {
    setStoreName("");
    setPin("");
    setEmployeesInput("");
    setPendingDuplicate(null);
    setStoreCreationError("");
    setDemoStoreError("");
  };

  const syncStoreIntoList = (store: OwnerStoreSummary) => {
    setOwnerStores((current) =>
      sortStoresNewestFirst([store, ...current.filter((entry) => entry.id !== store.id)]),
    );
  };

  const loadOwnerStores = async () => {
    setStoresError("");
    setStoresLoading(true);

    try {
      const stores = sortStoresNewestFirst(await getOwnerStores());
      setOwnerStores(stores);
      setPreviewStore((current) =>
        current ? stores.find((store) => store.id === current.id) ?? current : current,
      );
    } catch (error) {
      setStoresError(
        error instanceof Error ? error.message : "QRShift couldn't load existing stores right now.",
      );
    } finally {
      setStoresLoading(false);
    }
  };

  useEffect(() => {
    void loadOwnerStores();
  }, []);

  useEffect(() => {
    if (!copiedTokenStoreId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedTokenStoreId(null);
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [copiedTokenStoreId]);

  useEffect(() => {
    if (!pendingDownloadStore || !downloadQrRef.current) {
      return;
    }

    const svg = downloadQrRef.current;
    let svgData = new XMLSerializer().serializeToString(svg);
    if (!svgData.includes("xmlns=")) {
      svgData = svgData.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const image = new Image();

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height + 40;

      if (context) {
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        context.fillStyle = "black";
        context.font = "bold 16px sans-serif";
        context.textAlign = "center";
        context.fillText(pendingDownloadStore.name, canvas.width / 2, image.height + 25);
      }

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = getQrFileName(pendingDownloadStore.name);
      downloadLink.href = pngFile;
      downloadLink.click();
      setPendingDownloadStore(null);
    };

    image.src = `data:image/svg+xml;base64,${window.btoa(svgData)}`;
  }, [pendingDownloadStore]);

  const downloadPreviewQr = () => {
    if (!previewStore || !previewQrRef.current) {
      return;
    }

    setPendingDownloadStore(previewStore);
  };

  const handleExistingStoreDownload = (store: OwnerStoreSummary) => {
    setPendingDownloadStore(store);
  };

  const handleCopyToken = async (storeId: string, token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedTokenStoreId(storeId);
    } catch (error) {
      setStoresError(
        error instanceof Error ? error.message : "QRShift couldn't copy that token right now.",
      );
    }
  };

  const handleCreateSuccess = (store: OwnerStoreSummary, status: PreviewStatus) => {
    syncStoreIntoList(store);
    setPreviewStore(store);
    setPreviewStatus(status);
    clearForm();
  };

  const resetRosterState = () => {
    setExpandedStoreId(null);
    setStoreRoster(null);
    setRosterError("");
    setRosterActionError("");
    setRosterActionKey(null);
    setNewEmployeeName("");
    setEmployeeNameDrafts({});
    setPendingArchiveEmployeeId(null);
  };

  const applyStoreRoster = (roster: StoreRoster) => {
    setStoreRoster(roster);
    setEmployeeNameDrafts(
      Object.fromEntries(
        roster.employees
          .filter((employee) => employee.status !== "archived")
          .map((employee) => [employee.id, employee.name]),
      ),
    );
  };

  const loadStoreRoster = async (storeId: string) => {
    setRosterLoading(true);
    setRosterError("");
    setRosterActionError("");

    try {
      const roster = await getOwnerStoreRoster(storeId);
      setExpandedStoreId(storeId);
      applyStoreRoster(roster);
      setNewEmployeeName("");
      setPendingArchiveEmployeeId(null);
    } catch (error) {
      setRosterError(
        error instanceof Error ? error.message : "QRShift couldn't load this store roster right now.",
      );
    } finally {
      setRosterLoading(false);
    }
  };

  const handleToggleRoster = (storeId: string) => {
    if (expandedStoreId === storeId) {
      resetRosterState();
      return;
    }

    void loadStoreRoster(storeId);
  };

  const handleEmployeeDraftChange = (employeeId: string, value: string) => {
    setEmployeeNameDrafts((current) => ({
      ...current,
      [employeeId]: value,
    }));
  };

  const handleAddEmployee = async (storeId: string) => {
    if (!newEmployeeName.trim()) {
      setRosterActionError("Enter an employee name.");
      return;
    }

    setRosterActionKey(`add:${storeId}`);
    setRosterActionError("");

    try {
      await createStoreEmployee(storeId, newEmployeeName.trim());
      setNewEmployeeName("");
      await loadStoreRoster(storeId);
    } catch (error) {
      setRosterActionError(
        error instanceof Error ? error.message : "QRShift couldn't add that employee. Try again.",
      );
    } finally {
      setRosterActionKey(null);
    }
  };

  const handleRenameEmployee = async (storeId: string, employeeId: string) => {
    const nextName = employeeNameDrafts[employeeId]?.trim() ?? "";
    if (!nextName) {
      setRosterActionError("Enter an employee name.");
      return;
    }

    setRosterActionKey(`rename:${employeeId}`);
    setRosterActionError("");

    try {
      await updateStoreEmployee(storeId, employeeId, { name: nextName });
      await loadStoreRoster(storeId);
    } catch (error) {
      setRosterActionError(
        error instanceof Error ? error.message : "QRShift couldn't rename that employee. Try again.",
      );
    } finally {
      setRosterActionKey(null);
    }
  };

  const handleArchiveEmployee = async (storeId: string, employeeId: string) => {
    setRosterActionKey(`archive:${employeeId}`);
    setRosterActionError("");

    try {
      await updateStoreEmployee(storeId, employeeId, { status: "archived" });
      setPendingArchiveEmployeeId(null);
      await loadStoreRoster(storeId);
    } catch (error) {
      setRosterActionError(
        error instanceof Error ? error.message : "QRShift couldn't archive that employee. Try again.",
      );
    } finally {
      setRosterActionKey(null);
    }
  };

  const submitStoreCreation = async (payload: Omit<PendingDuplicate, "matches">) => {
    setStoreCreationError("");
    setDemoStoreError("");
    setLoading(true);

    try {
      const result = await createStore(payload.storeName, payload.pin, payload.employeeNames);
      handleCreateSuccess(
        {
          id: result.storeId,
          name: result.storeName,
          qr_token: result.qrToken,
          created_at: new Date(),
        },
        {
          tone: "created",
          title: "Store created",
        },
      );
    } catch (error) {
      setStoreCreationError(
        error instanceof Error
          ? error.message
          : "Failed to create store. Check the details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!storeName.trim() || !employeesInput.trim() || !pin.trim()) {
      return;
    }

    const employeeNames = employeesInput
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
    const normalizedStoreName = normalizeStoreName(storeName);
    const matches = ownerStores.filter((store) => normalizeStoreName(store.name) === normalizedStoreName);

    if (matches.length > 0) {
      setPendingDuplicate({
        storeName: storeName.trim(),
        pin: pin.trim(),
        employeeNames,
        matches,
      });
      setStoreCreationError("");
      setDemoStoreError("");
      return;
    }

    await submitStoreCreation({
      storeName: storeName.trim(),
      pin: pin.trim(),
      employeeNames,
    });
  };

  const handleCreateDemoStore = async () => {
    setStoreCreationError("");
    setDemoStoreError("");
    setPendingDuplicate(null);
    setLoading(true);

    try {
      const result = await createDemoStore();
      handleCreateSuccess(
        {
          id: result.storeId,
          name: result.storeName,
          qr_token: result.qrToken,
          created_at: new Date(),
        },
        {
          tone: "demo",
          title: "Demo store seeded",
        },
      );
    } catch (error) {
      setDemoStoreError(
        error instanceof Error ? error.message : "Failed to create demo store. Try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = useMemo(() => {
    const query = registryQuery.trim().toLowerCase();
    if (!query) {
      return ownerStores;
    }

    return ownerStores.filter((store) => {
      return (
        store.name.toLowerCase().includes(query) ||
        store.qr_token.toLowerCase().includes(query) ||
        format(store.created_at, "MMM d, yyyy").toLowerCase().includes(query)
      );
    });
  }, [ownerStores, registryQuery]);

  const totalStores = ownerStores.length;
  const latestStore = ownerStores[0] ?? null;
  const latestStoreLabel = latestStore ? latestStore.name : "None yet";
  const latestCreatedLabel = latestStore ? format(latestStore.created_at, "MMM d, yyyy") : "No store yet";
  const previewScanUrl = previewStore ? buildScanUrl(previewStore.qr_token) : "";
  const activeRosterEmployees =
    storeRoster?.employees.filter((employee) => employee.status !== "archived") ?? [];
  const archivedRosterCount =
    storeRoster?.employees.filter((employee) => employee.status === "archived").length ?? 0;
  const statusAccentClass =
    previewStatus?.tone === "demo"
      ? "border-[color:rgba(201,133,18,0.26)] bg-[color:rgba(201,133,18,0.08)]"
      : "border-[color:rgba(30,215,181,0.26)] bg-[color:rgba(30,215,181,0.08)]";
  const statusIconClass = previewStatus?.tone === "demo" ? "text-[color:#c98512]" : "text-[color:#1ed7b5]";

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[var(--background)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 py-2">
          <header className="rounded-[20px] border border-surfacestroke bg-surface px-5 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-6">
            <div className="flex items-start gap-4">
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary sm:inline-flex">
                <StoreIcon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  Owner Console
                </p>
                <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-[-0.04em] text-foreground">
                  Store setup and QR operations
                </h1>
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[18px] border border-surfacestroke bg-surface px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Total Stores</p>
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-4 font-display text-3xl font-bold tracking-[-0.04em] text-foreground">{totalStores}</p>
            </div>

            <div className="rounded-[18px] border border-surfacestroke bg-surface px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Latest Store</p>
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-4 truncate font-display text-2xl font-bold tracking-[-0.04em] text-foreground">{latestStoreLabel}</p>
              <p className="mt-1 text-sm text-text-muted">{latestCreatedLabel}</p>
            </div>
          </section>

          <div className="grid items-start gap-6 xl:grid-cols-12">
            <section className="rounded-[20px] border border-surfacestroke bg-surface px-5 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:px-6 xl:col-span-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Create Store</p>
                  <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-foreground">New location setup</h2>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  <StoreIcon className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Store Name</span>
                  <input
                    required
                    type="text"
                    value={storeName}
                    onChange={(event) => {
                      setStoreName(event.target.value);
                      setPendingDuplicate(null);
                    }}
                    placeholder="Downtown Coffee"
                    className="h-12 w-full rounded-[14px] border border-surfacestroke bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Manager PIN</span>
                  <input
                    required
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(event) => {
                      setPin(event.target.value);
                      setPendingDuplicate(null);
                    }}
                    placeholder="1234"
                    className="h-12 w-full rounded-[14px] border border-surfacestroke bg-background px-4 font-mono text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Employee Roster</span>
                  <textarea
                    required
                    value={employeesInput}
                    onChange={(event) => {
                      setEmployeesInput(event.target.value);
                      setPendingDuplicate(null);
                    }}
                    placeholder={"Alice\nBob\nCharlie"}
                    rows={6}
                    className="w-full rounded-[14px] border border-surfacestroke bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                {pendingDuplicate ? (
                  <div className="rounded-[16px] border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-foreground">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="space-y-3">
                        <p className="font-bold text-foreground">Potential duplicate location</p>
                        <div className="space-y-2">
                          {pendingDuplicate.matches.map((store) => (
                            <div
                              key={store.id}
                              className="flex items-center justify-between gap-3 rounded-[12px] border border-primary/15 bg-white px-3 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">{store.name}</p>
                                <p className="text-xs text-text-muted">
                                  {format(store.created_at, "MMM d, yyyy")} · {formatTokenPreview(store.qr_token)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleExistingStoreDownload(store)}
                                className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[10px] border border-surfacestroke bg-background px-3 text-xs font-bold text-foreground transition hover:border-primary hover:text-primary"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Re-download
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                              if (!pendingDuplicate) {
                                return;
                              }

                              void submitStoreCreation({
                                storeName: pendingDuplicate.storeName,
                                pin: pendingDuplicate.pin,
                                employeeNames: pendingDuplicate.employeeNames,
                              });
                            }}
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                            Create duplicate anyway
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDuplicate(null)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-surfacestroke bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
                          >
                            Keep editing
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {storeCreationError ? (
                  <div className="rounded-[14px] border border-[color:rgba(214,69,69,0.28)] bg-[color:rgba(214,69,69,0.08)] px-4 py-3 text-sm text-foreground">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:#d64545]" />
                      <p>{storeCreationError}</p>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                  Create store and generate QR
                </button>
              </form>

              <div className="mt-5 border-t border-surfacestroke pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Quick Demo</p>
                    <h3 className="mt-1 text-base font-bold text-foreground">Seed a walkthrough-ready example</h3>
                    <p className="mt-2 max-w-xl text-sm text-text-muted">
                      Need a realistic store fast? Create a demo location with sample employees and timelogs using the same output flow.
                    </p>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:rgba(201,133,18,0.18)] bg-[color:rgba(201,133,18,0.08)] text-[color:#c98512]">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                </div>

                {demoStoreError ? (
                  <div className="mt-4 rounded-[14px] border border-[color:rgba(214,69,69,0.28)] bg-[color:rgba(214,69,69,0.08)] px-4 py-3 text-sm text-foreground">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:#d64545]" />
                      <p>{demoStoreError}</p>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleCreateDemoStore}
                  disabled={loading}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-surfacestroke bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FlaskConical className="h-5 w-5" />}
                  Create demo store
                </button>
              </div>
            </section>

            <section className="rounded-[20px] border border-surfacestroke bg-surface px-5 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:px-6 xl:col-span-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">New QR Output</p>
                  <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-foreground">Printable sheet preview</h2>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  <QrCode className="h-5 w-5" />
                </div>
              </div>

              {previewStatus ? (
                <div className={`mt-5 rounded-[14px] border px-4 py-4 ${statusAccentClass}`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${statusIconClass}`} />
                    <h3 className="text-base font-bold text-foreground">{previewStatus.title}</h3>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex min-h-[320px] flex-col items-center justify-center rounded-[18px] border border-dashed border-surfacestroke bg-background p-6 text-center">
                {previewStore ? (
                  <>
                    <div className="rounded-[20px] border border-primary/10 bg-white p-5 shadow-[0_10px_30px_rgba(36,92,255,0.08)]">
                      <QRCodeSVG
                        value={previewScanUrl}
                        size={224}
                        level="H"
                        includeMargin
                        ref={previewQrRef}
                      />
                    </div>
                    <p className="mt-5 text-lg font-bold text-foreground">{previewStore.name}</p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-primary/12 bg-primary/10 text-primary">
                      <QrCode className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-base font-bold text-foreground">No new QR generated yet</p>
                  </>
                )}
              </div>

              {previewStore ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-[14px] border border-surfacestroke bg-background px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Scan URL</p>
                    <p className="mt-2 break-all font-mono text-sm font-semibold text-foreground">{previewScanUrl}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={downloadPreviewQr}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110"
                    >
                      <Download className="h-5 w-5" />
                      Download printable QR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewStore(null);
                        setPreviewStatus(null);
                        setPendingDownloadStore(null);
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] border border-surfacestroke bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Clear preview
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-[20px] border border-surfacestroke bg-surface shadow-[0_14px_40px_rgba(15,23,42,0.06)] xl:col-span-12">
              <div className="flex flex-col gap-4 border-b border-surfacestroke px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Store Registry</p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
                    Re-download QR sheets
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="flex min-h-[44px] items-center gap-3 rounded-[14px] border border-surfacestroke bg-background px-4 text-sm text-text-muted sm:min-w-[260px]">
                    <Search className="h-4 w-4 text-primary" />
                    <input
                      value={registryQuery}
                      onChange={(event) => setRegistryQuery(event.target.value)}
                      placeholder="Filter by name, token, date"
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-text-muted"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void loadOwnerStores()}
                    disabled={storesLoading}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] border border-surfacestroke bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <RefreshCcw className={`h-4 w-4 ${storesLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {storesError ? (
                <div className="border-b border-surfacestroke px-5 py-4 sm:px-6">
                  <div className="rounded-[14px] border border-[color:rgba(214,69,69,0.28)] bg-[color:rgba(214,69,69,0.08)] px-4 py-3 text-sm text-foreground">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:#d64545]" />
                      <p>{storesError}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="hidden border-b border-surfacestroke px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:grid sm:grid-cols-[minmax(0,1.4fr)_150px_130px_140px] sm:gap-4 sm:px-6">
                <span>Store</span>
                <span>Created</span>
                <span>Token</span>
                <span className="text-right">Action</span>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <div className="max-h-[460px] overflow-y-auto pr-1">
                  {storesLoading && ownerStores.length === 0 ? (
                    <div className="flex min-h-[240px] items-center justify-center rounded-[18px] border border-dashed border-surfacestroke bg-background px-4">
                      <div className="flex items-center gap-3 text-sm font-medium text-text-muted">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        Loading the registry...
                      </div>
                    </div>
                  ) : filteredStores.length > 0 ? (
                    <div className="space-y-3">
                      {filteredStores.map((store) => {
                        const isTokenCopied = copiedTokenStoreId === store.id;

                        return (
                          <div
                            key={store.id}
                            className="rounded-[16px] border border-surfacestroke bg-background px-4 py-4 transition hover:border-primary/40 hover:bg-[color:rgba(36,92,255,0.03)]"
                          >
                          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,1.4fr)_150px_130px_140px] sm:items-center sm:gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-base font-bold text-foreground">{store.name}</p>
                                {isDemoStore(store) ? (
                                  <span className="rounded-full border border-[color:rgba(201,133,18,0.24)] bg-[color:rgba(201,133,18,0.10)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:#8f6610]">
                                    Demo
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="text-sm text-foreground">
                              <p className="font-semibold">{format(store.created_at, "MMM d, yyyy")}</p>
                              <p className="mt-1 text-xs text-text-muted">{format(store.created_at, "h:mm a")}</p>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className="min-w-0 truncate font-mono text-sm font-semibold text-foreground"
                                  title={store.qr_token}
                                >
                                  {formatTokenPreview(store.qr_token)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => void handleCopyToken(store.id, store.qr_token)}
                                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-surfacestroke bg-surface text-text-muted transition hover:border-primary hover:text-primary"
                                  aria-label={`Copy token for ${store.name}`}
                                  title={isTokenCopied ? "Copied" : "Copy token"}
                                >
                                  {isTokenCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                              {isTokenCopied ? (
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                                  Copied
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                              <button
                                type="button"
                                onClick={() => handleToggleRoster(store.id)}
                                className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border px-4 text-sm font-bold transition ${
                                  expandedStoreId === store.id
                                    ? "border-primary bg-primary text-white"
                                    : "border-surfacestroke bg-surface text-foreground hover:border-primary hover:text-primary"
                                }`}
                              >
                                <Users className="h-4 w-4" />
                                {expandedStoreId === store.id ? "Close roster" : "Manage roster"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExistingStoreDownload(store)}
                                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110"
                              >
                                <Download className="h-4 w-4" />
                                Download QR
                              </button>
                            </div>
                          </div>

                          {expandedStoreId === store.id ? (
                            <div className="mt-4 rounded-[16px] border border-surfacestroke bg-surface px-4 py-4">
                              <div className="flex flex-col gap-2 border-b border-surfacestroke pb-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">
                                    Active roster
                                  </p>
                                  <p className="mt-1 text-base font-bold text-foreground">{store.name}</p>
                                  <p className="mt-1 font-mono text-xs font-semibold text-text-muted">
                                    {formatTokenPreview(store.qr_token)}
                                  </p>
                                </div>
                                {archivedRosterCount > 0 ? (
                                  <span className="inline-flex min-h-[32px] items-center rounded-full border border-surfacestroke bg-background px-3 py-1 text-xs font-semibold text-text-muted">
                                    {archivedRosterCount} archived hidden from scan
                                  </span>
                                ) : null}
                              </div>

                              {rosterError ? (
                                <div className="mt-4 rounded-[14px] border border-[color:rgba(214,69,69,0.28)] bg-[color:rgba(214,69,69,0.08)] px-4 py-3 text-sm text-foreground">
                                  <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:#d64545]" />
                                    <p>{rosterError}</p>
                                  </div>
                                </div>
                              ) : null}

                              {rosterActionError ? (
                                <div className="mt-4 rounded-[14px] border border-[color:rgba(214,69,69,0.28)] bg-[color:rgba(214,69,69,0.08)] px-4 py-3 text-sm text-foreground">
                                  <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:#d64545]" />
                                    <p>{rosterActionError}</p>
                                  </div>
                                </div>
                              ) : null}

                              <div className="mt-4 flex flex-col gap-3 rounded-[14px] border border-surfacestroke bg-background px-4 py-4 sm:flex-row">
                                <input
                                  type="text"
                                  value={newEmployeeName}
                                  onChange={(event) => setNewEmployeeName(event.target.value)}
                                  placeholder="Add employee name"
                                  className="h-11 w-full rounded-[12px] border border-surfacestroke bg-surface px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleAddEmployee(store.id)}
                                  disabled={rosterLoading || rosterActionKey === `add:${store.id}`}
                                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {rosterActionKey === `add:${store.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <PlusCircle className="h-4 w-4" />
                                  )}
                                  Add employee
                                </button>
                              </div>

                              <div className="mt-4">
                                {rosterLoading ? (
                                  <div className="flex min-h-[120px] items-center justify-center rounded-[14px] border border-dashed border-surfacestroke bg-background px-4">
                                    <div className="flex items-center gap-3 text-sm font-medium text-text-muted">
                                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                      Loading roster...
                                    </div>
                                  </div>
                                ) : activeRosterEmployees.length > 0 ? (
                                  <div className="space-y-3">
                                    {activeRosterEmployees.map((employee) => {
                                      const isArchiveConfirming = pendingArchiveEmployeeId === employee.id;
                                      const renameActionKey = `rename:${employee.id}`;
                                      const archiveActionKey = `archive:${employee.id}`;

                                      return (
                                        <div
                                          key={employee.id}
                                          className="rounded-[14px] border border-surfacestroke bg-background px-4 py-4"
                                        >
                                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                            <div className="min-w-0 flex-1">
                                              <input
                                                type="text"
                                                value={employeeNameDrafts[employee.id] ?? employee.name}
                                                onChange={(event) =>
                                                  handleEmployeeDraftChange(employee.id, event.target.value)
                                                }
                                                className="h-11 w-full rounded-[12px] border border-surfacestroke bg-surface px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                              />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              <button
                                                type="button"
                                                onClick={() => void handleRenameEmployee(store.id, employee.id)}
                                                disabled={rosterActionKey === archiveActionKey}
                                                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border border-surfacestroke bg-surface px-3 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                                              >
                                                {rosterActionKey === renameActionKey ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                  <Check className="h-4 w-4" />
                                                )}
                                                Save
                                              </button>

                                              {isArchiveConfirming ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    onClick={() => void handleArchiveEmployee(store.id, employee.id)}
                                                    disabled={rosterActionKey === renameActionKey}
                                                    className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] bg-[color:#d64545] px-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                                                  >
                                                    {rosterActionKey === archiveActionKey ? (
                                                      <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                      <Archive className="h-4 w-4" />
                                                    )}
                                                    Confirm archive
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setPendingArchiveEmployeeId(null)}
                                                    className="inline-flex min-h-[40px] items-center justify-center rounded-[12px] border border-surfacestroke bg-surface px-3 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
                                                  >
                                                    Cancel
                                                  </button>
                                                </>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => setPendingArchiveEmployeeId(employee.id)}
                                                  disabled={rosterActionKey === renameActionKey}
                                                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border border-[color:rgba(214,69,69,0.24)] bg-[color:rgba(214,69,69,0.06)] px-3 text-sm font-bold text-[color:#b93a3a] transition hover:bg-[color:rgba(214,69,69,0.1)] disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                  <Archive className="h-4 w-4" />
                                                  Archive
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="rounded-[14px] border border-dashed border-surfacestroke bg-background px-4 py-8 text-center">
                                    <p className="text-sm font-semibold text-foreground">No active employees</p>
                                    <p className="mt-2 text-sm text-text-muted">
                                      Add a new employee above to keep this location ready for scanning.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[18px] border border-dashed border-surfacestroke bg-background px-4 text-center">
                      <Search className="h-8 w-8 text-primary/70" />
                      <p className="mt-4 text-base font-bold text-foreground">
                        {registryQuery ? "No matching stores found" : "No stores created yet"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed left-0 top-0 -z-10 opacity-0" aria-hidden="true">
        {pendingDownloadStore ? (
          <QRCodeSVG
            value={buildScanUrl(pendingDownloadStore.qr_token)}
            size={240}
            level="H"
            includeMargin
            ref={downloadQrRef}
          />
        ) : null}
      </div>
    </OwnerGuard>
  );
}

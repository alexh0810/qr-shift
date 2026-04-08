"use client";

import { useEffect, useState } from "react";
import { getStoreByQrToken, getEmployeesByStoreId } from "@/lib/db";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Store, Employee, Timelog } from "@/types";
import { Loader2, Users, CheckCircle2, Circle, LogOut } from "lucide-react";
import Link from "next/link";
import PinGuard from "@/components/PinGuard";
import InstallPrompt from "@/components/InstallPrompt";
import { formatDistanceToNow, format } from "date-fns";

export default function DashboardPage({ params }: { params: { qr_token: string } }) {
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map employee_id -> latest Timelog
  const [employeeStatus, setEmployeeStatus] = useState<Record<string, Timelog>>({});

  useEffect(() => {
    let unsubscribeTimelogs: () => void;

    async function loadData() {
      try {
        const foundStore = await getStoreByQrToken(params.qr_token);
        if (!foundStore) {
          setError("Invalid QR Token. Store not found.");
          setLoading(false);
          return;
        }
        setStore(foundStore);
        
        const storeEmployees = await getEmployeesByStoreId(foundStore.id);
        setEmployees(storeEmployees);

        // Set up real-time listener for this store's timelogs
        const timelogsRef = collection(db, "timelogs");
        const q = query(timelogsRef, where("store_id", "==", foundStore.id));
        
        unsubscribeTimelogs = onSnapshot(q, (snapshot) => {
          const newStatus: Record<string, Timelog> = {};
          
          // We get all timelogs for the store. 
          // Sort them by timestamp asc so latest overwrites earlier
          const logs = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                employee_id: data.employee_id,
                store_id: data.store_id,
                type: data.type as "IN" | "OUT",
                timestamp: data.timestamp?.toDate() || new Date(),
              } as Timelog;
            })
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          // Reduce to only the latest state per employee
          for (const log of logs) {
            newStatus[log.employee_id] = log;
          }
          
          setEmployeeStatus(newStatus);
          
          // Only stop loading state after first snapshot arrives
          setLoading(false);
        }, () => {
          setError("Real-time listener failed to connect.");
        });

      } catch {
        setError("Failed to load dashboard data. Please try again.");
        setLoading(false);
      }
    }
    
    loadData();

    localStorage.setItem("last_dashboard_token", params.qr_token);

    return () => {
      if (unsubscribeTimelogs) {
        unsubscribeTimelogs();
      }
    };
  }, [params.qr_token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="bg-error/10 text-error p-4 rounded-xl shadow-sm max-w-md text-center">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const onShiftEmployees = employees.filter(emp => employeeStatus[emp.id]?.type === "IN");
  const offShiftEmployees = employees.filter(emp => employeeStatus[emp.id]?.type !== "IN");

  const renderStatusTime = (log: Timelog) => {
    return (
      <span className="text-xs text-foreground/50">
        since {format(log.timestamp, "h:mm a")} ({formatDistanceToNow(log.timestamp, { addSuffix: true })})
      </span>
    );
  }

  return (
    <PinGuard qr_token={params.qr_token}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <InstallPrompt />
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between bg-surface p-6 rounded-[32px] shadow-xl border border-surfacestroke gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">Live Board — {store.name}</h1>
                <button 
                  onClick={() => {
                    localStorage.removeItem(`store_${params.qr_token}_unlocked`);
                    window.location.reload();
                  }}
                  className="text-foreground/40 hover:text-error transition-colors ml-2"
                  title="Lock Dashboard"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              <p className="text-foreground/60 text-sm">Real-time attendance status</p>
            </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center justify-center gap-2 text-sm font-bold bg-primary/10 text-primary px-5 py-2 rounded-full border border-primary/10 shadow-sm animate-in fade-in zoom-in duration-500">
              <Users className="w-5 h-5" />
              <span>{onShiftEmployees.length} on shift</span>
            </div>
            <Link 
              href={`/reports/${params.qr_token}`}
              className="hidden sm:flex bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-primary-dark transition-colors text-center"
            >
              Reports
            </Link>
          </div>
        </header>
        
        {/* Mobile floating primary action */}
        <div className="sm:hidden mb-6">
           <Link 
             href={`/reports/${params.qr_token}`}
             className="block w-full bg-primary text-white px-4 py-3 rounded-full text-center font-bold hover:bg-primary-dark transition-colors shadow-sm"
           >
             View Reports
           </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ON SHIFT */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <h2 className="text-xl font-bold text-foreground">On Shift ({onShiftEmployees.length})</h2>
            </div>
            
            <div className="bg-surface rounded-3xl shadow-sm border border-surfacestroke overflow-hidden">
              {onShiftEmployees.length === 0 ? (
                <div className="p-8 text-center text-foreground/40 text-sm font-medium">
                  No one is currently clocked in.
                </div>
              ) : (
                <ul className="divide-y divide-surfacestroke">
                  {onShiftEmployees.map(emp => {
                    const log = employeeStatus[emp.id];
                    return (
                      <li key={emp.id} className="p-5 flex items-center justify-between gap-3 hover:bg-foreground/[0.02] transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-success/10 border border-success/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <span className="text-success font-bold text-base">
                              {emp.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <p className="font-bold text-foreground text-lg tracking-tight">{emp.name}</p>
                            {log && renderStatusTime(log)}
                          </div>
                        </div>
                        <span className="bg-success text-white text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full shadow-sm">IN</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* OFF SHIFT */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Circle className="w-5 h-5 text-foreground/40" />
              <h2 className="text-xl font-bold text-foreground">Off Shift ({offShiftEmployees.length})</h2>
            </div>
            
            <div className="bg-surface rounded-3xl shadow-sm border border-surfacestroke overflow-hidden">
              {offShiftEmployees.length === 0 ? (
                <div className="p-8 text-center text-foreground/40 text-sm font-medium">
                  Everyone is on shift!
                </div>
              ) : (
                <ul className="divide-y divide-surfacestroke">
                  {offShiftEmployees.map(emp => {
                    const log = employeeStatus[emp.id];
                    return (
                      <li key={emp.id} className="p-5 flex items-center justify-between gap-3 hover:bg-foreground/[0.02] transition-colors group opacity-60">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-foreground/10 border border-foreground/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <span className="text-foreground/40 font-bold text-base">
                              {emp.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <p className="font-bold text-foreground/80 text-lg tracking-tight">{emp.name}</p>
                            {log && <span className="text-xs text-foreground/40 font-medium">Last activity: {format(log.timestamp, "MMM d, h:mm a")}</span>}
                          </div>
                        </div>
                        <span className="bg-foreground/10 text-foreground/50 text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border border-foreground/5">OUT</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
    </PinGuard>
  );
}

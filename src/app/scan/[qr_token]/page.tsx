"use client";

import { useEffect, useState } from "react";
import { getStoreByQrToken, getEmployeesByStoreId, getLatestTimelog, addTimelog } from "@/lib/db";
import { Store, Employee, Timelog } from "@/types";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function ScanPage({ params }: { params: { qr_token: string } }) {
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [timelogLoading, setTimelogLoading] = useState(false);
  const [nextAction, setNextAction] = useState<"IN" | "OUT" | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [employeeStatuses, setEmployeeStatuses] = useState<Record<string, "IN" | "OUT"> | null>(null);
  const [selectedEmpLatestLog, setSelectedEmpLatestLog] = useState<Timelog | null>(null);

  useEffect(() => {
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

        // Fetch initial statuses for all employees
        const statusMap: Record<string, "IN" | "OUT"> = {};
        await Promise.all(
          storeEmployees.map(async (emp) => {
            const latest = await getLatestTimelog(emp.id);
            statusMap[emp.id] = (latest?.type === "IN") ? "IN" : "OUT";
          })
        );
        setEmployeeStatuses(statusMap);

      } catch {
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    localStorage.setItem("last_scan_token", params.qr_token);
  }, [params.qr_token]);

  const refreshStatuses = async () => {
    if (!store) return;
    const statusMap: Record<string, "IN" | "OUT"> = {};
    const storeEmployees = await getEmployeesByStoreId(store.id);
    await Promise.all(
      storeEmployees.map(async (emp) => {
        const latest = await getLatestTimelog(emp.id);
        statusMap[emp.id] = (latest?.type === "IN") ? "IN" : "OUT";
      })
    );
    setEmployeeStatuses(statusMap);
  };

  const handleSelectEmployee = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setTimelogLoading(true);
    setSuccessMessage(null);
    try {
      const latest = await getLatestTimelog(employee.id);
      setSelectedEmpLatestLog(latest);
      if (!latest || latest.type === "OUT") {
        setNextAction("IN");
      } else {
        setNextAction("OUT");
      }
    } catch {
      setError("Error fetching latest status.");
    } finally {
      setTimelogLoading(false);
    }
  };

  const handleClockAction = async () => {
    if (!selectedEmployee || !store || !nextAction) return;

    // TODO (Future): Implement PIN prompt verification here before proceeding.
    
    setActionLoading(true);
    try {
      await addTimelog(selectedEmployee.id, store.id, nextAction);
      setSuccessMessage(`Clocked ${nextAction === "IN" ? "in" : "out"} successfully!`);
      
      // Update local state immediately
      if (employeeStatuses) {
        setEmployeeStatuses({
          ...employeeStatuses,
          [selectedEmployee.id]: nextAction
        });
      }

      // Auto-refresh back to list after 2.5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setSelectedEmployee(null);
        setNextAction(null);
        setSelectedEmpLatestLog(null);
        refreshStatuses(); // Fallback to full refresh
      }, 2500);
    } catch {
      setError("Failed to clock in/out.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="bg-error/10 text-error p-4 rounded-xl shadow max-w-md text-center">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-md mx-auto">
        <header className="mb-8 relative pt-6 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold font-heading text-foreground">{store?.name}</h1>
            <p className="text-foreground/60 text-sm mt-1">Select your name to clock in/out</p>
          </div>
        </header>

        {successMessage ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-error text-white rounded-full flex items-center justify-center mb-8 shadow-lg shadow-error/20">
              <CheckCircle className="w-14 h-14" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">{successMessage}</h2>
            <p className="text-foreground/40 text-lg font-medium">
              {nextAction === "IN" ? "Have a great shift!" : "See you later"}, {selectedEmployee?.name.split(" ")[0]}
            </p>
          </div>
        ) : selectedEmployee ? (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500 pt-8 pb-12">
            <div className="w-32 h-32 bg-foreground/[0.03] border border-surfacestroke flex items-center justify-center rounded-full text-foreground/40 font-bold text-4xl shadow-inner mb-8">
              {selectedEmployee.name.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="text-4xl font-bold text-foreground mb-2">Hi {selectedEmployee.name.split(" ")[0]}!</h2>
            <p className="text-foreground/40 font-medium mb-6">You are currently</p>
            
            <div className="bg-primary/5 px-6 py-3 rounded-full flex items-center gap-3 mb-12">
              <div className={`w-3 h-3 rounded-full ${nextAction === "OUT" ? "bg-primary animate-pulse" : "bg-foreground/20"}`} />
              <span className="text-primary font-bold text-lg">
                {nextAction === "OUT" 
                  ? `Working since ${selectedEmpLatestLog ? format(selectedEmpLatestLog.timestamp, "hh:mm a") : "earlier"}` 
                  : "Not working"}
              </span>
            </div>

            {timelogLoading ? (
              <Loader2 className="w-10 h-10 animate-spin text-foreground/10" />
            ) : (
              <div className="w-full space-y-8 flex flex-col items-center">
                <button
                  onClick={handleClockAction}
                  disabled={actionLoading}
                  className={`w-full py-6 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl transition-all uppercase tracking-widest ${
                    actionLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
                  } ${nextAction === "IN" ? 'bg-primary hover:bg-primary-dark shadow-primary/20' : 'bg-error hover:bg-orange-600 shadow-error/20'}`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    `Clock ${nextAction}`
                  )}
                </button>
                
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="flex items-center gap-2 text-foreground/40 font-bold hover:text-foreground/60 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" /> Back to selection
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {employees.length === 0 ? (
              <p className="text-center py-8 text-foreground/40 font-heading">No employees found for this store.</p>
            ) : (
              employees.map(emp => {
                const isWorking = employeeStatuses?.[emp.id] === "IN";
                const initials = emp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                
                return (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="bg-surface p-6 rounded-[32px] shadow-sm border border-surfacestroke flex items-center justify-between text-left active:scale-[0.98] transition-all hover:bg-foreground/[0.02] hover:shadow-md h-28"
                  >
                    <div className="flex flex-col">
                      <h3 className="font-bold text-foreground text-xl tracking-tight leading-tight mb-1">{emp.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isWorking ? "bg-primary animate-pulse" : "bg-foreground/20"}`} />
                        <span className={`text-sm font-bold ${isWorking ? "text-primary" : "text-foreground/40"}`}>
                          {isWorking ? "Working" : "Not working"}
                        </span>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-foreground/[0.03] border border-surfacestroke flex items-center justify-center rounded-full text-foreground/50 font-bold text-lg shadow-inner">
                      {initials}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { Store, Employee, Timelog } from "@/types";
import { buildDemoStoreSeed } from "./demoData";

// 1. Resolve store from the unguessable QR token
export async function getStoreByQrToken(qrToken: string): Promise<Store | null> {
  const storesRef = collection(db, "stores");
  const q = query(storesRef, where("qr_token", "==", qrToken), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    qr_token: data.qr_token,
    pin: data.pin,
    created_at: data.created_at?.toDate() || new Date(),
  };
}

// 2. Load all employees belonging to a specific store
export async function getEmployeesByStoreId(storeId: string): Promise<Employee[]> {
  const employeesRef = collection(db, "employees");
  const q = query(employeesRef, where("store_id", "==", storeId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      store_id: data.store_id,
      created_at: data.created_at?.toDate() || new Date(),
    };
  });
}

// 3. Get the latest timelog (IN or OUT) for determining current shift status
export async function getLatestTimelog(employeeId: string): Promise<Timelog | null> {
  const timelogsRef = collection(db, "timelogs");
  const q = query(
    timelogsRef, 
    where("employee_id", "==", employeeId)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const logs = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      employee_id: data.employee_id,
      store_id: data.store_id,
      type: data.type as "IN" | "OUT",
      timestamp: data.timestamp?.toDate() || new Date(),
    } as Timelog;
  });

  // Sort descending to get the absolute latest
  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return logs[0];
}

export async function getStoreTimelogs(storeId: string): Promise<Timelog[]> {
  const timelogsRef = collection(db, "timelogs");
  const q = query(timelogsRef, where("store_id", "==", storeId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        employee_id: data.employee_id,
        store_id: data.store_id,
        type: data.type as "IN" | "OUT",
        timestamp: data.timestamp?.toDate() || new Date(),
      } as Timelog;
    })
    .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
}

// 4. Save a new clocking action
export async function addTimelog(employeeId: string, storeId: string, type: "IN" | "OUT"): Promise<string> {
  const timelogsRef = collection(db, "timelogs");
  const docRef = await addDoc(timelogsRef, {
    employee_id: employeeId,
    store_id: storeId,
    type,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

// 5. Admin: Create a new store and its employees in a single batch
export async function createStoreAndEmployees(
  storeName: string,
  qrToken: string,
  pin: string,
  employeeNames: string[]
): Promise<string> {
  const batch = writeBatch(db);
  
  // Create Store
  const newStoreRef = doc(collection(db, "stores"));
  batch.set(newStoreRef, {
    name: storeName,
    qr_token: qrToken,
    pin: pin,
    created_at: serverTimestamp()
  });

  // Create Employees
  const employeesRef = collection(db, "employees");
  for (const name of employeeNames) {
    if (name.trim()) {
      const newEmpRef = doc(employeesRef);
      batch.set(newEmpRef, {
        name: name.trim(),
        store_id: newStoreRef.id,
        created_at: serverTimestamp()
      });
    }
  }

  await batch.commit();
  return newStoreRef.id;
}

export async function createDemoStoreWithTimelogs(qrToken: string): Promise<{ storeId: string; storeName: string }> {
  const demoSeed = buildDemoStoreSeed();
  const batch = writeBatch(db);

  const newStoreRef = doc(collection(db, "stores"));
  batch.set(newStoreRef, {
    name: demoSeed.storeName,
    qr_token: qrToken,
    pin: demoSeed.pin,
    created_at: serverTimestamp(),
  });

  const employeesRef = collection(db, "employees");
  const employeeIdByName = new Map<string, string>();

  for (const employeeName of demoSeed.employeeNames) {
    const newEmployeeRef = doc(employeesRef);
    employeeIdByName.set(employeeName, newEmployeeRef.id);
    batch.set(newEmployeeRef, {
      name: employeeName,
      store_id: newStoreRef.id,
      created_at: serverTimestamp(),
    });
  }

  const timelogsRef = collection(db, "timelogs");
  for (const timelog of demoSeed.timelogs) {
    const employeeId = employeeIdByName.get(timelog.employeeName);
    if (!employeeId) {
      continue;
    }

    const newTimelogRef = doc(timelogsRef);
    batch.set(newTimelogRef, {
      employee_id: employeeId,
      store_id: newStoreRef.id,
      type: timelog.type,
      timestamp: timelog.timestamp,
    });
  }

  await batch.commit();

  return {
    storeId: newStoreRef.id,
    storeName: demoSeed.storeName,
  };
}

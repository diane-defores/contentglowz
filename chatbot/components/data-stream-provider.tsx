/**
 * Data Stream Context Provider
 *
 * Provides a React context for sharing streaming data from the chat API
 * across components that need to react to real-time updates.
 *
 * The data stream contains typed data parts (DataUIPart) that are
 * processed by DataStreamHandler and artifact-specific handlers.
 *
 * Usage:
 * - Wrap chat components with <DataStreamProvider>
 * - Access stream via useDataStream() hook
 * - The Chat component pushes data to the stream via setDataStream
 * - DataStreamHandler consumes and processes the data
 */
"use client";

import type { DataUIPart } from "ai";
import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { CustomUIDataTypes } from "@/lib/types";

type DataStreamContextValue = {
  /** Current buffered data stream parts */
  dataStream: DataUIPart<CustomUIDataTypes>[];
  /** Function to update the stream (typically append new parts) */
  setDataStream: React.Dispatch<
    React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
  >;
};

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

/** Provider component that manages the data stream state */
export function DataStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    []
  );

  const value = useMemo(() => ({ dataStream, setDataStream }), [dataStream]);

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

/** Hook to access the data stream from any component within the provider */
export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error("useDataStream must be used within a DataStreamProvider");
  }
  return context;
}

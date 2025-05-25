import React, { createContext, useContext, useState } from "react";
import { useDndMonitor } from "@dnd-kit/core";

const DragContext = createContext(false);

export const DragProvider = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);

  useDndMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    onDragCancel: () => setIsDragging(false),
  });

  return <DragContext.Provider value={isDragging}>{children}</DragContext.Provider>;
};

export const useGlobalIsDragging = () => useContext(DragContext);

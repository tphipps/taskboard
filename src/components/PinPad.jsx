import React from "react";
import { useEffect } from "react";

export default function PinPad({
    pinLength,
    maxLength = 4,
    onDigit,
    onClear,
    onDelete,
    error = "",
    enableKeyboard = true
  }) {
    useEffect(() => {
      if (!enableKeyboard) return;
  
      const handleKey = (e) => {
        if (/^\d$/.test(e.key)) onDigit(e.key);
        if (e.key === "Backspace") onDelete();
      };
  
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [onDigit, onDelete, enableKeyboard]);
  
    return (
      <div className="transition-all">
        <div className="flex justify-center mb-4 gap-2">
          {Array.from({ length: maxLength }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                i < pinLength ? "bg-gray-800 border-gray-800" : "border-gray-400"
              } transition-all`}
            />
          ))}
        </div>
  
        <div className="grid grid-cols-3 gap-4 mb-6 px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0].map((n, i) => (
            <button
              key={i}
              onClick={() => typeof n === "number" && onDigit(n.toString())}
              className="btn btn-lg btn-soft text-xl font-bold py-5 px-6"
              style={n === "" ? { visibility: "hidden" } : {}}
            >
              {n}
            </button>
          ))}
        </div>
  
        <div className="text-center min-h-[1.5rem]">
          {error && <p className="text-error text-sm">{error}</p>}
        </div>
  
        <div className="flex justify-between px-2 text-sm text-base-content mt-0 items-center">
          <button className="btn btn-ghost btn-xs px-1" onClick={onClear}>Clear</button>
          <button className="btn btn-ghost btn-xs px-1" onClick={onDelete}>Delete</button>
        </div>
      </div>
    );
  }
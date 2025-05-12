import { useState, useEffect } from "react";
import { X } from "lucide-react";

import PinPad from "./PinPad";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ChangePinModal({ userId, open, onClose, showAlert }) {
  const [changePinStep, setChangePinStep] = useState(1);
  const [currentPinEntry, setCurrentPinEntry] = useState("");
  const [newPinEntry, setNewPinEntry] = useState("");
  const [pinError, setPinError] = useState("");

  const handleInput = (digit) => {
    setPinError("");
  
    if (changePinStep === 1) {
      const updated = currentPinEntry + digit;
      setCurrentPinEntry(updated);
      if (updated.length === 4) {
        fetch(`${API_BASE}/verify_pin.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, pin: updated })
        })
          .then((res) => {
            if (!res.ok) throw new Error();
            setChangePinStep(2);
          })
          .catch(() => {
            setPinError("Incorrect current PIN");
            setTimeout(() => setPinError(""), 500);
            setCurrentPinEntry("");
          });
      }
    } else {
      const updated = newPinEntry + digit;
      setNewPinEntry(updated);
      if (updated.length === 4) {
        fetch(`${API_BASE}/change_pin.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            current_pin: currentPinEntry,
            new_pin: updated
          })
        })
          .then((res) => {
            if (!res.ok) throw new Error();
            showAlert("PIN changed successfully");
            handleClose();
          })
          .catch(() => {
            setPinError("Failed to change PIN");
            setTimeout(() => setPinError(""), 500);
            setNewPinEntry("");
          });
      }
    }
  };

  const handleClose = () => {
    setChangePinStep(1);
    setCurrentPinEntry("");
    setNewPinEntry("");
    setPinError("");
    onClose();
  };

  return (
    <dialog open={open} className="modal">
      <div className={`transition-all ${pinError ? "shake" : ""}`}>
      <div className="modal-box w-full max-w-sm relative">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold text-lg mb-4">
          {changePinStep === 1 ? "Verify Current PIN" : "Enter New PIN"}
        </h3>

        <PinPad
            pinLength={changePinStep === 1 ? currentPinEntry.length : newPinEntry.length}
            onDigit={(digit) => handleInput(digit)}
            onClear={() =>
                changePinStep === 1 ? setCurrentPinEntry("") : setNewPinEntry("")
            }
            onDelete={() =>
                changePinStep === 1
                ? setCurrentPinEntry((p) => p.slice(0, -1))
                : setNewPinEntry((p) => p.slice(0, -1))
            }
            error={pinError}
            />
        </div>
      </div>
    </dialog>
  );
}

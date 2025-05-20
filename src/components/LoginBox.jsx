import React, { useEffect, useState } from "react";
import PinPad from "./PinPad";

import { verifyPin } from "../lib/api"

import { fetchUsers } from "../lib/api";

export default function LoginBox({ onLogin }) {

  const [users, setUsers] = useState([]);
  const [loginError, setLoginError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className={`transition-all ${loginError ? "shake" : ""}`}>
        <div className="bg-base-100 shadow-xl rounded-lg p-6 w-full max-w-sm select-none">
          {!selectedUser && <h2 className="text-xl font-semibold mb-4">Please login</h2>}

          {!selectedUser ? (
            <div className="menu bg-base-100 rounded-box w-full mb-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="menu-item flex items-center gap-3 hover:bg-base-200 px-4 py-3 rounded"
                >
                  <img src={user.avatar_link} alt={user.first_name} className="w-24 h-24 rounded-full object-cover" />
                  <span className="text-lg font-medium">{user.first_name} {user.last_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <button onClick={() => { setSelectedUser(null); setPin(""); }} className="btn btn-ghost text-base-content mb-2 text-2xl px-3 leading-none">←</button>

              <div className="flex flex-col items-center mb-4">
                <img src={selectedUser.avatar_link} alt={selectedUser.first_name} className="w-24 h-24 rounded-full object-cover" />
                <span className="text-lg font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
              </div>

              <PinPad
                  pinLength={pin.length}
                  onDigit={(digit) => {
                      setLoginError(""); // Clear any previous error message
                      const newPin = pin + digit;
                      setPin(newPin);
                      if (newPin.length === 4) {
                        verifyPin(selectedUser.id, newPin)
                          .then(res => {
                            switch (res.status)
                            {
                              case 200:
                                return(res.json());
                              case 401:
                                throw new Error("unauthorized");
                              default:
                                throw new Error("network error");
                            }
                          })
                          .then(data => {
                            onLogin(data);
                            setSelectedUser(null);
                            setPin("");
                            setLoginError("");
                          })
                          .catch(err => {
                            if (err.message === "unauthorized") {
                              setLoginError("Invalid PIN. Please try again.");
                              setTimeout(() => setLoginError(""), 3000);
                              setPin("");
                            } else {
                              setLoginError("Something went wrong. Please try again.");
                              setTimeout(() => setLoginError(""), 3000);
                              setPin("");
                            }
                          });
                      }
                  }}
                  onClear={() => setPin("")}
                  onDelete={() => setPin(pin.slice(0, -1))}
                  error={loginError}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
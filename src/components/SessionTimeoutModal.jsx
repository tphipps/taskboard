import React, { useEffect, useState } from "react";

const SessionTimeoutModal = ({ onConfirm, onTimeout }) => {
  const [secondsLeft, setSecondsLeft] = useState(60); // 60 second countdown

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setTimeout(onTimeout, 0); // Defer to avoid setState during render
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [onTimeout]);

  return (
    <div className="fixed inset-0 bg-black bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
        <h2 className="text-xl font-semibold mb-4">Session Timeout</h2>
        <p className="mb-4">
          You've been inactive for a while. You will be logged out in {secondsLeft} seconds.
        </p>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Remain Logged In
        </button>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;

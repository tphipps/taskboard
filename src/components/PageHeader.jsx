import { useEffect, useState } from "react";
import { themeChange } from 'theme-change';
import ChangePinModal from "./ChangePinModal";

export default function PageHeader({ pageTitle, user, onLogout, onRefresh }) {
const [pinModalOpen, setPinModalOpen] = useState(false);
const [successAlertText, setSuccessAlertText] = useState("");


useEffect(() => {
    themeChange();
    const bindThemeToggles = () => {
    document.querySelectorAll(".theme-controller").forEach((toggle) => {
        if (toggle._bound) return;
        toggle._bound = true;
        toggle.onchange = (e) => {
        const newTheme = e.target.checked ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        };
    });
    };
    const observer = new MutationObserver(bindThemeToggles);
    observer.observe(document.body, { childList: true, subtree: true });
    bindThemeToggles();
    return () => observer.disconnect();
}, []);


  return (
        <div className="flex items-center justify-between mb-4 relative">

            {successAlertText && (
            <div className="alert alert-success fixed top-2 left-1/2 transform -translate-x-1/2 z-50 w-fit shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>{successAlertText}</span>
            </div>
            )} 
            
            <div className="absolute top-4 right-4">
                <label className="flex cursor-pointer gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path></svg>
                    <input type="checkbox" data-toggle-theme="light,dark" data-act-class="ACTIVECLASS" className="toggle theme-controller" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </label>
            </div>

            <div className="flex items-center justify-between mb-4">
                {/* Avatar dropdown */}
                <div className="dropdown dropdown-bottom">
                    <div
                    tabIndex={0}
                    role="button"
                    className="flex items-center gap-2 px-3 py-1 rounded-full border border-base-300 hover:shadow-md hover:bg-base-200 transition-all cursor-pointer"
                    >
                    <img
                        src={user.avatar_link}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium text-sm whitespace-nowrap">
                        {user.first_name} <br /> {user.last_name}
                    </span>
                    </div>

                    <ul
                    tabIndex={0}
                    className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-44"
                    >
                    <li>
                        <button
                        onClick={() => {
                            document.activeElement?.blur();
                            setPinModalOpen(true);
                        }}
                        >
                        Change PIN
                        </button>
                    </li>
                    <li>
                        <button
                        onClick={() => {
                            document.activeElement?.blur();
                            onRefresh();
                        }}
                        >
                        Refresh
                        </button>
                    </li>
                    <li>
                        <button onClick={onLogout}>Logout</button>
                    </li>
                    </ul>
                </div>

                {/* Title placeholder (flex-1 to center below the gap) */}
                <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold">
                    {pageTitle}
                </h2>          
            </div>

            <ChangePinModal
                open={pinModalOpen}
                userId={user.id}
                onClose={() => setPinModalOpen(false)}
                showAlert={(text) => {
                setSuccessAlertText(text);
                setTimeout(() => setSuccessAlertText(""), 3000);
                }}
            />

        </div>
  );
}

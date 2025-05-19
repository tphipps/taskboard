import { useEffect, useState } from "react";
import { themeChange } from 'theme-change';
import ChangePinModal from "./ChangePinModal";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Check} from "lucide-react";

import themeDarkIcon from "../assets/icons/theme-dark.svg";
import themeLightIcon from "../assets/icons/theme-light.svg";

export default function PageHeader({ pageTitle, onRefresh }) {
const [pinModalOpen, setPinModalOpen] = useState(false);
const [successAlertText, setSuccessAlertText] = useState("");

const { authenticatedUser, setAuthenticatedUser } = useAuth();

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

const LogoutButton = () => {
  const { setAuthenticatedUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthenticatedUser(null);
    navigate("/login");
  };

    return <button onClick={handleLogout}>Logout</button>;
};

  return (
        <div className="flex items-center justify-between mb-4 relative">

            {successAlertText && (
            <div className="alert alert-success fixed top-2 left-1/2 transform -translate-x-1/2 z-50 w-fit shadow-lg">
                <Check />
                <span>{successAlertText}</span>
            </div>
            )} 
            
            <div className="absolute top-4 right-4">
                <label className="flex cursor-pointer gap-2">
                    <img src={themeLightIcon} />
                    <input type="checkbox" data-toggle-theme="light,dark" data-act-class="ACTIVECLASS" className="toggle theme-controller" />
                    <img src={themeDarkIcon} />
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
                        src={authenticatedUser.avatar_link}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium text-sm whitespace-nowrap">
                        {authenticatedUser.first_name} <br /> {authenticatedUser.last_name}
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
                        <LogoutButton />
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
                userId={authenticatedUser.id}
                onClose={() => setPinModalOpen(false)}
                showAlert={(text) => {
                setSuccessAlertText(text);
                setTimeout(() => setSuccessAlertText(""), 3000);
                }}
            />

        </div>
  );
}

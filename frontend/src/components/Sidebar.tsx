import { NavLink, useLocation } from "react-router-dom";
import { HomeIcon, CogIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Title } from "@tremor/react";
import ThemeSwitcher from "./ThemeSwitcher";
import { Divider } from "./common/Divider";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Settings", href: "/settings", icon: CogIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center flex-shrink-0 px-4">
        <Title>EV Data Corp.</Title>
      </div>
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={`flex items-center gap-x-2.5 rounded-md p-2 text-sm font-medium transition-opacity ${
              location.pathname === item.href
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 hover:dark:bg-gray-900"
            }`}
            onClick={onClose}
          >
            <item.icon
              className={classNames(
                location.pathname === item.href
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300",
                "mr-3 flex-shrink-0 h-6 w-6"
              )}
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <Divider className="my-4" />
      <div className="mt-auto px-4 bg-blue w-full self-end">
        <ThemeSwitcher />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          aria-hidden="true"
          onClick={onClose}
        ></div>
        <div className="relative flex-1 flex flex-col max-w-64 w-full bg-white dark:bg-gray-950">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">{sidebarContent}</div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-60">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex-1 flex flex-col p-3 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

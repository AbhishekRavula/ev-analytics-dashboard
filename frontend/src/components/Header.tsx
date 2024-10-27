import { Bars3Icon } from "@heroicons/react/24/outline";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <div
      className="p-3 border-b border-gray-200 dark:border-gray-800 md:hidden cursor-pointer"
      onClick={onToggleSidebar}
    >
      <Bars3Icon
        className="h-6 w-6 text-black dark:text-white"
        aria-hidden="true"
      />
    </div>
  );
}

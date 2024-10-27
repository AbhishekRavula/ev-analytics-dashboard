import React, { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { Button } from "./common/Button";

const ThemeSwitcher: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("darkMode", (!isDarkMode).toString());
    document.documentElement.classList.toggle("dark");
  };

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label="Change Theme"
      variant="light"
      className="w-full"
    >
      {isDarkMode ? (
        <SunIcon className="h-5 w-5 mr-2" />
      ) : (
        <MoonIcon className="h-5 w-5 mr-2" />
      )}
      {isDarkMode ? "Light Mode" : "Dark Mode"}
    </Button>
  );
};

export default ThemeSwitcher;

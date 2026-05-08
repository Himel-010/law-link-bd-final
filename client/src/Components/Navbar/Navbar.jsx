"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Scale,
  Globe,
  ChevronDown,
  User,
  LogIn,
  LogOut,
  LayoutDashboard,
  CircleUserRound,
} from "lucide-react";
import { LuCrown } from "react-icons/lu";
import { useSelector, useDispatch } from "react-redux";
import { toggleLanguage } from "../../Redux/LanguageSlice/LanguageSlice";
import { signOutSuccess, restoreUser } from "../../Redux/UserSlice/UserSlice";
import navbarData from "../../json/navbar.json";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const profileRef = useRef(null);
  const languageRef = useRef(null);

  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const currentUser = useSelector((state) => state.user.currentUser);

  useEffect(() => {
    const localUser = localStorage.getItem("currentUser");
    const sessionUser = sessionStorage.getItem("currentUser");

    if (!currentUser && (localUser || sessionUser)) {
      try {
        dispatch(restoreUser(JSON.parse(localUser || sessionUser)));
      } catch (error) {
        console.error("Failed to restore user:", error);
      }
    }
  }, [currentUser, dispatch]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems = [
    { id: "home", path: "/" },
    { id: "lawyers", path: "/lawyers" },
    { id: "post", path: "/posts" },
    { id: "resources", path: "/resources" },
    { id: "contact", path: "/contact-us" },
    {
      id: "plans",
      path: "/plans",
      icon: LuCrown,
      alwaysActive: true,
    },
  ];

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLanguageChange = (code) => {
    dispatch(toggleLanguage(code));
    setIsLanguageOpen(false);
    setIsMenuOpen(false);
  };

  const getUserInitials = (name = "") => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const shouldShowDashboard = (role) => {
    return role === "admin";
  };

  const getDashboardRoute = (role) => {
    if (role === "admin") return "/admin";
    return "/";
  };

  const getProfileRoute = (role) => {
    if (role === "lawyer") return "/lawyers";
    return "/profile";
  };

  const getProfileLabel = (role) => {
    if (role === "lawyer") return "Lawyer Profile";
    return "My Profile";
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("token");

    dispatch(signOutSuccess());
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    navigate("/sign-in");
  };

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-gray-200 bg-white/90 shadow-sm backdrop-blur-md"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-700">
              <Scale className="h-6 w-6 text-white" />
            </div>

            <div className="leading-tight">
              <h1 className="text-xl font-bold text-cyan-700">LawLinkBD</h1>
              <p className="text-xs font-medium text-gray-500">
                Legal Aid Platform
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const NavIcon = item.icon;
              const active = isActive(item.path) || item.alwaysActive;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white"
                      : "text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                >
                  {NavIcon && (
                    <NavIcon
                      className={`text-base ${
                        active ? "text-amber-300" : "text-amber-500"
                      }`}
                    />
                  )}
                  {navbarData.navItems[item.id][currentLanguage]}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="relative" ref={languageRef}>
              <button
                onClick={() => setIsLanguageOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <Globe className="h-4 w-4" />
                {currentLanguage.toUpperCase()}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isLanguageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isLanguageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                          currentLanguage === lang.code
                            ? "bg-cyan-50 text-cyan-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{lang.flag}</span>
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/sign-in"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  <LogIn className="h-4 w-4" />
                  {navbarData.authButtons.signIn[currentLanguage]}
                </Link>

                <Link
                  to="/sign-up"
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:from-amber-600 hover:to-amber-700"
                >
                  <User className="h-4 w-4" />
                  {navbarData.authButtons.getStarted[currentLanguage]}
                </Link>
              </div>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 transition-colors hover:border-cyan-200 hover:bg-cyan-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-sm font-bold text-white">
                    {getUserInitials(currentUser?.name)}
                  </div>

                  <div className="text-left">
                    <p className="max-w-[130px] truncate text-sm font-semibold text-gray-800">
                      {currentUser?.name || "User"}
                    </p>
                    <p className="text-xs capitalize text-gray-500">
                      {currentUser?.role || "client"}
                    </p>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                    >
                      <div className="border-b border-gray-100 p-4">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {currentUser?.name || "User"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {currentUser?.email}
                        </p>
                      </div>

                      <div className="p-2">
                        {shouldShowDashboard(currentUser?.role) && (
                          <Link
                            to={getDashboardRoute(currentUser?.role)}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                        )}

                        <Link
                          to={getProfileRoute(currentUser?.role)}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                        >
                          <CircleUserRound className="h-4 w-4" />
                          {getProfileLabel(currentUser?.role)}
                        </Link>

                        <div className="my-2 border-t border-gray-100" />

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700 lg:hidden"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100 lg:hidden"
            >
              <div className="space-y-2 py-4">
                {currentUser && (
                  <div className="mb-3 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                    <p className="font-semibold text-gray-900">
                      {currentUser?.name || "User"}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {currentUser?.email}
                    </p>
                    <p className="mt-1 text-xs font-semibold capitalize text-cyan-700">
                      {currentUser?.role || "client"}
                    </p>
                  </div>
                )}

                {navItems.map((item) => {
                  const NavIcon = item.icon;
                  const active = isActive(item.path) || item.alwaysActive;

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
                        active
                          ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white"
                          : "text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                      }`}
                    >
                      {NavIcon && (
                        <NavIcon
                          className={`text-base ${
                            active ? "text-amber-300" : "text-amber-500"
                          }`}
                        />
                      )}
                      {navbarData.navItems[item.id][currentLanguage]}
                    </Link>
                  );
                })}

                <div className="border-t border-gray-100 pt-3">
                  <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Language
                  </p>

                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold ${
                        currentLanguage === lang.code
                          ? "bg-cyan-50 text-cyan-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      {lang.name}
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  {!currentUser ? (
                    <>
                      <Link
                        to="/sign-in"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <LogIn className="h-4 w-4" />
                        {navbarData.authButtons.signIn[currentLanguage]}
                      </Link>

                      <Link
                        to="/sign-up"
                        onClick={() => setIsMenuOpen(false)}
                        className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-white"
                      >
                        <User className="h-4 w-4" />
                        {navbarData.authButtons.getStarted[currentLanguage]}
                      </Link>
                    </>
                  ) : (
                    <>
                      {shouldShowDashboard(currentUser?.role) && (
                        <Link
                          to={getDashboardRoute(currentUser?.role)}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      )}

                      <Link
                        to={getProfileRoute(currentUser?.role)}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <CircleUserRound className="h-4 w-4" />
                        {getProfileLabel(currentUser?.role)}
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
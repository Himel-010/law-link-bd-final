import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaIdCard,
  FaGavel,
  FaCheckCircle,
  FaTimesCircle,
  FaUserShield,
  FaUserTie,
  FaUser,
  FaCamera,
  FaTrashAlt,
  FaCrown,
  FaChartLine,
  FaBell,
  FaCog,
  FaCreditCard,
  FaArrowUp,
  FaShieldAlt,
  FaClock,
  FaFolderOpen,
  FaBolt,
  FaArrowRight,
} from "react-icons/fa";

const UserDashboard = () => {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const fileInputRef = useRef(null);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    nid: "",
    lawRegNumber: "",
    phoneVerified: 0,
    role: "client",
    profileImage: "",
    subscriptionStatus: "none",
  });

  const [previewImage, setPreviewImage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (storedUser) {
      const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        storedUser.name || "User"
      )}&background=f3f4f6&color=111827&size=256`;

      const finalImage = storedUser.profileImage || fallbackAvatar;

      setUserData({
        name: storedUser.name || "",
        email: storedUser.email || "",
        phone: storedUser.phone || "",
        nid: storedUser.nid || "",
        lawRegNumber: storedUser.lawRegNumber || "",
        phoneVerified: storedUser.phoneVerified ?? 0,
        role: storedUser.role || "client",
        profileImage: storedUser.profileImage || "",
        subscriptionStatus: storedUser.subscriptionStatus || "none",
      });

      setPreviewImage(finalImage);
    }
  }, [storedUser]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      setMessage("");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);

    const updatedUser = {
      ...(storedUser || {}),
      profileImage: imageUrl,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setUserData((prev) => ({
      ...prev,
      profileImage: imageUrl,
    }));

    setMessage("Profile photo updated successfully ✅");
    setError("");
  };

  const handleRemovePhoto = () => {
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userData.name || "User"
    )}&background=f3f4f6&color=111827&size=256`;

    setPreviewImage(fallbackAvatar);

    const updatedUser = {
      ...(storedUser || {}),
      profileImage: "",
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setUserData((prev) => ({
      ...prev,
      profileImage: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setMessage("Profile photo removed");
    setError("");
  };

  const getRoleIcon = (role) => {
    if (role === "admin") return <FaUserShield className="text-red-500" />;
    if (role === "lawyer") return <FaUserTie className="text-amber-500" />;
    return <FaUser className="text-sky-500" />;
  };

  const stats = [
    {
      title: "Profile Strength",
      value: "92%",
      change: "+8%",
      icon: <FaChartLine />,
      iconWrap: "bg-blue-100 text-blue-600",
    },
    {
      title: "Security Score",
      value: "Strong",
      change: "Protected",
      icon: <FaShieldAlt />,
      iconWrap: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Plan Status",
      value:
        userData.subscriptionStatus === "active" ? "Premium" : userData.subscriptionStatus,
      change: "Live",
      icon: <FaCrown />,
      iconWrap: "bg-amber-100 text-amber-600",
    },
    {
      title: "Account State",
      value: "Active",
      change: "Good",
      icon: <FaBolt />,
      iconWrap: "bg-violet-100 text-violet-600",
    },
  ];

  const activities = [
    {
      title: "Account profile viewed",
      time: "Just now",
      icon: <FaUser className="text-blue-600" />,
      bg: "bg-blue-50",
    },
    {
      title: "Security status checked",
      time: "Today",
      icon: <FaShieldAlt className="text-emerald-600" />,
      bg: "bg-emerald-50",
    },
    {
      title: "Subscription information loaded",
      time: "Today",
      icon: <FaCreditCard className="text-violet-600" />,
      bg: "bg-violet-50",
    },
    {
      title: "Recent dashboard session active",
      time: "A few minutes ago",
      icon: <FaClock className="text-amber-600" />,
      bg: "bg-amber-50",
    },
  ];

  const quickActions = [
    {
      title: "Notifications",
      subtitle: "Manage alert preferences",
      icon: <FaBell />,
      style: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      title: "Preferences",
      subtitle: "Customize your experience",
      icon: <FaCog />,
      style: "bg-violet-50 text-violet-600 border-violet-100",
    },
    {
      title: "Billing",
      subtitle: "Review subscription status",
      icon: <FaCreditCard />,
      style: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      title: "Documents",
      subtitle: "View uploaded resources",
      icon: <FaFolderOpen />,
      style: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 pt-24 pb-10 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-[30px] border border-gray-200 bg-white shadow-sm p-6 md:p-8">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="h-20 w-20 md:h-24 md:w-24 rounded-[26px] object-cover border-4 border-white shadow-md"
                  />

                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="absolute -bottom-1 -right-1 h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shadow"
                  >
                    <FaCamera size={14} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold mb-3">
                    <FaCrown />
                    Premium Dashboard
                  </span>

                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Welcome back, {userData.name || "User"}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Clean overview of your account, activity, and essential information.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium hover:bg-gray-50 transition"
                >
                  <FaCamera />
                  Change Photo
                </button>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm font-medium hover:bg-red-100 transition"
                >
                  <FaTrashAlt />
                  Remove Photo
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {(message || error) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-2xl border px-4 py-3 ${
              error
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-600"
            }`}
          >
            {error || message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {stats.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-[26px] border border-gray-200 bg-white shadow-sm p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <h3 className="text-2xl font-bold mt-2 capitalize">{item.value}</h3>
                  <p className="mt-2 text-sm font-medium text-gray-600 flex items-center gap-1">
                    <FaArrowUp className="text-xs" />
                    {item.change}
                  </p>
                </div>

                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg ${item.iconWrap}`}
                >
                  {item.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6"
            >
              <div className="flex flex-col items-center text-center">
                <img
                  src={previewImage}
                  alt="Profile"
                  className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                />

                <h2 className="text-2xl font-bold mt-4">{userData.name || "User"}</h2>
                <p className="text-gray-500 mt-1 break-all">{userData.email || "No email"}</p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 border border-gray-200 px-4 py-2 text-sm font-medium">
                  {getRoleIcon(userData.role)}
                  <span className="capitalize">{userData.role}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
                  <FaEnvelope className="text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium break-all">{userData.email || "N/A"}</p>
                  </div>
                </div>

                {userData.role !== "admin" && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
                    <FaPhoneAlt className="text-emerald-600" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{userData.phone || "N/A"}</p>
                    </div>
                  </div>
                )}

                {userData.role === "lawyer" && (
                  <>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
                      <FaIdCard className="text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-500">NID</p>
                        <p className="font-medium">{userData.nid || "N/A"}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
                      <FaGavel className="text-violet-600" />
                      <div>
                        <p className="text-sm text-gray-500">Law Reg. Number</p>
                        <p className="font-medium">{userData.lawRegNumber || "N/A"}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
                      {Number(userData.phoneVerified) === 1 ? (
                        <FaCheckCircle className="text-emerald-600" />
                      ) : (
                        <FaTimesCircle className="text-red-500" />
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Phone Verification</p>
                        <p className="font-medium">
                          {Number(userData.phoneVerified) === 1 ? "Verified" : "Not Verified"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 }}
              className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6"
            >
              <h3 className="text-xl font-semibold mb-5">Quick Actions</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                {quickActions.map((item) => (
                  <button
                    key={item.title}
                    className={`w-full text-left rounded-2xl border p-4 transition hover:shadow-sm ${item.style}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg mt-1">{item.icon}</div>
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm opacity-80 mt-1">{item.subtitle}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-semibold">Account Overview</h3>
                  <p className="text-gray-500 mt-1">
                    Essential summary of your account and current status.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <FaCheckCircle />
                  Account Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">Role</p>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold capitalize">
                    {getRoleIcon(userData.role)}
                    {userData.role}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">Phone Status</p>
                  <div className="mt-2 text-lg font-semibold">
                    {userData.role === "admin"
                      ? "Not required"
                      : Number(userData.phoneVerified) === 1
                      ? "Verified"
                      : "Pending"}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">Subscription</p>
                  <div className="mt-2 text-lg font-semibold capitalize">
                    {userData.subscriptionStatus || "none"}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6"
            >
              <h3 className="text-2xl font-semibold mb-6">Recent Activity</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map((activity, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-4"
                  >
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center ${activity.bg}`}
                    >
                      {activity.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 p-[1px] shadow-[0_18px_60px_rgba(14,165,233,0.25)]"
            >
              <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-6 py-7 md:px-8 md:py-8 text-white">
                <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-10 right-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold mb-4 backdrop-blur-sm">
                      <FaCrown />
                      Premium Experience
                    </span>

                    <h3 className="text-2xl md:text-3xl font-bold leading-tight">
                      Keep your profile polished and professional
                    </h3>

                    <p className="text-white/90 mt-3 text-sm md:text-base leading-7">
                      Present your account in a refined and trustworthy way with a clean,
                      modern dashboard experience designed to highlight your most important
                      details beautifully.
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-sky-700 shadow-lg transition hover:bg-sky-50">
                      Explore More
                      <FaArrowRight className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
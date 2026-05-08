"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaUserCircle,
  FaEnvelope,
  FaPhoneAlt,
  FaIdCard,
  FaBalanceScale,
  FaUserShield,
  FaCheckCircle,
  FaTimesCircle,
  FaCrown,
  FaCalendarAlt,
  FaRegEdit,
  FaCreditCard,
  FaHistory,
  FaClock,
  FaReceipt,
  FaArrowRight,
  FaSyncAlt,
  FaHandshake,
  FaPaperPlane,
  FaCheck,
  FaTimes,
  FaBriefcase,
  FaMapMarkerAlt,
  FaGavel,
  FaComments,
  FaPaperclip,
  FaLock,
} from "react-icons/fa";
import {
  MdVerifiedUser,
  MdSubscriptions,
  MdWorkspacePremium,
} from "react-icons/md";
import { RiProfileLine } from "react-icons/ri";

const API_BASE_URL = "http://localhost:4000/api";

const GOOGLE_DRIVE_HOSTS = ["drive.google.com"];

const SOCIAL_MEDIA_HOSTS = [
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "linkedin.com",
  "www.linkedin.com",
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "t.me",
  "telegram.me",
  "wa.me",
  "whatsapp.com",
  "www.whatsapp.com",
  "messenger.com",
  "www.messenger.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "tiktok.com",
  "www.tiktok.com",
];

const BANGLADESH_PHONE_REGEX =
  /(?:\+?88)?01[3-9]\d{8}|(?:\+?8801[3-9]\d{8})/g;

const GENERIC_PHONE_REGEX = /(?:\+?\d[\d\s\-().]{6,}\d)/g;

const SOCIAL_HANDLE_REGEX =
  /(^|\s)@([a-zA-Z0-9._]{3,30})(?=\s|$|[.,!?])/g;

const PAYMENT_KEYWORDS_REGEX =
  /\b(bkash|b-kash|bikash|nagad|nogod|rocket|upay|surecash|payment number|send money|cash out|personal number|agent number|merchant number)\b/i;

const BDT_PAYMENT_TEXT_REGEX =
  /\b(?:bdt|tk|৳)\s*\d+|\d+\s*(?:bdt|tk|taka|৳)\b/i;

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const getStoredAuth = () => {
  const localUser = localStorage.getItem("currentUser");
  const sessionUser = sessionStorage.getItem("currentUser");
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");

  let user = null;
  let token = "";

  try {
    if (localToken && localUser) {
      user = JSON.parse(localUser);
      token = localToken;
    } else if (sessionToken && sessionUser) {
      user = JSON.parse(sessionUser);
      token = sessionToken;
    }
  } catch (error) {
    console.error("Auth parse error:", error);
  }

  return { user, token };
};

const formatDate = (dateString) => {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value, currency = "BDT") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-700 border border-purple-200";
    case "lawyer":
      return "bg-cyan-100 text-cyan-700 border border-cyan-200";
    case "client":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getSubscriptionBadgeStyle = (status) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "expired":
      return "bg-red-100 text-red-700 border border-red-200";
    case "cancelled":
      return "bg-gray-100 text-gray-700 border border-gray-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getPaymentBadgeStyle = (status) => {
  switch (status) {
    case "verified":
    case "paid":
    case "free":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
    case "unpaid":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "rejected":
    case "failed":
      return "bg-red-100 text-red-700 border border-red-200";
    case "refunded":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getConnectionBadgeStyle = (status) => {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-700 border border-red-200";
    case "cancelled":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "blocked":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getBidBadgeStyle = (status) => {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-700 border border-red-200";
    case "withdrawn":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getFeatureDisplayValue = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number") {
    if (value === 999999 || value === 9999) return "Unlimited";
    return value.toLocaleString();
  }

  return value || "-";
};

const getOtherUserFromConnection = (connection, user) => {
  const userId = String(user?._id || user?.id || "");

  if (String(connection?.client?._id || connection?.client) === userId) {
    return connection?.lawyer;
  }

  return connection?.client;
};

const extractAttachmentLinks = (value = "") => {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const isPossiblePhoneNumber = (value = "") => {
  const cleaned = String(value).replace(/[\s\-()+]/g, "");
  return /^\d{7,15}$/.test(cleaned);
};

const getHostnameFromTextUrl = (value = "") => {
  try {
    const normalized = value.startsWith("www.") ? `https://${value}` : value;
    const url = new URL(normalized);
    return url.hostname.toLowerCase();
  } catch {
    return "";
  }
};

const isGoogleDriveLink = (value = "") => {
  try {
    const normalized = value.startsWith("www.") ? `https://${value}` : value;
    const url = new URL(normalized);

    return (
      url.protocol === "https:" &&
      GOOGLE_DRIVE_HOSTS.includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
};

const isSocialMediaLink = (value = "") => {
  const host = getHostnameFromTextUrl(value);

  if (!host) return false;

  return SOCIAL_MEDIA_HOSTS.some(
    (blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`)
  );
};

const validateAttachmentLinks = (value = "") => {
  const links = extractAttachmentLinks(value);

  if (links.length === 0) {
    return {
      valid: true,
      links: [],
      message: "",
    };
  }

  for (const link of links) {
    if (isPossiblePhoneNumber(link)) {
      return {
        valid: false,
        links: [],
        message: "Phone numbers cannot be shared as attachments.",
      };
    }

    if (isSocialMediaLink(link)) {
      return {
        valid: false,
        links: [],
        message:
          "Social media links are not allowed. Only Google Drive links can be shared.",
      };
    }

    if (!isGoogleDriveLink(link)) {
      return {
        valid: false,
        links: [],
        message: "Only Google Drive links are allowed as attachments.",
      };
    }
  }

  return {
    valid: true,
    links,
    message: "",
  };
};

const validateChatMessageText = (value = "") => {
  const text = String(value || "").trim();

  BANGLADESH_PHONE_REGEX.lastIndex = 0;
  SOCIAL_HANDLE_REGEX.lastIndex = 0;
  URL_REGEX.lastIndex = 0;

  if (!text) {
    return {
      valid: false,
      message: "Message is required.",
    };
  }

  if (BANGLADESH_PHONE_REGEX.test(text)) {
    BANGLADESH_PHONE_REGEX.lastIndex = 0;

    return {
      valid: false,
      message:
        "Phone numbers or payment numbers cannot be shared in chat. Please use the platform conversation only.",
    };
  }

  BANGLADESH_PHONE_REGEX.lastIndex = 0;

  const genericNumbers = text.match(GENERIC_PHONE_REGEX) || [];

  for (const item of genericNumbers) {
    const digitsOnly = item.replace(/\D/g, "");

    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return {
        valid: false,
        message:
          "Phone numbers or payment numbers cannot be shared in chat. Please use the platform conversation only.",
      };
    }
  }

  if (PAYMENT_KEYWORDS_REGEX.test(text) || BDT_PAYMENT_TEXT_REGEX.test(text)) {
    return {
      valid: false,
      message:
        "Payment numbers, BDT payment details, bKash, Nagad, Rocket, or similar payment information cannot be shared in chat.",
    };
  }

  const urls = text.match(URL_REGEX) || [];

  for (const url of urls) {
    if (isSocialMediaLink(url)) {
      return {
        valid: false,
        message:
          "Social media links are not allowed in chat. Facebook, Instagram, WhatsApp, Telegram, LinkedIn, Twitter/X, YouTube, and TikTok links are blocked.",
      };
    }

    if (!isGoogleDriveLink(url)) {
      return {
        valid: false,
        message:
          "External links are not allowed in chat. Only Google Drive links can be shared using the attachment option.",
      };
    }
  }

  if (SOCIAL_HANDLE_REGEX.test(text)) {
    SOCIAL_HANDLE_REGEX.lastIndex = 0;

    return {
      valid: false,
      message:
        "Social media handles are not allowed in chat. Please continue communication inside the platform.",
    };
  }

  SOCIAL_HANDLE_REGEX.lastIndex = 0;

  return {
    valid: true,
    message: "",
  };
};

const UserProfile = () => {
  const reduxUser = useSelector((state) => state.user.currentUser);

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [connections, setConnections] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [selectedChatConnectionId, setSelectedChatConnectionId] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatAttachments, setChatAttachments] = useState("");
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [chatError, setChatError] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedAuth = getStoredAuth();

    if (reduxUser) {
      setAuthUser(reduxUser);
      setToken(storedAuth.token);
      return;
    }

    setAuthUser(storedAuth.user);
    setToken(storedAuth.token);
  }, [reduxUser]);

  const user = authUser;

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fetchActiveSubscription = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingSubscription(true);

      const res = await fetch(`${API_BASE_URL}/subscriptions/my/current`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setActiveSubscription(null);
        return;
      }

      setActiveSubscription(data.data || null);
    } catch {
      setActiveSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  }, [token, authHeaders]);

  const fetchSubscriptionHistory = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingHistory(true);

      const res = await fetch(
        `${API_BASE_URL}/subscriptions/my/history?limit=5`,
        {
          method: "GET",
          headers: authHeaders,
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setSubscriptionHistory([]);
        return;
      }

      setSubscriptionHistory(data.data || []);
    } catch {
      setSubscriptionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, authHeaders]);

  const fetchPayments = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingPayments(true);

      const res = await fetch(`${API_BASE_URL}/payments/my-payments?limit=5`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setPayments([]);
        return;
      }

      setPayments(data.data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, [token, authHeaders]);

  const fetchConnections = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingConnections(true);

      const res = await fetch(`${API_BASE_URL}/connections/my?limit=50`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setConnections([]);
        return;
      }

      setConnections(data.data || []);
    } catch {
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [token, authHeaders]);

  const fetchMyPosts = useCallback(async () => {
    if (!token || user?.role !== "client") return;

    try {
      setLoadingPosts(true);

      const res = await fetch(`${API_BASE_URL}/posts/client/my-posts?limit=50`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setMyPosts([]);
        return;
      }

      setMyPosts(data.data || []);
    } catch {
      setMyPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [token, authHeaders, user?.role]);

  const refreshProfileData = useCallback(async () => {
    try {
      setError("");
      setSuccessMessage("");

      await Promise.all([
        fetchActiveSubscription(),
        fetchSubscriptionHistory(),
        fetchPayments(),
        fetchConnections(),
        fetchMyPosts(),
      ]);
    } catch {
      setError("Failed to refresh profile data");
    }
  }, [
    fetchActiveSubscription,
    fetchSubscriptionHistory,
    fetchPayments,
    fetchConnections,
    fetchMyPosts,
  ]);

  useEffect(() => {
    if (token) refreshProfileData();
  }, [token, refreshProfileData]);

  const subscriptionStatus = useMemo(() => {
    if (activeSubscription?.status) return activeSubscription.status;
    return user?.subscriptionStatus || "none";
  }, [activeSubscription, user]);

  const hasActiveSubscription = useMemo(() => {
    return (
      activeSubscription?.status === "active" ||
      user?.subscriptionStatus === "active"
    );
  }, [activeSubscription?.status, user?.subscriptionStatus]);

  const canUseChat = useMemo(() => {
    if (user?.role === "admin") return true;
    return hasActiveSubscription;
  }, [hasActiveSubscription, user?.role]);

  const currentPlanName = useMemo(() => {
    return (
      activeSubscription?.planName ||
      activeSubscription?.plan?.name ||
      "No active plan"
    );
  }, [activeSubscription]);

  const currentPlanPrice = useMemo(() => {
    if (!activeSubscription) return 0;
    return activeSubscription.price || activeSubscription.plan?.price || 0;
  }, [activeSubscription]);

  const currentPlanCurrency = useMemo(() => {
    return (
      activeSubscription?.currency ||
      activeSubscription?.plan?.currency ||
      "BDT"
    );
  }, [activeSubscription]);

  const activeFeatures = useMemo(() => {
    const features = { ...(activeSubscription?.features || {}) };

    if (canUseChat) {
      features.in_app_messaging = true;
    }

    return Object.entries(features).map(([key, value]) => ({
      key,
      value,
    }));
  }, [activeSubscription, canUseChat]);

  const acceptedConnections = useMemo(() => {
    return connections.filter((connection) => connection.status === "accepted");
  }, [connections]);

  const selectedChatConnection = useMemo(() => {
    return acceptedConnections.find(
      (connection) => String(connection._id) === String(selectedChatConnectionId)
    );
  }, [acceptedConnections, selectedChatConnectionId]);

  const pendingConnectionCount = useMemo(() => {
    return connections.filter((connection) => connection.status === "pending")
      .length;
  }, [connections]);

  const pendingProposalCount = useMemo(() => {
    return myPosts.reduce((total, post) => {
      return (
        total +
        (post.bids || []).filter((bid) => bid.status === "pending").length
      );
    }, 0);
  }, [myPosts]);

  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: "overview",
        label: "Overview",
        icon: <RiProfileLine />,
        count: null,
      },
      {
        id: "connections",
        label: "Requests",
        icon: <FaHandshake />,
        count: pendingConnectionCount,
      },
      {
        id: "chat",
        label: "Chat",
        icon: <FaComments />,
        count: acceptedConnections.length,
      },
    ];

    if (user?.role === "client") {
      baseTabs.push({
        id: "proposals",
        label: "Proposals",
        icon: <FaPaperPlane />,
        count: pendingProposalCount,
      });
    }

    baseTabs.push({
      id: "billing",
      label: "Billing",
      icon: <FaCreditCard />,
      count: null,
    });

    return baseTabs;
  }, [
    user?.role,
    pendingConnectionCount,
    pendingProposalCount,
    acceptedConnections.length,
  ]);

  const fetchConnectionMessages = useCallback(
    async (connectionId) => {
      if (!token || !connectionId) return;

      try {
        setLoadingMessages(true);
        setChatError("");

        const res = await fetch(
          `${API_BASE_URL}/connections/${connectionId}/messages`,
          {
            method: "GET",
            headers: authHeaders,
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load messages");
        }

        setChatMessages(data.data || []);

        await fetch(`${API_BASE_URL}/connections/${connectionId}/messages/read`, {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
        });
      } catch (err) {
        setChatMessages([]);
        setChatError(
          err.message ||
            "Unable to load chat. Please make sure your account has an active free or paid plan."
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, authHeaders]
  );

  useEffect(() => {
    if (activeTab !== "chat") return;
    if (acceptedConnections.length === 0) return;

    const exists = acceptedConnections.some(
      (connection) =>
        String(connection._id) === String(selectedChatConnectionId)
    );

    if (!selectedChatConnectionId || !exists) {
      setSelectedChatConnectionId(acceptedConnections[0]._id);
    }
  }, [activeTab, acceptedConnections, selectedChatConnectionId]);

  useEffect(() => {
    if (activeTab === "chat" && selectedChatConnectionId) {
      fetchConnectionMessages(selectedChatConnectionId);
    }
  }, [activeTab, selectedChatConnectionId, fetchConnectionMessages]);

  const handleConnectionAction = async (connectionId, action) => {
    if (!token || !connectionId || !["accept", "reject"].includes(action)) return;

    try {
      setActionLoadingId(`${action}-${connectionId}`);
      setError("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_BASE_URL}/connections/${connectionId}/${action}`,
        {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            responseMessage:
              action === "accept"
                ? "Connection request accepted."
                : "Connection request rejected.",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to ${action} connection`);
      }

      setSuccessMessage(data.message || `Connection ${action}ed successfully`);
      await fetchConnections();

      if (action === "accept") {
        setSelectedChatConnectionId(connectionId);
        setActiveTab("chat");
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} connection`);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleAcceptProposal = async (postId, bidId) => {
    if (!token || !postId || !bidId) return;

    try {
      setActionLoadingId(`accept-bid-${bidId}`);
      setError("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_BASE_URL}/posts/${postId}/accept-bid/${bidId}`,
        {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to accept proposal");
      }

      setSuccessMessage(data.message || "Proposal accepted successfully");
      await fetchMyPosts();
      await fetchConnections();
      setActiveTab("chat");
    } catch (err) {
      setError(err.message || "Failed to accept proposal");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!token || !selectedChatConnectionId) {
      setChatError("Please select a conversation first.");
      return;
    }

    const messageValidation = validateChatMessageText(chatMessage);

    if (!messageValidation.valid) {
      setChatError(messageValidation.message);
      return;
    }

    const attachmentValidation = validateAttachmentLinks(chatAttachments);

    if (!attachmentValidation.valid) {
      setChatError(attachmentValidation.message);
      return;
    }

    try {
      setSendingMessage(true);
      setChatError("");

      const res = await fetch(
        `${API_BASE_URL}/connections/${selectedChatConnectionId}/messages`,
        {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            message: chatMessage.trim(),
            attachments: attachmentValidation.links,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to send message");
      }

      setChatMessage("");
      setChatAttachments("");
      setShowAttachmentInput(false);

      const newMessages = data?.data?.connection?.messages || [];
      setChatMessages(newMessages);

      await fetchConnections();
    } catch (err) {
      setChatError(
        err.message ||
          "Unable to send message. Please make sure your account has an active free or paid plan."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-cyan-700 text-4xl text-white shadow-lg">
            <FaUserCircle />
          </div>

          <h2 className="mt-6 text-3xl font-bold text-slate-800">
            No User Found
          </h2>

          <p className="mt-3 text-base leading-relaxed text-slate-500">
            Please sign in first to view your profile dashboard.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mt-14 min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(0,0,0,0.06)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-500 opacity-95" />
          <div className="absolute right-0 top-0 h-72 w-72 translate-x-20 -translate-y-20 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-20 translate-y-20 rounded-full bg-white/10 blur-3xl" />

          <div className="relative px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex h-28 w-28 items-center justify-center rounded-full border border-white/30 bg-white/20 text-3xl font-bold text-white shadow-xl backdrop-blur-md md:h-32 md:w-32 md:text-4xl"
                >
                  {getInitials(user?.name)}
                </motion.div>

                <div className="text-white">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                      {user?.name || "Unnamed User"}
                    </h1>

                    <span className="rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-semibold capitalize backdrop-blur-md">
                      {user?.role || "client"}
                    </span>
                  </div>

                  <p className="flex items-center gap-2 text-base text-white/90 md:text-lg">
                    <FaEnvelope className="text-white/90" />
                    {user?.email || "No email available"}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${getSubscriptionBadgeStyle(
                        subscriptionStatus
                      )}`}
                    >
                      Subscription: {subscriptionStatus}
                    </span>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        canUseChat
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      Chat: {canUseChat ? "Enabled" : "Needs active plan"}
                    </span>

                    <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                      Joined: {formatDate(user?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-cyan-700 shadow-lg transition-all hover:shadow-xl"
                >
                  <FaRegEdit />
                  Edit Profile
                </motion.button>

                <motion.button
                  onClick={refreshProfileData}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-900/20 px-6 py-3 font-semibold text-white backdrop-blur-md transition-all hover:bg-slate-900/30"
                >
                  <FaSyncAlt />
                  Refresh
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="sticky top-20 z-30 mt-8 rounded-[24px] border border-slate-200 bg-white/90 p-2 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}

                {Number(tab.count) > 0 && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                      activeTab === tab.id
                        ? "bg-white text-cyan-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
            {successMessage}
          </div>
        )}

        {activeTab === "overview" && (
          <OverviewTab
            user={user}
            subscriptionStatus={subscriptionStatus}
            activeSubscription={activeSubscription}
            activeFeatures={activeFeatures}
            currentPlanName={currentPlanName}
            currentPlanPrice={currentPlanPrice}
            currentPlanCurrency={currentPlanCurrency}
            loadingSubscription={loadingSubscription}
          />
        )}

        {activeTab === "connections" && (
          <ConnectionsTab
            user={user}
            connections={connections}
            loading={loadingConnections}
            actionLoadingId={actionLoadingId}
            onAccept={(id) => handleConnectionAction(id, "accept")}
            onReject={(id) => handleConnectionAction(id, "reject")}
            onOpenChat={(id) => {
              setSelectedChatConnectionId(id);
              setActiveTab("chat");
            }}
          />
        )}

        {activeTab === "chat" && (
          <ChatTab
            user={user}
            connections={acceptedConnections}
            selectedConnectionId={selectedChatConnectionId}
            selectedConnection={selectedChatConnection}
            messages={chatMessages}
            loadingConnections={loadingConnections}
            loadingMessages={loadingMessages}
            sendingMessage={sendingMessage}
            chatMessage={chatMessage}
            chatAttachments={chatAttachments}
            showAttachmentInput={showAttachmentInput}
            chatError={chatError}
            canUseChat={canUseChat}
            onSelectConnection={setSelectedChatConnectionId}
            onMessageChange={(value) => {
              setChatMessage(value);
              setChatError("");
            }}
            onAttachmentsChange={(value) => {
              setChatAttachments(value);
              setChatError("");
            }}
            onToggleAttachmentInput={() => {
              setShowAttachmentInput((prev) => !prev);
              setChatError("");
            }}
            onClearAttachment={() => {
              setChatAttachments("");
              setShowAttachmentInput(false);
              setChatError("");
            }}
            onSendMessage={handleSendMessage}
            onRefreshMessages={() =>
              selectedChatConnectionId &&
              fetchConnectionMessages(selectedChatConnectionId)
            }
          />
        )}

        {activeTab === "proposals" && user?.role === "client" && (
          <ProposalsTab
            posts={myPosts}
            loading={loadingPosts}
            actionLoadingId={actionLoadingId}
            onAcceptProposal={handleAcceptProposal}
          />
        )}

        {activeTab === "billing" && (
          <BillingTab
            activeSubscription={activeSubscription}
            subscriptionHistory={subscriptionHistory}
            payments={payments}
            loadingHistory={loadingHistory}
            loadingPayments={loadingPayments}
            fetchPayments={fetchPayments}
          />
        )}
      </div>
    </div>
  );
};

const ChatTab = ({
  user,
  connections,
  selectedConnectionId,
  selectedConnection,
  messages,
  loadingConnections,
  loadingMessages,
  sendingMessage,
  chatMessage,
  chatAttachments,
  showAttachmentInput,
  chatError,
  canUseChat,
  onSelectConnection,
  onMessageChange,
  onAttachmentsChange,
  onToggleAttachmentInput,
  onClearAttachment,
  onSendMessage,
  onRefreshMessages,
}) => {
  const userId = String(user?._id || user?.id || "");
  const otherUser = getOtherUserFromConnection(selectedConnection, user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
    >
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
              <FaComments className="text-cyan-700" />
              Lawyer Conversation
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Free and paid active plans can chat after accepted connection.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshMessages}
            disabled={!selectedConnectionId || loadingMessages}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-extrabold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60"
          >
            <FaSyncAlt />
            Refresh Chat
          </button>
        </div>
      </div>

      {!canUseChat && (
        <div className="m-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <FaLock />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-amber-800">
                Active Subscription Required
              </h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                Free and paid active plans can use conversation. Your account
                does not have an active subscription yet, so messaging is locked.
              </p>

              <a
                href="/plans"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-amber-700"
              >
                <FaCrown />
                Choose Plan
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold text-slate-900">
              Accepted Lawyers
            </h3>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-600">
              {connections.length}
            </span>
          </div>

          {loadingConnections ? (
            <LoadingBox text="Loading chats..." />
          ) : connections.length === 0 ? (
            <EmptyBox text="No accepted connections found. Accept a request or proposal first to start chat." />
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => {
                const partner = getOtherUserFromConnection(connection, user);
                const isActive =
                  String(connection._id) === String(selectedConnectionId);
                const lastMessage =
                  connection.messages?.[connection.messages.length - 1];

                return (
                  <button
                    key={connection._id}
                    type="button"
                    onClick={() => onSelectConnection(connection._id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-cyan-300 bg-white shadow-md"
                        : "border-slate-200 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${
                          isActive
                            ? "bg-cyan-600 text-white"
                            : "bg-cyan-50 text-cyan-700"
                        }`}
                      >
                        {getInitials(partner?.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-extrabold text-slate-900">
                            {partner?.name || "Unknown User"}
                          </p>

                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-extrabold text-green-700">
                            Accepted
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {connection.post?.title || "Case conversation"}
                        </p>

                        <p className="mt-2 truncate text-xs text-slate-500">
                          {lastMessage?.message || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex min-h-[620px] flex-col bg-white">
          {selectedConnection ? (
            <>
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-extrabold text-cyan-700">
                      {getInitials(otherUser?.name)}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {otherUser?.name || "Conversation"}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {selectedConnection.post?.title || "Legal case chat"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-extrabold capitalize ${getConnectionBadgeStyle(
                      selectedConnection.status
                    )}`}
                  >
                    {selectedConnection.status}
                  </span>
                </div>
              </div>

              {chatError && (
                <div className="m-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {chatError}
                </div>
              )}

              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5">
                {loadingMessages ? (
                  <LoadingBox text="Loading messages..." />
                ) : messages.length === 0 ? (
                  <EmptyBox text="No messages yet. Start the conversation after connection acceptance." />
                ) : (
                  messages.map((item) => {
                    const senderId = String(item.sender?._id || item.sender);
                    const isMine = senderId === userId;

                    return (
                      <div
                        key={item._id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[82%] rounded-3xl px-5 py-4 shadow-sm ${
                            isMine
                              ? "rounded-br-md bg-cyan-600 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          <p
                            className={`mb-1 text-xs font-extrabold ${
                              isMine ? "text-cyan-50" : "text-slate-500"
                            }`}
                          >
                            {isMine ? "You" : item.sender?.name || "User"}
                          </p>

                          <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                            {item.message}
                          </p>

                          {item.attachments?.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {item.attachments.map((attachment, index) => (
                                <a
                                  key={`${attachment}-${index}`}
                                  href={attachment}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                    isMine
                                      ? "bg-white/15 text-white"
                                      : "bg-slate-100 text-cyan-700"
                                  }`}
                                >
                                  <FaPaperclip />
                                  Google Drive Attachment {index + 1}
                                </a>
                              ))}
                            </div>
                          )}

                          <p
                            className={`mt-2 text-[11px] font-medium ${
                              isMine ? "text-cyan-50/80" : "text-slate-400"
                            }`}
                          >
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={onSendMessage}
                className="border-t border-slate-200 bg-white p-5"
              >
                <div className="grid gap-3">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => onMessageChange(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder={
                      canUseChat
                        ? "Write your message. Do not share phone numbers, payment numbers, or social media links."
                        : "Activate a free or paid plan to use conversation."
                    }
                    disabled={!canUseChat || sendingMessage}
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  {showAttachmentInput && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            Google Drive Attachment
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Only https://drive.google.com links are allowed.
                            Phone numbers and social media links are blocked.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={onClearAttachment}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                        >
                          <FaTimes />
                          Remove
                        </button>
                      </div>

                      <input
                        type="url"
                        value={chatAttachments}
                        onChange={(e) => onAttachmentsChange(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        disabled={!canUseChat || sendingMessage}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={onToggleAttachmentInput}
                        disabled={!canUseChat || sendingMessage}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          showAttachmentInput
                            ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <FaPaperclip />
                        Attachment
                      </button>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          {chatMessage.length}/2000 characters
                        </p>

                        <p className="mt-1 text-xs font-semibold text-red-500">
                          Phone/payment numbers and social media links are blocked.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        !canUseChat || sendingMessage || !chatMessage.trim()
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaPaperPlane />
                      {sendingMessage ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyBox text="Select an accepted connection to open conversation." />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const OverviewTab = ({
  user,
  subscriptionStatus,
  activeSubscription,
  activeFeatures,
  currentPlanName,
  currentPlanPrice,
  currentPlanCurrency,
  loadingSubscription,
}) => {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
      <div className="space-y-8 xl:col-span-2">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-xl text-cyan-700">
              <RiProfileLine />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Personal Information
              </h2>

              <p className="text-sm text-slate-500">
                Your core account and identity details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <InfoCard
              icon={<FaUserCircle />}
              label="Full Name"
              value={user?.name || "Not available"}
            />

            <InfoCard
              icon={<FaEnvelope />}
              label="Email Address"
              value={user?.email || "Not available"}
            />

            <InfoCard
              icon={<FaPhoneAlt />}
              label="Phone Number"
              value={user?.phone || "Not available"}
            />

            <InfoCard
              icon={<FaUserShield />}
              label="User Role"
              value={user?.role || "client"}
              capitalize
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-700">
              <FaBalanceScale />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Professional & Legal Information
              </h2>

              <p className="text-sm text-slate-500">
                Lawyer specific or account verification related data
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <InfoCard
              icon={<FaIdCard />}
              label="National ID (NID)"
              value={user?.nid || "Not available"}
            />

            <InfoCard
              icon={<FaBalanceScale />}
              label="Law Registration Number"
              value={user?.lawRegNumber || "Not available"}
            />

            <InfoCard
              icon={<MdVerifiedUser />}
              label="Phone Verification"
              value={user?.phoneVerified ? "Verified" : "Not Verified"}
            />

            <InfoCard
              icon={<FaCalendarAlt />}
              label="Account Created"
              value={formatDate(user?.createdAt)}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Account Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Role, subscription, and verification overview
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <SummaryCard
              title="Current Role"
              value={user?.role || "client"}
              icon={<FaUserShield />}
              styleClass={getRoleBadgeStyle(user?.role)}
            />

            <SummaryCard
              title="Subscription"
              value={subscriptionStatus}
              icon={<MdSubscriptions />}
              styleClass={getSubscriptionBadgeStyle(subscriptionStatus)}
            />

            <SummaryCard
              title="Phone Status"
              value={user?.phoneVerified ? "Verified" : "Unverified"}
              icon={user?.phoneVerified ? <FaCheckCircle /> : <FaTimesCircle />}
              styleClass={
                user?.phoneVerified
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }
            />
          </div>
        </motion.div>
      </div>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-xl text-white shadow-md">
              <FaCrown />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Subscription Plan
              </h3>

              <p className="text-sm text-slate-500">
                Your current membership overview
              </p>
            </div>
          </div>

          <div
            className={`rounded-2xl p-5 ${getSubscriptionBadgeStyle(
              subscriptionStatus
            )}`}
          >
            <p className="mb-2 text-sm font-medium">Status</p>

            <h4 className="text-2xl font-extrabold capitalize">
              {subscriptionStatus}
            </h4>
          </div>

          <div className="mt-5 space-y-4">
            <MiniDetail label="Current Plan" value={currentPlanName} />

            <MiniDetail
              label="Price"
              value={
                activeSubscription
                  ? formatCurrency(currentPlanPrice, currentPlanCurrency)
                  : "No active subscription"
              }
            />

            <MiniDetail
              label="Start Date"
              value={formatDate(activeSubscription?.startDate)}
            />

            <MiniDetail
              label="End Date"
              value={formatDate(activeSubscription?.endDate)}
            />

            <MiniDetail
              label="Account Type"
              value={(user?.role || "client").toUpperCase()}
            />
          </div>

          <a
            href="/plans"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl"
          >
            Manage Subscription
            <FaArrowRight />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-xl text-cyan-700">
              <MdWorkspacePremium />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Plan Features
              </h3>

              <p className="text-sm text-slate-500">
                Features unlocked by your subscription
              </p>
            </div>
          </div>

          {loadingSubscription ? (
            <LoadingBox text="Loading features..." />
          ) : activeFeatures.length === 0 ? (
            <EmptyBox text="No active plan features found." />
          ) : (
            <div className="space-y-3">
              {activeFeatures.slice(0, 8).map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="min-w-0 truncate text-sm font-bold text-slate-700 capitalize">
                    {feature.key.replaceAll("_", " ")}
                  </p>

                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-900">
                    {getFeatureDisplayValue(feature.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
        >
          <h3 className="mb-5 text-xl font-bold text-slate-800">
            Verification Status
          </h3>

          <div className="space-y-4">
            <StatusRow icon={<FaEnvelope />} label="Email Available" status={!!user?.email} />
            <StatusRow icon={<FaPhoneAlt />} label="Phone Added" status={!!user?.phone} />
            <StatusRow icon={<MdVerifiedUser />} label="Phone Verified" status={!!user?.phoneVerified} />
            <StatusRow icon={<FaBalanceScale />} label="Lawyer Credentials" status={!!user?.lawRegNumber} />
            <StatusRow icon={<FaIdCard />} label="NID Submitted" status={!!user?.nid} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ConnectionsTab = ({
  user,
  connections,
  loading,
  actionLoadingId,
  onAccept,
  onReject,
  onOpenChat,
}) => {
  const incomingPending = connections.filter((connection) => {
    const requestedById = connection.requestedBy?._id || connection.requestedBy;
    const userId = user?._id || user?.id;

    return (
      connection.status === "pending" &&
      String(requestedById) !== String(userId)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Connection Requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Accept lawyer connection requests before conversation.
          </p>
        </div>

        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-extrabold text-cyan-700">
          Pending: {incomingPending.length}
        </span>
      </div>

      {loading ? (
        <LoadingBox text="Loading connection requests..." />
      ) : connections.length === 0 ? (
        <EmptyBox text="No connection requests found." />
      ) : (
        <div className="space-y-5">
          {connections.map((connection) => {
            const requestedById =
              connection.requestedBy?._id || connection.requestedBy;
            const userId = user?._id || user?.id;
            const canRespond =
              connection.status === "pending" &&
              String(requestedById) !== String(userId);

            return (
              <div
                key={connection._id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${getConnectionBadgeStyle(
                          connection.status
                        )}`}
                      >
                        {connection.status}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {connection.post?.category || "case"}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900">
                      {connection.post?.title || "Untitled Case"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {connection.requestMessage || "No request message added."}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                      <MiniDetail
                        label="Client"
                        value={connection.client?.name || "-"}
                      />

                      <MiniDetail
                        label="Lawyer"
                        value={connection.lawyer?.name || "-"}
                      />

                      <MiniDetail
                        label="Requested"
                        value={formatDateTime(connection.createdAt)}
                      />
                    </div>
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-3">
                    {canRespond && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAccept(connection._id)}
                          disabled={
                            actionLoadingId === `accept-${connection._id}`
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-green-700 disabled:opacity-60"
                        >
                          <FaCheck />
                          {actionLoadingId === `accept-${connection._id}`
                            ? "Accepting..."
                            : "Accept Request"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onReject(connection._id)}
                          disabled={
                            actionLoadingId === `reject-${connection._id}`
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-extrabold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          <FaTimes />
                          {actionLoadingId === `reject-${connection._id}`
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                      </>
                    )}

                    {connection.status === "accepted" && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(connection._id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700"
                      >
                        <FaComments />
                        Open Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

const ProposalsTab = ({ posts, loading, actionLoadingId, onAcceptProposal }) => {
  const postsWithBids = posts.filter((post) => post.bids?.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Lawyer Proposals
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review lawyer fee, estimated days, and proposal message.
          </p>
        </div>

        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-extrabold text-cyan-700">
          Cases: {postsWithBids.length}
        </span>
      </div>

      {loading ? (
        <LoadingBox text="Loading proposals..." />
      ) : postsWithBids.length === 0 ? (
        <EmptyBox text="No proposals found for your cases yet." />
      ) : (
        <div className="space-y-6">
          {postsWithBids.map((post) => (
            <div
              key={post._id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
            >
              <div className="border-b border-slate-200 bg-white p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700 capitalize">
                    {post.status?.replace("_", " ") || "open"}
                  </span>

                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 capitalize">
                    {post.category || "case"}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">
                  {post.title || "Untitled Case"}
                </h3>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <FaBriefcase />
                    Budget: {formatCurrency(post.budgetMin || 0)} -{" "}
                    {formatCurrency(post.budgetMax || 0)}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <FaMapMarkerAlt />
                    {[post.division, post.district].filter(Boolean).join(", ") ||
                      "Location not specified"}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <FaGavel />
                    Proposals: {post.bids?.length || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {post.bids.map((bid) => {
                  const lawyer = bid.lawyer || {};
                  const isAcceptedPost = post.status === "in_progress";
                  const canAccept =
                    post.status === "open" && bid.status === "pending";

                  return (
                    <div
                      key={bid._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${getBidBadgeStyle(
                                bid.status
                              )}`}
                            >
                              {bid.status}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                              {formatDateTime(bid.createdAt)}
                            </span>
                          </div>

                          <h4 className="text-lg font-extrabold text-slate-900">
                            {lawyer.name || "Unknown Lawyer"}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            Reg: {lawyer.lawRegNumber || "Not available"} •{" "}
                            {lawyer.email || "No email"}
                          </p>

                          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                            {bid.message || "No proposal message."}
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <MiniDetail
                              label="Proposed Fee"
                              value={formatCurrency(bid.proposedFee)}
                            />

                            <MiniDetail
                              label="Estimated Days"
                              value={`${bid.estimatedDays || 0} days`}
                            />
                          </div>
                        </div>

                        <div className="min-w-[220px]">
                          <button
                            type="button"
                            onClick={() => onAcceptProposal(post._id, bid._id)}
                            disabled={
                              !canAccept ||
                              actionLoadingId === `accept-bid-${bid._id}`
                            }
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed ${
                              canAccept
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            <FaCheck />
                            {actionLoadingId === `accept-bid-${bid._id}`
                              ? "Accepting..."
                              : bid.status === "accepted"
                              ? "Accepted"
                              : isAcceptedPost
                              ? "Case In Progress"
                              : "Accept Proposal"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const BillingTab = ({
  activeSubscription,
  subscriptionHistory,
  payments,
  loadingHistory,
  loadingPayments,
  fetchPayments,
}) => {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-xl text-violet-700">
              <FaHistory />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Subscription History
              </h2>

              <p className="text-sm text-slate-500">
                Recent subscriptions you purchased or selected
              </p>
            </div>
          </div>
        </div>

        {loadingHistory ? (
          <LoadingBox text="Loading subscription history..." />
        ) : subscriptionHistory.length === 0 ? (
          <EmptyBox text="No subscription history found." />
        ) : (
          <div className="space-y-4">
            {subscriptionHistory.map((sub) => (
              <div
                key={sub._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {sub.planName || sub.plan?.name || "Unknown Plan"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {sub.planSlug || sub.plan?.slug || "-"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${getSubscriptionBadgeStyle(
                      sub.status
                    )}`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <MiniDetail
                    label="Price"
                    value={formatCurrency(sub.price, sub.currency)}
                  />

                  <MiniDetail label="Start" value={formatDate(sub.startDate)} />

                  <MiniDetail label="End" value={formatDate(sub.endDate)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-xl text-green-700">
              <FaReceipt />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Payment History
              </h2>

              <p className="text-sm text-slate-500">
                Latest manual bKash/Nogod payment submissions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchPayments}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loadingPayments ? (
          <LoadingBox text="Loading payment history..." />
        ) : payments.length === 0 ? (
          <EmptyBox text="No payment history found." />
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {payment.planName || "Plan Payment"}
                    </h3>

                    <p className="mt-1 break-all text-sm text-slate-500">
                      TXN: {payment.transactionId || "-"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${getPaymentBadgeStyle(
                      payment.paymentStatus
                    )}`}
                  >
                    {payment.paymentStatus}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <MiniDetail
                    label="Amount"
                    value={formatCurrency(
                      payment.amount,
                      payment.currency || "BDT"
                    )}
                  />

                  <MiniDetail label="Method" value={payment.method || "-"} />

                  <MiniDetail
                    label="Submitted"
                    value={formatDateTime(
                      payment.paymentDate || payment.createdAt
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, capitalize = false }) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-lg text-cyan-700 shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <h4
            className={`mt-1 break-words text-base font-bold text-slate-800 ${
              capitalize ? "capitalize" : ""
            }`}
          >
            {value}
          </h4>
        </div>
      </div>
    </motion.div>
  );
};

const SummaryCard = ({ title, value, icon, styleClass }) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div className="text-lg text-slate-600">{icon}</div>
      </div>

      <div
        className={`inline-flex rounded-full px-4 py-2 text-sm font-bold capitalize ${styleClass}`}
      >
        {value}
      </div>
    </motion.div>
  );
};

const MiniDetail = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-1 break-words font-semibold capitalize text-slate-800">
        {value}
      </p>
    </div>
  );
};

const StatusRow = ({ icon, label, status }) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-cyan-700">
          {icon}
        </div>

        <span className="font-medium text-slate-700">{label}</span>
      </div>

      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
          status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {status ? <FaCheckCircle /> : <FaTimesCircle />}
        {status ? "Done" : "Missing"}
      </div>
    </div>
  );
};

const LoadingBox = ({ text }) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600">
      <FaClock className="animate-pulse text-cyan-600" />
      {text}
    </div>
  );
};

const EmptyBox = ({ text }) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
};

export default UserProfile;

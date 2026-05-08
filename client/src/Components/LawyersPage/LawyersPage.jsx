"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Scale,
  Mail,
  Phone,
  BadgeCheck,
  ShieldCheck,
  Crown,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Briefcase,
  MessageCircle,
  Handshake,
  Send,
  CheckCircle2,
  XCircle,
  Wallet,
  CalendarDays,
  UserRound,
  Paperclip,
  Lock,
  RotateCcw,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost:4000/api";

const POST_STATUSES = ["open", "in_progress", "closed", "cancelled"];

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

  try {
    if (localToken && localUser) {
      return {
        user: JSON.parse(localUser),
        token: localToken,
      };
    }

    if (sessionToken && sessionUser) {
      return {
        user: JSON.parse(sessionUser),
        token: sessionToken,
      };
    }
  } catch {
    return {
      user: null,
      token: "",
    };
  }

  return {
    user: null,
    token: "",
  };
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "L";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "L";

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

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

const getSubscriptionBadgeClass = (status) => {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "expired":
      return "border-red-200 bg-red-50 text-red-700";
    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "none":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getBidBadgeClass = (status) => {
  switch (status) {
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "withdrawn":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getConnectionBadgeClass = (status) => {
  switch (status) {
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "blocked":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getFeatureValue = (features = {}, key) => {
  if (!features || typeof features !== "object") return null;
  return features[key];
};

const readableFeature = (value) => {
  if (value === true) return "Enabled";
  if (value === false) return "No";
  if (value === 999999 || value === 9999) return "Unlimited";
  if (value === null || value === undefined || value === "") return "Basic";
  return value;
};

const getOtherUser = (connection, user) => {
  const userId = String(user?._id || user?.id || "");

  if (String(connection?.client?._id || connection?.client) === userId) {
    return connection?.lawyer;
  }

  return connection?.client;
};

const isMyBid = (bid, user) => {
  const userId = String(user?._id || user?.id || "");
  const lawyerId = String(bid?.lawyer?._id || bid?.lawyer || "");

  return userId && lawyerId && userId === lawyerId;
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

const getHostnameFromTextUrl = (value = "") => {
  try {
    const normalized = value.startsWith("www.") ? `https://${value}` : value;
    const url = new URL(normalized);
    return url.hostname.toLowerCase();
  } catch {
    return "";
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
      message: "Message is required",
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

const LawyerDashboard = () => {
  const reduxUser = useSelector((state) => state.user.currentUser);

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  const [activeSubscription, setActiveSubscription] = useState(null);
  const [connections, setConnections] = useState([]);
  const [allPosts, setAllPosts] = useState([]);

  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [attachmentText, setAttachmentText] = useState("");
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [chatError, setChatError] = useState("");

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

  const activeFeatures = activeSubscription?.features || {};

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

  const fetchActiveSubscription = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingProfile(true);

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
      setLoadingProfile(false);
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

  const fetchAllPostsForBids = useCallback(async () => {
    if (!token || user?.role !== "lawyer") return;

    try {
      setLoadingPosts(true);

      const responses = await Promise.all(
        POST_STATUSES.map(async (status) => {
          const res = await fetch(
            `${API_BASE_URL}/posts?status=${status}&limit=100`,
            {
              method: "GET",
              headers: authHeaders,
              credentials: "include",
            }
          );

          const data = await res.json();

          if (!res.ok || !data?.success) return [];

          return data.data || [];
        })
      );

      const merged = responses.flat();
      const unique = Array.from(
        new Map(merged.map((post) => [post._id, post])).values()
      );

      setAllPosts(unique);
    } catch {
      setAllPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [token, user?.role, authHeaders]);

  const refreshDashboard = useCallback(async () => {
    setError("");
    setSuccessMessage("");

    await Promise.all([
      fetchActiveSubscription(),
      fetchConnections(),
      fetchAllPostsForBids(),
    ]);
  }, [fetchActiveSubscription, fetchConnections, fetchAllPostsForBids]);

  useEffect(() => {
    if (token && user) {
      refreshDashboard();
    }
  }, [token, user, refreshDashboard]);

  const myBids = useMemo(() => {
    const result = [];

    allPosts.forEach((post) => {
      (post.bids || []).forEach((bid) => {
        if (isMyBid(bid, user)) {
          result.push({
            post,
            bid,
          });
        }
      });
    });

    return result.sort(
      (a, b) =>
        new Date(b.bid.createdAt || b.post.createdAt) -
        new Date(a.bid.createdAt || a.post.createdAt)
    );
  }, [allPosts, user]);

  const pendingBids = useMemo(() => {
    return myBids.filter((item) => item.bid.status === "pending");
  }, [myBids]);

  const acceptedBids = useMemo(() => {
    return myBids.filter((item) => item.bid.status === "accepted");
  }, [myBids]);

  const rejectedBids = useMemo(() => {
    return myBids.filter((item) => item.bid.status === "rejected");
  }, [myBids]);

  const pendingConnections = useMemo(() => {
    return connections.filter((connection) => connection.status === "pending");
  }, [connections]);

  const acceptedConnections = useMemo(() => {
    return connections.filter((connection) => connection.status === "accepted");
  }, [connections]);

  const selectedConnection = useMemo(() => {
    return acceptedConnections.find(
      (connection) => String(connection._id) === String(selectedConnectionId)
    );
  }, [acceptedConnections, selectedConnectionId]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    if (acceptedConnections.length === 0) return;

    const exists = acceptedConnections.some(
      (connection) => String(connection._id) === String(selectedConnectionId)
    );

    if (!selectedConnectionId || !exists) {
      setSelectedConnectionId(acceptedConnections[0]._id);
    }
  }, [activeTab, acceptedConnections, selectedConnectionId]);

  const fetchMessages = useCallback(
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

        setMessages(data.data || []);

        await fetch(`${API_BASE_URL}/connections/${connectionId}/messages/read`, {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
        });
      } catch (err) {
        setMessages([]);
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
    if (activeTab === "chat" && selectedConnectionId) {
      fetchMessages(selectedConnectionId);
    }
  }, [activeTab, selectedConnectionId, fetchMessages]);

  const handleConnectionAction = async (connectionId, action) => {
    if (!token || !connectionId || !["accept", "reject"].includes(action)) {
      return;
    }

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
                ? "Connection request accepted by lawyer."
                : "Connection request rejected by lawyer.",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to ${action} request`);
      }

      setSuccessMessage(data.message || `Connection ${action}ed successfully`);

      await fetchConnections();

      if (action === "accept") {
        setSelectedConnectionId(connectionId);
        setActiveTab("chat");
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} request`);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleWithdrawBid = async (postId, bidId) => {
    if (!token || !postId || !bidId) return;

    try {
      setActionLoadingId(`withdraw-${bidId}`);
      setError("");
      setSuccessMessage("");

      const res = await fetch(`${API_BASE_URL}/posts/${postId}/bid/${bidId}`, {
        method: "PATCH",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Failed to withdraw proposal. Check your backend route for withdrawBid."
        );
      }

      setSuccessMessage(data.message || "Proposal withdrawn successfully");
      await fetchAllPostsForBids();
    } catch (err) {
      setError(err.message || "Failed to withdraw proposal");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!selectedConnectionId) {
      setChatError("Please select a conversation first");
      return;
    }

    const messageValidation = validateChatMessageText(messageText);

    if (!messageValidation.valid) {
      setChatError(messageValidation.message);
      return;
    }

    const attachmentValidation = validateAttachmentLinks(attachmentText);

    if (!attachmentValidation.valid) {
      setChatError(attachmentValidation.message);
      return;
    }

    try {
      setSendingMessage(true);
      setChatError("");

      const res = await fetch(
        `${API_BASE_URL}/connections/${selectedConnectionId}/messages`,
        {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            message: messageText.trim(),
            attachments: attachmentValidation.links,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to send message");
      }

      setMessageText("");
      setAttachmentText("");
      setShowAttachmentInput(false);

      if (data.data?.connection?.messages) {
        setMessages(data.data.connection.messages);
      } else if (data.data?.messages) {
        setMessages(data.data.messages);
      } else {
        await fetchMessages(selectedConnectionId);
      }

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

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: Scale,
      count: null,
    },
    {
      id: "bids",
      label: "My Bids",
      icon: Send,
      count: myBids.length,
    },
    {
      id: "requests",
      label: "Requests",
      icon: Handshake,
      count: pendingConnections.length,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageCircle,
      count: acceptedConnections.length,
    },
  ];

  const subscriptionStatus =
    activeSubscription?.status || user?.subscriptionStatus || "none";

  const currentPlanName =
    activeSubscription?.planName ||
    activeSubscription?.plan?.name ||
    "No active plan";

  const proposalLimit = getFeatureValue(activeFeatures, "proposal_limit");
  const connectionLimit = getFeatureValue(
    activeFeatures,
    "connection_request_limit"
  );

  const inAppMessaging = canUseChat
    ? true
    : getFeatureValue(activeFeatures, "in_app_messaging");

  const contactUnlock = getFeatureValue(activeFeatures, "contact_unlock");

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-white px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cyan-100 text-4xl font-black text-cyan-700">
            L
          </div>

          <h2 className="mt-6 text-3xl font-black text-slate-900">
            No Lawyer Found
          </h2>

          <p className="mt-3 text-slate-500">
            Please login as a lawyer to view your personal lawyer dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== "lawyer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-white px-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-9 w-9" />
          </div>

          <h2 className="mt-6 text-3xl font-black text-slate-900">
            Lawyer Access Only
          </h2>

          <p className="mt-3 text-slate-500">
            This dashboard is only for individual lawyer accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-white px-4 py-10 pt-24 sm:px-6 lg:px-8">
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
                  className="flex h-28 w-28 items-center justify-center rounded-full border border-white/30 bg-white/20 text-3xl font-black text-white shadow-xl backdrop-blur-md md:h-32 md:w-32 md:text-4xl"
                >
                  {getInitials(user.name)}
                </motion.div>

                <div className="text-white">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                      {user.name || "Lawyer Dashboard"}
                    </h1>

                    <span className="rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-bold capitalize backdrop-blur-md">
                      Lawyer
                    </span>

                    <span
                      className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${getSubscriptionBadgeClass(
                        subscriptionStatus
                      )}`}
                    >
                      {subscriptionStatus}
                    </span>

                    <span
                      className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                        canUseChat
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      Chat: {canUseChat ? "Enabled" : "Needs active plan"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-white/90 md:text-base">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email || "No email available"}
                    </p>

                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {user.phone || "No phone available"}
                    </p>

                    <p className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4" />
                      Reg: {user.lawRegNumber || "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                <HeroMiniCard
                  icon={<Send className="h-5 w-5" />}
                  label="Total Bids"
                  value={myBids.length}
                />

                <HeroMiniCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Accepted"
                  value={acceptedBids.length}
                />

                <HeroMiniCard
                  icon={<Handshake className="h-5 w-5" />}
                  label="Requests"
                  value={pendingConnections.length}
                />

                <HeroMiniCard
                  icon={<MessageCircle className="h-5 w-5" />}
                  label="Chats"
                  value={acceptedConnections.length}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="sticky top-20 z-30 mt-8 rounded-[24px] border border-slate-200 bg-white/90 p-2 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20"
                      : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}

                  {Number(tab.count) > 0 && (
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                        isActive
                          ? "bg-white text-cyan-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {successMessage}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={refreshDashboard}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Dashboard
          </button>
        </div>

        {activeTab === "overview" && (
          <OverviewTab
            user={user}
            loading={loadingProfile}
            activeSubscription={activeSubscription}
            subscriptionStatus={subscriptionStatus}
            currentPlanName={currentPlanName}
            proposalLimit={proposalLimit}
            connectionLimit={connectionLimit}
            inAppMessaging={inAppMessaging}
            contactUnlock={contactUnlock}
            myBids={myBids}
            pendingBids={pendingBids}
            acceptedBids={acceptedBids}
            rejectedBids={rejectedBids}
            pendingConnections={pendingConnections}
            acceptedConnections={acceptedConnections}
          />
        )}

        {activeTab === "bids" && (
          <BidsTab
            loading={loadingPosts}
            myBids={myBids}
            actionLoadingId={actionLoadingId}
            onWithdrawBid={handleWithdrawBid}
          />
        )}

        {activeTab === "requests" && (
          <RequestsTab
            user={user}
            loading={loadingConnections}
            connections={connections}
            actionLoadingId={actionLoadingId}
            onAccept={(id) => handleConnectionAction(id, "accept")}
            onReject={(id) => handleConnectionAction(id, "reject")}
            onOpenChat={(id) => {
              setSelectedConnectionId(id);
              setActiveTab("chat");
            }}
          />
        )}

        {activeTab === "chat" && (
          <ChatTab
            user={user}
            connections={acceptedConnections}
            selectedConnectionId={selectedConnectionId}
            selectedConnection={selectedConnection}
            messages={messages}
            canUseChat={canUseChat}
            loadingConnections={loadingConnections}
            loadingMessages={loadingMessages}
            sendingMessage={sendingMessage}
            messageText={messageText}
            attachmentText={attachmentText}
            showAttachmentInput={showAttachmentInput}
            chatError={chatError}
            onSelectConnection={setSelectedConnectionId}
            onMessageChange={(value) => {
              setMessageText(value);
              setChatError("");
            }}
            onAttachmentChange={(value) => {
              setAttachmentText(value);
              setChatError("");
            }}
            onToggleAttachmentInput={() => {
              setShowAttachmentInput((prev) => !prev);
              setChatError("");
            }}
            onClearAttachment={() => {
              setAttachmentText("");
              setShowAttachmentInput(false);
              setChatError("");
            }}
            onSendMessage={handleSendMessage}
            onRefreshMessages={() =>
              selectedConnectionId && fetchMessages(selectedConnectionId)
            }
          />
        )}
      </div>
    </div>
  );
};

const OverviewTab = ({
  user,
  loading,
  activeSubscription,
  subscriptionStatus,
  currentPlanName,
  proposalLimit,
  connectionLimit,
  inAppMessaging,
  contactUnlock,
  myBids,
  pendingBids,
  acceptedBids,
  rejectedBids,
  pendingConnections,
  acceptedConnections,
}) => {
  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-3">
      <div className="space-y-8 xl:col-span-2">
        <SectionCard
          icon={<Scale className="h-6 w-6" />}
          title="Lawyer Profile"
          subtitle="Your professional account information"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard icon={<UserRound />} label="Name" value={user.name} />
            <InfoCard icon={<Mail />} label="Email" value={user.email} />
            <InfoCard icon={<Phone />} label="Phone" value={user.phone || "-"} />
            <InfoCard
              icon={<BadgeCheck />}
              label="Law Reg. Number"
              value={user.lawRegNumber || "-"}
            />
            <InfoCard
              icon={<ShieldCheck />}
              label="Phone Verification"
              value={user.phoneVerified ? "Verified" : "Not Verified"}
            />
            <InfoCard
              icon={<CalendarDays />}
              label="Joined"
              value={formatDate(user.createdAt)}
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={<Briefcase className="h-6 w-6" />}
          title="Proposal Summary"
          subtitle="Your proposal/bid performance"
        >
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="Total Bids" value={myBids.length} />
            <StatCard title="Pending" value={pendingBids.length} />
            <StatCard title="Accepted" value={acceptedBids.length} />
            <StatCard title="Rejected" value={rejectedBids.length} />
          </div>
        </SectionCard>
      </div>

      <div className="space-y-8">
        <SectionCard
          icon={<Crown className="h-6 w-6" />}
          title="Subscription"
          subtitle="Plan and feature access"
        >
          {loading ? (
            <LoadingBox text="Loading subscription..." />
          ) : (
            <div className="space-y-4">
              <div
                className={`rounded-2xl border p-5 ${getSubscriptionBadgeClass(
                  subscriptionStatus
                )}`}
              >
                <p className="text-sm font-bold">Status</p>
                <h3 className="mt-1 text-2xl font-black capitalize">
                  {subscriptionStatus}
                </h3>
              </div>

              <MiniDetail label="Current Plan" value={currentPlanName} />

              <MiniDetail
                label="Price"
                value={
                  activeSubscription
                    ? formatCurrency(
                        activeSubscription.price,
                        activeSubscription.currency || "BDT"
                      )
                    : "No active subscription"
                }
              />

              <MiniDetail
                label="Plan End"
                value={formatDate(activeSubscription?.endDate)}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<Wallet className="h-6 w-6" />}
          title="Feature Access"
          subtitle="Limits from your plan"
        >
          <div className="space-y-3">
            <FeatureRow label="Proposal Limit" value={proposalLimit} />
            <FeatureRow label="Connection Requests" value={connectionLimit} />
            <FeatureRow label="In-app Messaging" value={inAppMessaging} />
            <FeatureRow label="Contact Unlock" value={contactUnlock} />
          </div>
        </SectionCard>

        <SectionCard
          icon={<Handshake className="h-6 w-6" />}
          title="Connections"
          subtitle="Client request overview"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard title="Pending" value={pendingConnections.length} />
            <StatCard title="Accepted" value={acceptedConnections.length} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

const BidsTab = ({ loading, myBids, actionLoadingId, onWithdrawBid }) => {
  return (
    <SectionCard
      className="mt-8"
      icon={<Send className="h-6 w-6" />}
      title="My Bids / Proposals"
      subtitle="Track every proposal you sent to client case posts"
    >
      {loading ? (
        <LoadingBox text="Loading your bids..." />
      ) : myBids.length === 0 ? (
        <EmptyBox text="No bids found. Send proposals from legal posts after a client accepts your connection request." />
      ) : (
        <div className="space-y-5">
          {myBids.map(({ post, bid }) => {
            const canWithdraw = bid.status === "pending";

            return (
              <div
                key={`${post._id}-${bid._id}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getBidBadgeClass(
                          bid.status
                        )}`}
                      >
                        {bid.status}
                      </span>

                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 capitalize">
                        {post.status?.replace("_", " ") || "open"}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {formatDateTime(bid.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-950">
                      {post.title || "Untitled Case"}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {post.description || "No description available."}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <MiniDetail
                        label="Client"
                        value={post.client?.name || "Client"}
                      />

                      <MiniDetail
                        label="Fee"
                        value={formatCurrency(bid.proposedFee)}
                      />

                      <MiniDetail
                        label="Estimated Days"
                        value={`${bid.estimatedDays || 0} days`}
                      />

                      <MiniDetail
                        label="Budget"
                        value={`${formatCurrency(
                          post.budgetMin
                        )} - ${formatCurrency(post.budgetMax)}`}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                        Your Proposal Message
                      </p>
                      <p className="text-sm leading-6 text-slate-700">
                        {bid.message || "No message provided."}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-[220px]">
                    <button
                      type="button"
                      onClick={() => onWithdrawBid(post._id, bid._id)}
                      disabled={
                        !canWithdraw || actionLoadingId === `withdraw-${bid._id}`
                      }
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                        canWithdraw
                          ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {actionLoadingId === `withdraw-${bid._id}`
                        ? "Withdrawing..."
                        : bid.status === "accepted"
                        ? "Accepted"
                        : bid.status === "rejected"
                        ? "Rejected"
                        : bid.status === "withdrawn"
                        ? "Withdrawn"
                        : "Withdraw Bid"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

const RequestsTab = ({
  user,
  loading,
  connections,
  actionLoadingId,
  onAccept,
  onReject,
  onOpenChat,
}) => {
  const userId = String(user?._id || user?.id || "");

  return (
    <SectionCard
      className="mt-8"
      icon={<Handshake className="h-6 w-6" />}
      title="Client Connection Requests"
      subtitle="Accept requests before proposal or conversation flow"
    >
      {loading ? (
        <LoadingBox text="Loading connection requests..." />
      ) : connections.length === 0 ? (
        <EmptyBox text="No connection requests found." />
      ) : (
        <div className="space-y-5">
          {connections.map((connection) => {
            const requestedById = String(
              connection.requestedBy?._id || connection.requestedBy || ""
            );

            const canRespond =
              connection.status === "pending" && requestedById !== userId;

            return (
              <div
                key={connection._id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getConnectionBadgeClass(
                          connection.status
                        )}`}
                      >
                        {connection.status}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {formatDateTime(connection.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-950">
                      {connection.post?.title || "Case Request"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {connection.requestMessage || "No request message."}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <MiniDetail
                        label="Client"
                        value={connection.client?.name || "-"}
                      />

                      <MiniDetail
                        label="Client Email"
                        value={connection.client?.email || "-"}
                      />

                      <MiniDetail
                        label="Case Category"
                        value={connection.post?.category || "-"}
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
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
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
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          <XCircle className="h-4 w-4" />
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
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700"
                      >
                        <MessageCircle className="h-4 w-4" />
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
    </SectionCard>
  );
};

const ChatTab = ({
  user,
  connections,
  selectedConnectionId,
  selectedConnection,
  messages,
  canUseChat,
  loadingConnections,
  loadingMessages,
  sendingMessage,
  messageText,
  attachmentText,
  showAttachmentInput,
  chatError,
  onSelectConnection,
  onMessageChange,
  onAttachmentChange,
  onToggleAttachmentInput,
  onClearAttachment,
  onSendMessage,
  onRefreshMessages,
}) => {
  const userId = String(user?._id || user?.id || "");
  const otherUser = getOtherUser(selectedConnection, user);

  return (
    <div className="mt-8 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-950">
              <MessageCircle className="h-6 w-6 text-cyan-700" />
              Client Conversation
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Free and paid active plans can chat after accepted connection.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshMessages}
            disabled={!selectedConnectionId || loadingMessages}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Chat
          </button>
        </div>
      </div>

      {!canUseChat && (
        <div className="m-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Lock className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-amber-800">
                Active Subscription Required
              </h3>

              <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                Free and paid active plans can use conversation. Your account
                does not have an active subscription yet, so messaging is
                currently locked.
              </p>

              <a
                href="/plans"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700"
              >
                <Crown className="h-4 w-4" />
                Choose Plan
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-950">
              Accepted Clients
            </h3>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
              {connections.length}
            </span>
          </div>

          {loadingConnections ? (
            <LoadingBox text="Loading clients..." />
          ) : connections.length === 0 ? (
            <EmptyBox text="No accepted clients yet." />
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => {
                const client = getOtherUser(connection, user);
                const active =
                  String(connection._id) === String(selectedConnectionId);

                const lastMessage =
                  connection.messages?.[connection.messages.length - 1];

                return (
                  <button
                    key={connection._id}
                    type="button"
                    onClick={() => onSelectConnection(connection._id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-cyan-300 bg-white shadow-md"
                        : "border-slate-200 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                          active
                            ? "bg-cyan-600 text-white"
                            : "bg-cyan-50 text-cyan-700"
                        }`}
                      >
                        {getInitials(client?.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-slate-950">
                          {client?.name || "Client"}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {connection.post?.title || "Case chat"}
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-black text-cyan-700">
                      {getInitials(otherUser?.name)}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        {otherUser?.name || "Client"}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {selectedConnection.post?.title || "Legal case chat"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-2 text-xs font-black capitalize ${getConnectionBadgeClass(
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
                  <EmptyBox text="No messages yet. Start the conversation with your client." />
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
                            className={`mb-1 text-xs font-black ${
                              isMine ? "text-cyan-50" : "text-slate-500"
                            }`}
                          >
                            {isMine ? "You" : item.sender?.name || "Client"}
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
                                  <Paperclip className="h-3.5 w-3.5" />
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
                    value={messageText}
                    onChange={(e) => onMessageChange(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder={
                      canUseChat
                        ? "Write your message. Do not share phone numbers, payment numbers, or social media links."
                        : "Activate a free or paid plan to use conversation..."
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
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>

                      <input
                        type="url"
                        value={attachmentText}
                        onChange={(e) => onAttachmentChange(e.target.value)}
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
                        <Paperclip className="h-4 w-4" />
                        Attachment
                      </button>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          {messageText.length}/2000 characters
                        </p>

                        <p className="mt-1 text-xs font-semibold text-red-500">
                          Phone/payment numbers and social media links are
                          blocked.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        !canUseChat || sendingMessage || !messageText.trim()
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {sendingMessage ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyBox text="Select an accepted client to open conversation." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HeroMiniCard = ({ icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">{label}</p>
        {icon}
      </div>

      <h3 className="text-3xl font-black">{value}</h3>
    </div>
  );
};

const SectionCard = ({ icon, title, subtitle, children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8 ${className}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
          {icon}
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
          <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>

      {children}
    </motion.div>
  );
};

const InfoCard = ({ icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm">
        {icon}
      </div>

      <p className="text-sm font-semibold text-slate-500">{label}</p>

      <h4 className="mt-1 break-words text-base font-black text-slate-900">
        {value || "-"}
      </h4>
    </div>
  );
};

const MiniDetail = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-black capitalize text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
};

const StatCard = ({ title, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="mt-1 text-3xl font-black text-slate-950">{value}</h3>
    </div>
  );
};

const FeatureRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black text-slate-700">{label}</p>

      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900">
        {readableFeature(value)}
      </span>
    </div>
  );
};

const LoadingBox = ({ text }) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
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

export default LawyerDashboard;
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  User,
  BadgeDollarSign,
  Briefcase,
  FileText,
  Newspaper,
  Loader2,
  SlidersHorizontal,
  AlertCircle,
  RefreshCcw,
  Send,
  X,
  Lock,
  CheckCircle2,
  PlusCircle,
  CalendarDays,
  Crown,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { restoreUser } from "../../Redux/UserSlice/UserSlice";

const API_URL = "https://law-link-bd-api.vercel.app/api/posts";

const categoryOptions = [
  "All",
  "family",
  "criminal",
  "property",
  "corporate",
  "civil",
  "tax",
  "labour",
  "cyber",
  "immigration",
  "other",
];

const postCategoryOptions = [
  "family",
  "criminal",
  "property",
  "corporate",
  "civil",
  "tax",
  "labour",
  "cyber",
  "immigration",
  "other",
];

const urgencyOptions = ["All", "high", "medium", "low"];
const postUrgencyOptions = ["low", "medium", "high"];
const statusOptions = ["open", "All", "in_progress", "closed", "cancelled"];

const statusFetchMap = {
  open: ["open"],
  in_progress: ["in_progress"],
  closed: ["closed"],
  cancelled: ["cancelled"],
  All: ["open", "in_progress", "closed", "cancelled"],
};

const initialCreatePostForm = {
  title: "",
  description: "",
  category: "other",
  budgetMin: "",
  budgetMax: "",
  urgency: "medium",
  division: "",
  district: "",
  documents: "",
  expiresAt: "",
};

const getStoredToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const getStoredUser = () => {
  const localUser = localStorage.getItem("currentUser");
  const sessionUser = sessionStorage.getItem("currentUser");

  try {
    return JSON.parse(localUser || sessionUser || "null");
  } catch {
    return null;
  }
};

const getPlanLimitMessage = (message = "") => {
  const normalized = message.toLowerCase();

  const isPlanLimitError =
    normalized.includes("plan does not allow") ||
    normalized.includes("case post limit reached") ||
    normalized.includes("upgrade your plan") ||
    normalized.includes("case posting");

  if (!isPlanLimitError) return message || "Failed to create post";

  return "Your current plan allows only 1 case post. Please upgrade your plan to create more posts.";
};

const Post = () => {
  const dispatch = useDispatch();
  const reduxCurrentUser = useSelector((state) => state.user.currentUser);

  const [currentUser, setCurrentUser] = useState(reduxCurrentUser || null);
  const [posts, setPosts] = useState([]);

  const [postsMeta, setPostsMeta] = useState({
    limit: 20,
    hasNextPage: false,
    nextCursor: null,
  });

  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastRequestUrl, setLastRequestUrl] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("open");

  const [selectedPost, setSelectedPost] = useState(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");

  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [createPostSubmitting, setCreatePostSubmitting] = useState(false);
  const [createPostError, setCreatePostError] = useState("");
  const [createPostSuccess, setCreatePostSuccess] = useState("");
  const [createPostForm, setCreatePostForm] = useState(initialCreatePostForm);

  const [bidForm, setBidForm] = useState({
    proposedFee: "",
    estimatedDays: "",
    message: "",
  });

  const isLoggedIn = Boolean(currentUser);
  const isClient = currentUser?.role === "client";
  const isLawyer = currentUser?.role === "lawyer";
  const hasActiveSubscription = currentUser?.subscriptionStatus === "active";
  const isFreeClient =
    isClient &&
    currentUser?.currentSubscription?.planSlug === "client-free";

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!reduxCurrentUser && storedUser) {
      dispatch(restoreUser(storedUser));
      setCurrentUser(storedUser);
      return;
    }

    setCurrentUser(reduxCurrentUser || storedUser || null);
  }, [reduxCurrentUser, dispatch]);

  const buildQuery = useCallback(
    ({ cursor = null, statusOverride = "open" } = {}) => {
      const params = new URLSearchParams();

      params.set("limit", "20");

      if (cursor) params.set("cursor", cursor);
      if (statusOverride && statusOverride !== "All") {
        params.set("status", statusOverride);
      }

      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (selectedUrgency !== "All") params.set("urgency", selectedUrgency);
      if (appliedSearch.trim()) params.set("search", appliedSearch.trim());

      return params.toString();
    },
    [selectedCategory, selectedUrgency, appliedSearch]
  );

  const fetchSingleStatusPosts = useCallback(
    async ({ status, cursor = null } = {}) => {
      const query = buildQuery({
        cursor,
        statusOverride: status,
      });

      const url = `${API_URL}?${query}`;
      setLastRequestUrl(url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to fetch posts");
      }

      return data;
    },
    [buildQuery]
  );

  const fetchPosts = useCallback(
    async ({ cursor = null, append = false } = {}) => {
      try {
        if (append) {
          setLoadMoreLoading(true);
        } else {
          setLoading(true);
        }

        setError("");

        const statusesToFetch = statusFetchMap[selectedStatus] || ["open"];

        if (selectedStatus === "All" && !cursor) {
          const responses = await Promise.all(
            statusesToFetch.map((status) => fetchSingleStatusPosts({ status }))
          );

          const mergedPosts = responses.flatMap((item) => item.data || []);
          const uniquePosts = Array.from(
            new Map(mergedPosts.map((post) => [post._id, post])).values()
          ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setPosts(uniquePosts);

          setPostsMeta({
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          });

          return;
        }

        const data = await fetchSingleStatusPosts({
          status: selectedStatus === "All" ? "open" : selectedStatus,
          cursor,
        });

        setPosts((prev) =>
          append ? [...prev, ...(data.data || [])] : data.data || []
        );

        setPostsMeta(
          data.meta || {
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          }
        );
      } catch (err) {
        setError(err.message || "Failed to fetch posts");

        if (!append) {
          setPosts([]);
          setPostsMeta({
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          });
        }
      } finally {
        setLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [selectedStatus, fetchSingleStatusPosts]
  );

  useEffect(() => {
    setSelectedLocation("All");
    fetchPosts();
  }, [fetchPosts]);

  const locations = useMemo(() => {
    const uniqueLocations = [
      ...new Set(
        posts
          .map((post) =>
            [post.division, post.district].filter(Boolean).join(", ")
          )
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueLocations];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const locationText = [post.division, post.district]
        .filter(Boolean)
        .join(", ")
        .toLowerCase();

      const selectedLocationText = selectedLocation.toLowerCase();

      return selectedLocation === "All" || locationText === selectedLocationText;
    });
  }, [posts, selectedLocation]);

  const formatBudget = (min, max) => {
    const minValue = Number(min || 0);
    const maxValue = Number(max || 0);

    if (!minValue && !maxValue) return "Budget not specified";
    if (minValue && maxValue) return `৳${minValue} - ৳${maxValue}`;
    if (!minValue && maxValue) return `Up to ৳${maxValue}`;
    return `From ৳${minValue}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently posted";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "Recently posted";

    return date.toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getUrgencyClasses = (urgency) => {
    switch (urgency) {
      case "high":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "open":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "closed":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setAppliedSearch("");
    setSelectedCategory("All");
    setSelectedUrgency("All");
    setSelectedLocation("All");
    setSelectedStatus("open");
  };

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleLoadMore = () => {
    if (!postsMeta.nextCursor || loadMoreLoading) return;

    fetchPosts({
      cursor: postsMeta.nextCursor,
      append: true,
    });
  };

  const handleRefresh = () => {
    fetchPosts();
  };

  const openCreatePostModal = () => {
    setCreatePostForm(initialCreatePostForm);
    setCreatePostError("");
    setCreatePostSuccess("");
    setIsCreatePostModalOpen(true);
  };

  const closeCreatePostModal = () => {
    if (createPostSubmitting) return;

    setCreatePostForm(initialCreatePostForm);
    setCreatePostError("");
    setCreatePostSuccess("");
    setIsCreatePostModalOpen(false);
  };

  const handleCreatePostChange = (e) => {
    const { name, value } = e.target;

    setCreatePostForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitCreatePost = async (e) => {
    e.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setCreatePostError("Please login first");
      return;
    }

    if (!isClient) {
      setCreatePostError("Only clients can create case posts");
      return;
    }

    if (!createPostForm.title.trim() || !createPostForm.description.trim()) {
      setCreatePostError("Title and description are required");
      return;
    }

    const minBudget = Number(createPostForm.budgetMin || 0);
    const maxBudget = Number(createPostForm.budgetMax || 0);

    if (maxBudget > 0 && minBudget > maxBudget) {
      setCreatePostError("Maximum budget must be greater than minimum budget");
      return;
    }

    try {
      setCreatePostSubmitting(true);
      setCreatePostError("");
      setCreatePostSuccess("");
      setSuccessMessage("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: createPostForm.title.trim(),
          description: createPostForm.description.trim(),
          category: createPostForm.category,
          budgetMin: Number(createPostForm.budgetMin || 0),
          budgetMax: Number(createPostForm.budgetMax || 0),
          urgency: createPostForm.urgency,
          division: createPostForm.division.trim(),
          district: createPostForm.district.trim(),
          documents: createPostForm.documents,
          expiresAt: createPostForm.expiresAt || null,
          isPriority: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to create post");
      }

      setCreatePostSuccess(data.message || "Post created successfully");
      setSuccessMessage(data.message || "Post created successfully");

      setPosts((prev) => [data.data, ...prev]);

      setTimeout(() => {
        closeCreatePostModal();
      }, 900);
    } catch (err) {
      setCreatePostError(getPlanLimitMessage(err.message));
    } finally {
      setCreatePostSubmitting(false);
    }
  };

  const openBidModal = (post) => {
    setSelectedPost(post);
    setBidError("");
    setBidSuccess("");
    setBidForm({
      proposedFee: "",
      estimatedDays: "",
      message: "",
    });
    setIsBidModalOpen(true);
  };

  const closeBidModal = () => {
    if (bidSubmitting) return;

    setIsBidModalOpen(false);
    setSelectedPost(null);
    setBidError("");
    setBidSuccess("");
    setBidForm({
      proposedFee: "",
      estimatedDays: "",
      message: "",
    });
  };

  const handleBidFormChange = (e) => {
    const { name, value } = e.target;

    setBidForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitBid = async (e) => {
    e.preventDefault();

    if (!selectedPost?._id) {
      setBidError("Post not selected");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setBidError("Please login first");
      return;
    }

    if (!isLawyer) {
      setBidError("Only lawyers can send proposal");
      return;
    }

    if (!hasActiveSubscription) {
      setBidError("You need an active subscription to send proposal");
      return;
    }

    if (!bidForm.proposedFee || !bidForm.estimatedDays || !bidForm.message) {
      setBidError("Proposed fee, estimated days and message are required");
      return;
    }

    try {
      setBidSubmitting(true);
      setBidError("");
      setBidSuccess("");

      const response = await fetch(`${API_URL}/${selectedPost._id}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposedFee: Number(bidForm.proposedFee),
          estimatedDays: Number(bidForm.estimatedDays),
          message: bidForm.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to send proposal");
      }

      setBidSuccess(data?.message || "Proposal sent successfully");

      setPosts((prev) =>
        prev.map((item) => (item._id === selectedPost._id ? data.data : item))
      );

      setTimeout(() => {
        closeBidModal();
      }, 900);
    } catch (err) {
      setBidError(err.message || "Failed to send proposal");
    } finally {
      setBidSubmitting(false);
    }
  };

  const alreadyBidOnPost = (post) => {
    if (!currentUser?._id && !currentUser?.id) return false;

    const userId = currentUser._id || currentUser.id;

    return Boolean(
      post?.bids?.some((bid) => {
        const lawyerId = bid?.lawyer?._id || bid?.lawyer;
        return String(lawyerId) === String(userId);
      })
    );
  };

  const getLawyerActionState = (post) => {
    if (!isLoggedIn) {
      return {
        showProposalButton: false,
        label: "View Details",
        disabled: false,
        reason: "",
      };
    }

    if (!isLawyer) {
      return {
        showProposalButton: false,
        label: "View Details",
        disabled: false,
        reason: "",
      };
    }

    if (post.status !== "open") {
      return {
        showProposalButton: true,
        label: "Closed",
        disabled: true,
        reason: "Proposal is available only for open posts",
      };
    }

    if (!hasActiveSubscription) {
      return {
        showProposalButton: true,
        label: "Upgrade Required",
        disabled: true,
        reason: "Active subscription required",
      };
    }

    if (alreadyBidOnPost(post)) {
      return {
        showProposalButton: true,
        label: "Proposal Sent",
        disabled: true,
        reason: "You already sent proposal",
      };
    }

    return {
      showProposalButton: false,
      label: "View Details",
      disabled: false,
      reason: "",
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/60 via-white to-slate-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 md:p-8 shadow-2xl mb-8"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.35),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.14),_transparent_30%)]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 mb-4">
              
                Legal Requests Marketplace
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                Browse Legal Case Posts
              </h1>

              <p className="mt-4 max-w-2xl text-sm md:text-base text-slate-300 leading-7">
                Clients can publish legal requests and lawyers can review case
                details, connect with clients, and send proposals based on their
                subscription access.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isLoggedIn && isClient && (
                <button
                  onClick={openCreatePostModal}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-300 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Post
                </button>
              )}

              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {isLoggedIn && isClient && (
          <motion.div
            className="mb-8 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-cyan-50 p-5 shadow-sm"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-amber-700" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-950">
                    {isFreeClient
                      ? "Free Plan Limit"
                      : "Your Client Posting Access"}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {isFreeClient
                      ? "Your current free plan allows only 1 case post. Upgrade your plan to create more legal requests."
                      : "You can create case posts based on your active subscription limit."}
                  </p>
                </div>
              </div>

              {isFreeClient && (
                <Link
                  to="/plans"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade Plan
                </Link>
              )}
            </div>
          </motion.div>
        )}

        <motion.div
          className="bg-white/95 backdrop-blur p-5 md:p-6 rounded-3xl shadow-xl border border-cyan-100 mb-8"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-cyan-700" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Find Matching Posts
                </h2>
                <p className="text-sm text-slate-500">
                  Filter posts by category, urgency, status and location.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />

              <input
                type="text"
                placeholder="Search title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-800"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-800 capitalize"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category === "All"
                    ? "All Categories"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-800"
            >
              {urgencyOptions.map((urgency) => (
                <option key={urgency} value={urgency}>
                  {urgency === "All"
                    ? "All Urgency"
                    : `${urgency.charAt(0).toUpperCase() + urgency.slice(1)} Urgency`}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-800"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location === "All" ? "All Locations" : location}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-800"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All"
                    ? "All Status"
                    : status === "in_progress"
                    ? "In Progress"
                    : `${status.charAt(0).toUpperCase() + status.slice(1)} Posts`}
                </option>
              ))}
            </select>

            <motion.button
              onClick={handleSearch}
              className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white px-6 py-3 rounded-2xl hover:from-cyan-600 hover:to-cyan-800 transition-all flex items-center justify-center gap-2 font-black shadow-lg shadow-cyan-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Search className="w-4 h-4" />
              Search Posts
            </motion.button>

            <motion.button
              onClick={resetFilters}
              className="bg-slate-950 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-black"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-4 h-4" />
              Reset Filters
            </motion.button>
          </div>
        </motion.div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-white border border-cyan-100 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
            Showing {filteredPosts.length} loaded posts
          </span>

          <span className="inline-flex items-center rounded-full bg-white border border-cyan-100 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm capitalize">
            Status:{" "}
            {selectedStatus === "All"
              ? "all"
              : selectedStatus.replace("_", " ")}
          </span>

          {isClient && (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm">
              <Crown className="w-4 h-4" />
              Free plan: 1 case post allowed
            </span>
          )}

          {postsMeta.hasNextPage && selectedStatus !== "All" && (
            <span className="inline-flex items-center rounded-full bg-cyan-50 border border-cyan-200 px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm">
              More posts available
            </span>
          )}
        </div>

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 flex gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p>{error}</p>
              {lastRequestUrl && (
                <p className="mt-1 text-xs text-red-600 break-all">
                  Request: {lastRequestUrl}
                </p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white p-6 rounded-3xl shadow-lg border border-cyan-100 animate-pulse"
              >
                <div className="h-44 rounded-2xl bg-slate-200 mb-5" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                <div className="h-4 bg-slate-200 rounded w-5/6 mb-4" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <>
            <motion.div
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-8"
              initial="hidden"
              animate="visible"
            >
              {filteredPosts.map((post) => {
                const location = [post.division, post.district]
                  .filter(Boolean)
                  .join(", ");

                const actionState = getLawyerActionState(post);

                return (
                  <motion.div
                    key={post._id}
                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-cyan-100 hover:border-cyan-200 overflow-hidden"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 260 }}
                  >
                    <div className="h-44 bg-gradient-to-br from-cyan-50 via-white to-slate-50 border-b border-cyan-100 flex items-center justify-center">
                      <div className="text-center px-6">
                        <div className="w-16 h-16 rounded-3xl bg-white border border-cyan-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <Briefcase className="w-7 h-7 text-cyan-700" />
                        </div>

                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 font-black mb-1">
                          {post.category || "Legal Post"}
                        </p>

                        <h3 className="text-sm font-bold text-slate-700">
                          Client Case Requirement
                        </h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black capitalize ${getStatusClasses(
                            post.status
                          )}`}
                        >
                          {post.status?.replace("_", " ") || "open"}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black capitalize ${getUrgencyClasses(
                            post.urgency
                          )}`}
                        >
                          {post.urgency || "medium"} urgency
                        </span>

                        {Number(post.isPriority) === 1 && (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                            Priority
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-black text-slate-950 mb-3 line-clamp-2 min-h-[56px]">
                        {post.title || "Untitled Post"}
                      </h2>

                      <p className="text-sm text-slate-600 leading-6 line-clamp-3 mb-5 min-h-[72px]">
                        {post.description || "No description provided."}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 flex items-center gap-2 text-sm">
                            <User className="w-4 h-4" />
                            Client
                          </span>

                          <span className="font-bold text-slate-800 text-sm text-right">
                            {post.client?.name || "Unknown Client"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 flex items-center gap-2 text-sm">
                            <BadgeDollarSign className="w-4 h-4" />
                            Budget
                          </span>

                          <span className="font-bold text-slate-800 text-sm text-right">
                            {formatBudget(post.budgetMin, post.budgetMax)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            Location
                          </span>

                          <span className="font-bold text-slate-800 text-sm text-right">
                            {location || "Not specified"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" />
                            Posted
                          </span>

                          <span className="font-bold text-slate-800 text-sm text-right">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      {isLawyer && actionState.reason && (
                        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 flex items-center gap-2">
                          <Lock className="w-4 h-4 shrink-0" />
                          {actionState.reason}
                        </div>
                      )}

                      <div className="border-t border-cyan-100 pt-5">
                        <div className="flex gap-3">
                          {actionState.showProposalButton ? (
                            <motion.button
                              onClick={() => openBidModal(post)}
                              disabled={actionState.disabled}
                              className={`flex-1 py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                                actionState.disabled
                                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                  : "bg-gradient-to-r from-cyan-500 to-cyan-700 text-white hover:from-cyan-600 hover:to-cyan-800 shadow-lg shadow-cyan-500/20"
                              }`}
                            >
                              {alreadyBidOnPost(post) ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              {actionState.label}
                            </motion.button>
                          ) : (
                            <Link
                              to={`/posts/${post._id}`}
                              className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-700 text-white py-3 rounded-2xl font-black hover:from-cyan-600 hover:to-cyan-800 transition-all shadow-lg shadow-cyan-500/20 text-center"
                            >
                              View Details
                            </Link>
                          )}

                          <Link
                            to={`/posts/${post._id}`}
                            className="px-4 py-3 border border-cyan-200 rounded-2xl hover:bg-cyan-50 transition-colors flex items-center justify-center"
                          >
                            <FileText className="w-4 h-4 text-cyan-700" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {postsMeta.hasNextPage && selectedStatus !== "All" && (
              <div className="flex justify-center mt-10">
                <motion.button
                  onClick={handleLoadMore}
                  disabled={loadMoreLoading}
                  className="bg-slate-950 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-black disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadMoreLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    "Load More Posts"
                  )}
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            className="text-center py-16 bg-white rounded-3xl border border-cyan-100 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className="w-16 h-16 rounded-3xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-7 h-7 text-cyan-700" />
            </div>

            <p className="text-slate-800 text-lg font-black mb-2">
              No posts found
            </p>

            <p className="text-slate-500 max-w-xl mx-auto">
              Try changing your filters or create a new legal request.
            </p>

            {isLoggedIn && isClient && (
              <button
                onClick={openCreatePostModal}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-cyan-800"
              >
                <PlusCircle className="w-4 h-4" />
                Create Your First Post
              </button>
            )}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isCreatePostModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-cyan-100"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-black text-cyan-700 mb-3">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Create Case Post
                  </div>

                  <h2 className="text-2xl font-black text-slate-950">
                    Add New Legal Request
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Share your legal issue so lawyers can review your case.
                  </p>
                </div>

                <button
                  onClick={closeCreatePostModal}
                  disabled={createPostSubmitting}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitCreatePost} className="p-6">
                {isFreeClient && (
                  <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 flex items-start gap-3">
                    <Crown className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p>Free plan limit: 1 case post allowed.</p>
                      <p className="mt-1 text-xs font-semibold text-amber-700/80">
                        If you already created one post, upgrade your plan to
                        create more posts.
                      </p>
                    </div>
                  </div>
                )}

                {createPostError && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p>{createPostError}</p>

                      {createPostError.toLowerCase().includes("upgrade") && (
                        <Link
                          to="/plans"
                          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          Upgrade Plan
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {createPostSuccess && (
                  <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {createPostSuccess}
                  </div>
                )}

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-black text-slate-800 mb-2">
                      Case Title
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={createPostForm.title}
                      onChange={handleCreatePostChange}
                      maxLength={200}
                      placeholder="Example: Need help with property dispute"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-800 mb-2">
                      Case Description
                    </label>

                    <textarea
                      name="description"
                      value={createPostForm.description}
                      onChange={handleCreatePostChange}
                      rows={6}
                      maxLength={5000}
                      placeholder="Describe your legal issue..."
                      className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      required
                    />

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {createPostForm.description.length}/5000 characters
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        Category
                      </label>

                      <select
                        name="category"
                        value={createPostForm.category}
                        onChange={handleCreatePostChange}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 capitalize"
                      >
                        {postCategoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        Urgency
                      </label>

                      <select
                        name="urgency"
                        value={createPostForm.urgency}
                        onChange={handleCreatePostChange}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 capitalize"
                      >
                        {postUrgencyOptions.map((urgency) => (
                          <option key={urgency} value={urgency}>
                            {urgency.charAt(0).toUpperCase() +
                              urgency.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        Expiry Date
                      </label>

                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          name="expiresAt"
                          value={createPostForm.expiresAt}
                          onChange={handleCreatePostChange}
                          className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        Minimum Budget
                      </label>

                      <input
                        type="number"
                        name="budgetMin"
                        value={createPostForm.budgetMin}
                        onChange={handleCreatePostChange}
                        min="0"
                        placeholder="Example: 3000"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        Maximum Budget
                      </label>

                      <input
                        type="number"
                        name="budgetMax"
                        value={createPostForm.budgetMax}
                        onChange={handleCreatePostChange}
                        min="0"
                        placeholder="Example: 10000"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        Division
                      </label>

                      <input
                        type="text"
                        name="division"
                        value={createPostForm.division}
                        onChange={handleCreatePostChange}
                        placeholder="Example: Dhaka"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        District
                      </label>

                      <input
                        type="text"
                        name="district"
                        value={createPostForm.district}
                        onChange={handleCreatePostChange}
                        placeholder="Example: Dhaka"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-800 mb-2">
                      Document Links
                    </label>

                    <textarea
                      name="documents"
                      value={createPostForm.documents}
                      onChange={handleCreatePostChange}
                      rows={3}
                      placeholder="Paste document links separated by comma"
                      className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                    />

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Optional. Comma-separated links will be saved as documents.
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeCreatePostModal}
                    disabled={createPostSubmitting}
                    className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={createPostSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-cyan-800 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {createPostSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Create Post
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBidModalOpen && selectedPost && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-cyan-100 overflow-hidden"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-black text-cyan-700 mb-3">
                    <Send className="w-3.5 h-3.5" />
                    Send Proposal
                  </div>

                  <h2 className="text-2xl font-black text-slate-950">
                    {selectedPost.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Submit your legal service proposal to the client.
                  </p>
                </div>

                <button
                  onClick={closeBidModal}
                  disabled={bidSubmitting}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitBid} className="p-6">
                {bidError && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {bidError}
                  </div>
                )}

                {bidSuccess && (
                  <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {bidSuccess}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-black text-slate-800 mb-2">
                      Proposed Fee
                    </label>

                    <input
                      type="number"
                      name="proposedFee"
                      value={bidForm.proposedFee}
                      onChange={handleBidFormChange}
                      min="0"
                      placeholder="Example: 5000"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-800 mb-2">
                      Estimated Days
                    </label>

                    <input
                      type="number"
                      name="estimatedDays"
                      value={bidForm.estimatedDays}
                      onChange={handleBidFormChange}
                      min="1"
                      placeholder="Example: 7"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-black text-slate-800 mb-2">
                    Proposal Message
                  </label>

                  <textarea
                    name="message"
                    value={bidForm.message}
                    onChange={handleBidFormChange}
                    rows={6}
                    maxLength={2000}
                    placeholder="Write your proposal, experience, service plan, and why the client should choose you..."
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                    required
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {bidForm.message.length}/2000 characters
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeBidModal}
                    disabled={bidSubmitting}
                    className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={bidSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-cyan-800 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {bidSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Proposal
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Post;
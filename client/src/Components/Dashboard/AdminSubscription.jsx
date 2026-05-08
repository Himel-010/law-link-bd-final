"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiRefreshCw,
  FiLoader,
  FiSearch,
  FiX,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiEye,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "https://law-link-bd-api.vercel.app/api";
const PAYMENT_METHODS = ["bkash", "nogod"];

const initialForm = {
  userId: "",
  roleType: "client",
  planId: "",
  startDate: "",
  status: "",
  paymentStatus: "",
  transactionId: "",
  paymentMethod: "",
  notes: "",
};

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

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatCurrency = (value, currency = "BDT") => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getFeatureDisplayValue = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value ?? "-";
};

const getStatusBadgeClass = (status) => {
  if (status === "active") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  if (status === "pending") return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  if (status === "expired") return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  if (status === "cancelled") return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
};

const getPaymentBadgeClass = (status) => {
  if (status === "paid" || status === "free") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  if (status === "unpaid") return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  if (status === "failed") return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  if (status === "refunded") return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
};

const getRoleBadgeClass = (role) => {
  if (role === "lawyer") return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";
};

const UserAvatar = ({ user }) => (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-xs font-black tracking-wide text-white shadow-sm">
    {getInitials(user?.name)}
  </div>
);

const StatCard = ({ title, value, icon: Icon }) => (
  <motion.div
    className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          {value}
        </h3>
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
);

const AdminSubscriptionContent = () => {
  const [form, setForm] = useState(initialForm);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState("");

  const [plansByRole, setPlansByRole] = useState({ client: [], lawyer: [] });
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionFilters, setSubscriptionFilters] = useState({
    status: "",
    roleType: "",
    userId: "",
  });

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [markingExpired, setMarkingExpired] = useState(false);

  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const selectedUser = useMemo(() => {
    return users.find((user) => (user._id || user.id) === form.userId) || null;
  }, [users, form.userId]);

  const availablePlans = useMemo(() => {
    return plansByRole?.[form.roleType] || [];
  }, [plansByRole, form.roleType]);

  const selectedPlanDetails = useMemo(() => {
    return availablePlans.find((plan) => plan._id === form.planId) || null;
  }, [availablePlans, form.planId]);

  const isPaidPlan = useMemo(() => {
    return Number(selectedPlanDetails?.price || 0) > 0;
  }, [selectedPlanDetails]);

  const stats = useMemo(
    () => ({
      total: subscriptions.length,
      active: subscriptions.filter((sub) => sub.status === "active").length,
      pending: subscriptions.filter((sub) => sub.status === "pending").length,
      expired: subscriptions.filter((sub) => sub.status === "expired").length,
    }),
    [subscriptions]
  );

  const fetchPlans = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoadingPlans(true);
      setError("");

      const [clientRes, lawyerRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/plans?roleType=client`, {
          headers: authHeaders,
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/plans?roleType=lawyer`, {
          headers: authHeaders,
          withCredentials: true,
        }),
      ]);

      setPlansByRole({
        client: clientRes.data?.data || [],
        lawyer: lawyerRes.data?.data || [],
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load plans");
    } finally {
      setLoadingPlans(false);
    }
  }, [token, isAdmin, authHeaders]);

  const fetchUsers = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoadingUsers(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/users/dropdown`, {
        headers: authHeaders,
        params: {
          role: "all",
          search: userSearch.trim(),
          limit: 100,
        },
        withCredentials: true,
      });

      const dropdownUsers = (res.data?.data || []).filter((user) =>
        ["client", "lawyer"].includes(user.role)
      );

      setUsers(dropdownUsers);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [token, isAdmin, authHeaders, userSearch]);

  const fetchSubscriptions = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoadingSubscriptions(true);
      setError("");

      const params = { page: 1, limit: 100 };

      if (subscriptionFilters.status) params.status = subscriptionFilters.status;
      if (subscriptionFilters.roleType) params.roleType = subscriptionFilters.roleType;
      if (subscriptionFilters.userId) params.userId = subscriptionFilters.userId;

      const res = await axios.get(`${API_BASE_URL}/subscriptions/admin/all`, {
        headers: authHeaders,
        params,
        withCredentials: true,
      });

      setSubscriptions(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subscriptions");
    } finally {
      setLoadingSubscriptions(false);
    }
  }, [token, isAdmin, authHeaders, subscriptionFilters]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchPlans();
      fetchSubscriptions();
    }
  }, [token, isAdmin, fetchPlans, fetchSubscriptions]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    const timer = setTimeout(fetchUsers, 350);
    return () => clearTimeout(timer);
  }, [token, isAdmin, userSearch, fetchUsers]);

  const resetForm = () => {
    const firstClientPlan = plansByRole.client?.[0];

    setForm({
      ...initialForm,
      roleType: "client",
      planId: firstClientPlan?._id || "",
    });

    setEditingSubscriptionId("");
    setUserSearch("");
    setError("");
    setResponse(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (subscription) => {
    const user = subscription.user || {};
    const payment = subscription.payment || {};
    const roleType = subscription.roleType || user.role || "client";

    setEditingSubscriptionId(subscription._id);

    setForm({
      userId: user._id || user.id || subscription.user || "",
      roleType,
      planId: subscription.plan?._id || subscription.plan || "",
      startDate: toDateInputValue(subscription.startDate),
      status: subscription.status || "",
      paymentStatus: payment.status || "",
      transactionId: payment.transactionId || "",
      paymentMethod: payment.method || "",
      notes: subscription.adminNotes || "",
    });

    setError("");
    setResponse(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "userId") {
        const nextUser = users.find((user) => (user._id || user.id) === value);

        if (nextUser?.role && ["client", "lawyer"].includes(nextUser.role)) {
          updated.roleType = nextUser.role;

          const nextPlan = plansByRole?.[nextUser.role]?.[0] || null;
          updated.planId = nextPlan?._id || "";

          if (Number(nextPlan?.price || 0) === 0) {
            updated.paymentStatus = "free";
            updated.paymentMethod = "";
            updated.transactionId = "";
          } else {
            updated.paymentStatus = "";
          }
        }
      }

      if (name === "roleType") {
        const nextPlan = plansByRole?.[value]?.[0] || null;
        updated.planId = nextPlan?._id || "";

        if (Number(nextPlan?.price || 0) === 0) {
          updated.paymentStatus = "free";
          updated.paymentMethod = "";
          updated.transactionId = "";
        } else {
          updated.paymentStatus = "";
        }
      }

      if (name === "planId") {
        const nextPlan = plansByRole?.[updated.roleType]?.find(
          (plan) => plan._id === value
        );

        if (Number(nextPlan?.price || 0) === 0) {
          updated.paymentStatus = "free";
          updated.paymentMethod = "";
          updated.transactionId = "";
        } else {
          updated.paymentStatus = "";
        }
      }

      if (name === "status" && value === "active" && isPaidPlan) {
        updated.paymentStatus = "paid";
      }

      return updated;
    });

    setError("");
    setResponse(null);
  };

  const handleSubscriptionFilterChange = (e) => {
    const { name, value } = e.target;
    setSubscriptionFilters((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!token) return "Login token paoa jai nai. Please abar login koro.";
    if (!authUser) return "Current user data paoa jai nai. Please abar login koro.";
    if (!isAdmin) return "Only admin can manage subscriptions.";
    if (!form.userId) return "Please select a user";
    if (!form.roleType) return "roleType is required";
    if (!form.planId) return "Plan is required";
    if (!selectedPlanDetails) return "Selected plan not found";

    if (selectedUser && selectedUser.role !== form.roleType) {
      return "Selected plan role must match selected user role";
    }

    if (isPaidPlan) {
      const finalStatus = form.status || "pending";
      const finalPaymentStatus = form.paymentStatus || "unpaid";

      const needsPaymentInfo =
        finalPaymentStatus === "paid" || finalStatus === "active";

      if (needsPaymentInfo && !form.paymentMethod) {
        return "paymentMethod is required for paid/active subscription";
      }

      if (needsPaymentInfo && !form.transactionId.trim()) {
        return "transactionId is required for paid/active subscription";
      }

      if (form.paymentMethod && !PAYMENT_METHODS.includes(form.paymentMethod)) {
        return "Invalid payment method";
      }
    }

    return "";
  };

  const buildPayload = () => {
    const payload = {
      userId: form.userId,
      planId: form.planId,
    };

    if (form.startDate) payload.startDate = form.startDate;
    if (form.status) payload.status = form.status;
    if (form.notes.trim()) payload.notes = form.notes.trim();

    if (isPaidPlan) {
      if (form.paymentStatus) payload.paymentStatus = form.paymentStatus;
      if (form.paymentMethod) payload.paymentMethod = form.paymentMethod;
      if (form.transactionId.trim()) {
        payload.transactionId = form.transactionId.trim();
      }
    } else {
      payload.paymentStatus = "free";
      payload.paymentMethod = "";
      payload.transactionId = "";
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setResponse(null);

      const payload = buildPayload();

      const res = editingSubscriptionId
        ? await axios.patch(
            `${API_BASE_URL}/subscriptions/admin/${editingSubscriptionId}`,
            payload,
            {
              headers: authHeaders,
              withCredentials: true,
            }
          )
        : await axios.post(`${API_BASE_URL}/subscriptions/admin/create`, payload, {
            headers: authHeaders,
            withCredentials: true,
          });

      setResponse(res.data);
      closeModal();
      fetchSubscriptions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `Failed to ${editingSubscriptionId ? "update" : "create"} subscription`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subscription) => {
    const userName = subscription.user?.name || "this user";
    const confirmed = window.confirm(
      `Delete subscription for ${userName}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(subscription._id);
      setError("");
      setResponse(null);

      const res = await axios.delete(
        `${API_BASE_URL}/subscriptions/admin/${subscription._id}`,
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );

      setResponse(res.data);
      setSubscriptions((prev) =>
        prev.filter((item) => item._id !== subscription._id)
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete subscription");
    } finally {
      setDeletingId("");
    }
  };

  const handleMarkExpired = async () => {
    try {
      setMarkingExpired(true);
      setError("");
      setResponse(null);

      const res = await axios.patch(
        `${API_BASE_URL}/subscriptions/admin/mark-expired/run`,
        {},
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );

      setResponse(res.data);
      fetchSubscriptions();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to mark expired subscriptions");
    } finally {
      setMarkingExpired(false);
    }
  };

  const handleRefreshAll = () => {
    fetchPlans();
    fetchUsers();
    fetchSubscriptions();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-rose-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Please login again</h2>
          <p className="mt-2 text-sm text-slate-500">
            Login token paoa jai nai. Please abar login koro.
          </p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-amber-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">User data missing</h2>
          <p className="mt-2 text-sm text-slate-500">
            Current user data paoa jai nai. Please abar login koro.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-amber-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Access denied</h2>
          <p className="mt-2 text-sm text-slate-500">
            Only admins can manage subscriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="space-y-6">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-600">
                  Admin Dashboard
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  Subscription Management
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Create, update, view, delete and expire client/lawyer subscriptions.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
                >
                  <FiPlus />
                  Add Subscription
                </button>

                <button
                  type="button"
                  onClick={handleMarkExpired}
                  disabled={markingExpired}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  {markingExpired ? <FiLoader className="animate-spin" /> : <FiClock />}
                  Mark Expired
                </button>

                <button
                  type="button"
                  onClick={handleRefreshAll}
                  disabled={loadingPlans || loadingSubscriptions || loadingUsers}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 disabled:opacity-60"
                >
                  <FiRefreshCw
                    className={
                      loadingPlans || loadingSubscriptions || loadingUsers
                        ? "animate-spin"
                        : ""
                    }
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_170px_170px]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  name="userId"
                  value={subscriptionFilters.userId}
                  onChange={handleSubscriptionFilterChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user._id || user.id} value={user._id || user.id}>
                      {user.name} — {user.email} — {user.role}
                    </option>
                  ))}
                </select>
              </div>

              <select
                name="roleType"
                value={subscriptionFilters.roleType}
                onChange={handleSubscriptionFilterChange}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All Roles</option>
                <option value="client">Client</option>
                <option value="lawyer">Lawyer</option>
              </select>

              <select
                name="status"
                value={subscriptionFilters.status}
                onChange={handleSubscriptionFilterChange}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {response?.success && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {response?.message || "Operation completed successfully"}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Subscriptions" value={stats.total} icon={FiCreditCard} />
            <StatCard title="Active" value={stats.active} icon={FiCheckCircle} />
            <StatCard title="Pending" value={stats.pending} icon={FiClock} />
            <StatCard title="Expired" value={stats.expired} icon={FiAlertCircle} />
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5">
              <h3 className="text-xl font-black text-slate-900">
                All Subscriptions
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Subscription ID is hidden. Manage subscriptions by user, plan and status.
              </p>
            </div>

            {loadingSubscriptions ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700">
                  <FiLoader className="animate-spin text-cyan-600" />
                  Loading subscriptions...
                </div>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <FiCreditCard className="mb-3 text-4xl text-slate-400" />
                <p className="text-sm font-black text-slate-700">
                  No subscriptions found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1250px] w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-sm text-slate-500">
                      <th className="px-4">User</th>
                      <th className="px-4">Role</th>
                      <th className="px-4">Plan</th>
                      <th className="px-4">Price</th>
                      <th className="px-4">Status</th>
                      <th className="px-4">Payment</th>
                      <th className="px-4">Start</th>
                      <th className="px-4">End</th>
                      <th className="px-4">Method</th>
                      <th className="px-4">Txn ID</th>
                      <th className="px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {subscriptions.map((subscription) => {
                      const user = subscription.user || {};
                      const payment = subscription.payment || {};

                      return (
                        <tr
                          key={subscription._id}
                          className="bg-white shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 hover:shadow-md"
                        >
                          <td className="rounded-l-3xl px-4 py-4">
                            <div className="flex min-w-[230px] items-center gap-3">
                              <UserAvatar user={user} />
                              <div>
                                <p className="font-black text-slate-900">
                                  {user.name || "Unknown user"}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                  {user.email || "-"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {user.phone || "-"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getRoleBadgeClass(subscription.roleType)}`}>
                              {subscription.roleType || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="min-w-[180px]">
                              <p className="text-sm font-black text-slate-900">
                                {subscription.planName || "-"}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {subscription.planSlug || "-"}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm font-black text-slate-900">
                            {formatCurrency(subscription.price, subscription.currency || "BDT")}
                          </td>

                          <td className="px-4 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusBadgeClass(subscription.status)}`}>
                              {subscription.status || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getPaymentBadgeClass(payment.status)}`}>
                              {payment.status || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm font-bold text-slate-700">
                            {formatDate(subscription.startDate)}
                          </td>

                          <td className="px-4 py-4 text-sm font-bold text-slate-700">
                            {formatDate(subscription.endDate)}
                          </td>

                          <td className="px-4 py-4 text-sm font-semibold capitalize text-slate-600">
                            {payment.method || "-"}
                          </td>

                          <td className="px-4 py-4">
                            <p className="max-w-[160px] truncate text-xs font-semibold text-slate-500">
                              {payment.transactionId || "-"}
                            </p>
                          </td>

                          <td className="rounded-r-3xl px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedSubscription(subscription)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-100"
                              >
                                <FiEye />
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(subscription)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                              >
                                <FiEdit2 />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(subscription)}
                                disabled={deletingId === subscription._id}
                                className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                              >
                                {deletingId === subscription._id ? (
                                  <FiLoader className="animate-spin" />
                                ) : (
                                  <FiTrash2 />
                                )}
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur-xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {editingSubscriptionId ? "Update Subscription" : "Add Subscription"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a client/lawyer and assign the matching active plan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-2xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <h4 className="text-lg font-black text-slate-900">User & Plan</h4>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Search User
                      </label>

                      <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search by name, email or phone..."
                          disabled={Boolean(editingSubscriptionId)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none disabled:bg-slate-100 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                        />

                        {loadingUsers && (
                          <FiLoader className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-600" />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Select User *
                      </label>

                      <select
                        name="userId"
                        value={form.userId}
                        onChange={handleChange}
                        disabled={Boolean(editingSubscriptionId)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">Select user</option>

                        {users.map((user) => (
                          <option key={user._id || user.id} value={user._id || user.id}>
                            {user.name} — {user.email} — {user.role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Role Type
                      </label>

                      <select
                        name="roleType"
                        value={form.roleType}
                        onChange={handleChange}
                        disabled={Boolean(selectedUser) || Boolean(editingSubscriptionId)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="client">Client</option>
                        <option value="lawyer">Lawyer</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Plan *
                      </label>

                      <select
                        name="planId"
                        value={form.planId}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">Select plan</option>

                        {availablePlans.map((plan) => (
                          <option key={plan._id} value={plan._id}>
                            {plan.name} — {formatCurrency(plan.price, plan.currency)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <h4 className="text-lg font-black text-slate-900">
                    Subscription & Payment
                  </h4>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Start Date
                      </label>

                      <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Subscription Status
                      </label>

                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">Auto Select</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Payment Status
                      </label>

                      <select
                        name="paymentStatus"
                        value={form.paymentStatus}
                        onChange={handleChange}
                        disabled={!isPaidPlan}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">
                          {isPaidPlan ? "Auto Select" : "Free Plan Auto"}
                        </option>

                        {isPaidPlan && <option value="unpaid">Unpaid</option>}
                        {isPaidPlan && <option value="paid">Paid</option>}
                        {isPaidPlan && <option value="failed">Failed</option>}
                        {isPaidPlan && <option value="refunded">Refunded</option>}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Payment Method
                      </label>

                      <select
                        name="paymentMethod"
                        value={form.paymentMethod}
                        onChange={handleChange}
                        disabled={!isPaidPlan}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">
                          {isPaidPlan ? "Select method" : "Not needed"}
                        </option>

                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Transaction ID
                      </label>

                      <input
                        type="text"
                        name="transactionId"
                        value={form.transactionId}
                        onChange={handleChange}
                        placeholder="Required if paid or active"
                        disabled={!isPaidPlan}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Admin Notes
                      </label>

                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Optional admin note"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>
                  </div>
                </div>

                {selectedPlanDetails && (
                  <div className="rounded-[28px] border border-cyan-100 bg-cyan-50 p-5">
                    <h4 className="text-lg font-black text-slate-900">
                      Selected Plan Summary
                    </h4>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-bold text-slate-500">Plan</p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {selectedPlanDetails.name}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-bold text-slate-500">Price</p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {formatCurrency(selectedPlanDetails.price, selectedPlanDetails.currency)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-bold text-slate-500">Duration</p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {selectedPlanDetails.durationInDays} days
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !form.planId}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        {editingSubscriptionId ? "Update Subscription" : "Create Subscription"}
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
        {selectedSubscription && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur-xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Subscription Details
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Subscription ID hidden by design.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSubscription(null)}
                  className="rounded-2xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">User</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {selectedSubscription.user?.name || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedSubscription.user?.email || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Role</p>
                    <p className="mt-1 text-sm font-black capitalize text-slate-900">
                      {selectedSubscription.roleType || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Plan</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {selectedSubscription.planName || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedSubscription.planSlug || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Price</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatCurrency(
                        selectedSubscription.price,
                        selectedSubscription.currency || "BDT"
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Status</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusBadgeClass(selectedSubscription.status)}`}>
                      {selectedSubscription.status || "-"}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Payment</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${getPaymentBadgeClass(selectedSubscription.payment?.status)}`}>
                      {selectedSubscription.payment?.status || "-"}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Start Date</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatDate(selectedSubscription.startDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">End Date</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatDate(selectedSubscription.endDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Method</p>
                    <p className="mt-1 text-sm font-black capitalize text-slate-900">
                      {selectedSubscription.payment?.method || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Transaction ID</p>
                    <p className="mt-1 break-all text-sm font-black text-slate-900">
                      {selectedSubscription.payment?.transactionId || "-"}
                    </p>
                  </div>
                </div>

                {selectedSubscription.adminNotes && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">Admin Notes</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {selectedSubscription.adminNotes}
                    </p>
                  </div>
                )}

                {selectedSubscription.features &&
                  Object.keys(selectedSubscription.features).length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="min-w-[600px] w-full">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3">Feature Key</th>
                            <th className="px-4 py-3">Value</th>
                          </tr>
                        </thead>

                        <tbody>
                          {Object.entries(selectedSubscription.features).map(
                            ([key, value]) => (
                              <tr key={key} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-4 py-3 text-sm font-bold text-slate-800">
                                  {key}
                                </td>
                                <td className="px-4 py-3 text-sm font-black text-slate-900">
                                  {getFeatureDisplayValue(value)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSubscriptionContent;
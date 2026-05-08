import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiX,
  FiPackage,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiSearch,
  FiLayers,
  FiUsers,
  FiBriefcase,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:4000/api";

const createEmptyFeature = () => ({
  key: "",
  label: "",
  description: "",
  valueType: "boolean",
  value: false,
  enabled: true,
  sortOrder: 0,
});

const initialForm = {
  name: "",
  slug: "",
  roleType: "client",
  description: "",
  price: 0,
  durationInDays: 30,
  currency: "BDT",
  isActive: true,
  sortOrder: 0,
  features: [],
};

const clientFeatureTemplates = [
  {
    key: "case_post_limit",
    label: "Case Post Limit",
    valueType: "number",
    value: 5,
    enabled: true,
  },
  {
    key: "shortlist_limit",
    label: "Shortlist Limit",
    valueType: "number",
    value: 10,
    enabled: true,
  },
  {
    key: "priority_access",
    label: "Priority Access",
    valueType: "boolean",
    value: false,
    enabled: true,
  },
];

const lawyerFeatureTemplates = [
  {
    key: "proposal_limit",
    label: "Proposal Limit",
    valueType: "number",
    value: 50,
    enabled: true,
  },
  {
    key: "proposal_credits",
    label: "Proposal Credits",
    valueType: "number",
    value: 20,
    enabled: true,
  },
  {
    key: "profile_boost",
    label: "Profile Boost",
    valueType: "boolean",
    value: true,
    enabled: true,
  },
  {
    key: "paid_consultation",
    label: "Paid Consultation",
    valueType: "boolean",
    value: true,
    enabled: true,
  },
];

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

const normalizeSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeFeatureKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const formatFeatureValue = (feature) => {
  if (feature.valueType === "boolean") {
    return feature.value ? "Yes" : "No";
  }

  if (feature.valueType === "number") {
    return Number(feature.value || 0);
  }

  return feature.value || "-";
};

const getRoleBadgeClass = (roleType) => {
  if (roleType === "lawyer") {
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  }

  return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";
};

const getStatusBadgeClass = (isActive) => {
  if (isActive) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
};

const StatCard = ({ title, value, icon: Icon }) => (
  <motion.div
    className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
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

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-100">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
);

const AdminPlanContent = () => {
  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingPlanId, setEditingPlanId] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const filteredPlans = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return plans;

    return plans.filter((plan) => {
      const featureMatch = Array.isArray(plan.features)
        ? plan.features.some((feature) => {
            return (
              feature.key?.toLowerCase().includes(q) ||
              feature.label?.toLowerCase().includes(q) ||
              feature.description?.toLowerCase().includes(q)
            );
          })
        : false;

      return (
        plan.name?.toLowerCase().includes(q) ||
        plan.slug?.toLowerCase().includes(q) ||
        plan.roleType?.toLowerCase().includes(q) ||
        plan.description?.toLowerCase().includes(q) ||
        featureMatch
      );
    });
  }, [plans, searchTerm]);

  const stats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((plan) => plan.isActive).length,
      client: plans.filter((plan) => plan.roleType === "client").length,
      lawyer: plans.filter((plan) => plan.roleType === "lawyer").length,
    }),
    [plans]
  );

  const fetchPlans = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoadingPlans(true);
      setError("");

      const params = {};
      if (roleFilter) params.roleType = roleFilter;
      if (activeFilter !== "") params.isActive = activeFilter;

      const res = await axios.get(`${API_BASE_URL}/plans/admin/all/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      setPlans(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load plans");
    } finally {
      setLoadingPlans(false);
    }
  }, [token, isAdmin, roleFilter, activeFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans, reloadKey]);

  const triggerReload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setEditingPlanId("");
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
    setError("");
    setResponse(null);
  }, [resetForm]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setError("");
    setResponse(null);
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((plan) => {
    setEditingPlanId(plan._id);

    const normalizedFeatures = Array.isArray(plan.features)
      ? plan.features.map((feature, index) => ({
          key: feature.key || "",
          label: feature.label || "",
          description: feature.description || "",
          valueType: feature.valueType || "boolean",
          value:
            feature.valueType === "boolean"
              ? Boolean(feature.value)
              : feature.valueType === "number"
              ? Number(feature.value || 0)
              : feature.value || "",
          enabled:
            feature.enabled === undefined ? true : Boolean(feature.enabled),
          sortOrder: feature.sortOrder ?? index,
        }))
      : [];

    setForm({
      name: plan.name || "",
      slug: plan.slug || "",
      roleType: plan.roleType || "client",
      description: plan.description || "",
      price: plan.price ?? 0,
      durationInDays: plan.durationInDays ?? 30,
      currency: plan.currency || "BDT",
      isActive: Boolean(plan.isActive),
      sortOrder: plan.sortOrder ?? 0,
      features: normalizedFeatures,
    });

    setError("");
    setResponse(null);
    setIsModalOpen(true);
  }, []);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      setForm((prev) => {
        let updatedValue = type === "checkbox" ? checked : value;

        if (["price", "durationInDays", "sortOrder"].includes(name)) {
          updatedValue = value === "" ? "" : Number(value);
        }

        const updated = {
          ...prev,
          [name]: updatedValue,
        };

        if (name === "name" && !editingPlanId) {
          updated.slug = normalizeSlug(value);
        }

        if (name === "slug") {
          updated.slug = normalizeSlug(value);
        }

        return updated;
      });

      setError("");
      setResponse(null);
    },
    [editingPlanId]
  );

  const addFeature = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        {
          ...createEmptyFeature(),
          sortOrder: prev.features.length,
        },
      ],
    }));

    setError("");
    setResponse(null);
  }, []);

  const addRoleTemplates = useCallback(() => {
    setForm((prev) => {
      const templates =
        prev.roleType === "lawyer"
          ? lawyerFeatureTemplates
          : clientFeatureTemplates;

      const existingKeys = new Set(prev.features.map((feature) => feature.key));

      const newFeatures = templates
        .filter((feature) => !existingKeys.has(feature.key))
        .map((feature, index) => ({
          ...feature,
          description: "",
          sortOrder: prev.features.length + index,
        }));

      return {
        ...prev,
        features: [...prev.features, ...newFeatures],
      };
    });

    setError("");
    setResponse(null);
  }, []);

  const removeFeature = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter(
        (_, featureIndex) => featureIndex !== index
      ),
    }));

    setError("");
    setResponse(null);
  }, []);

  const updateFeature = useCallback((index, field, value) => {
    setForm((prev) => {
      const updatedFeatures = prev.features.map((feature, featureIndex) => {
        if (featureIndex !== index) return feature;

        const updatedFeature = {
          ...feature,
          [field]: value,
        };

        if (field === "label" && !feature.key) {
          updatedFeature.key = normalizeFeatureKey(value);
        }

        if (field === "key") {
          updatedFeature.key = normalizeFeatureKey(value);
        }

        if (field === "valueType") {
          if (value === "boolean") updatedFeature.value = false;
          if (value === "number") updatedFeature.value = 0;
          if (value === "string") updatedFeature.value = "";
        }

        return updatedFeature;
      });

      return {
        ...prev,
        features: updatedFeatures,
      };
    });

    setError("");
    setResponse(null);
  }, []);

  const validateForm = useCallback(() => {
    if (!token) return "Login token paoa jai nai. Please abar login koro.";
    if (!authUser) {
      return "Current user data paoa jai nai. Please abar login koro.";
    }
    if (!isAdmin) return "Only admin can manage plans.";
    if (!form.name.trim()) return "Plan name is required";
    if (!form.slug.trim()) return "Plan slug is required";
    if (!form.roleType) return "roleType is required";

    if (!["client", "lawyer"].includes(form.roleType)) {
      return "roleType must be client or lawyer";
    }

    if (form.price === "" || Number(form.price) < 0) {
      return "Valid price is required";
    }

    if (form.durationInDays === "" || Number(form.durationInDays) < 1) {
      return "durationInDays must be at least 1";
    }

    const keys = new Set();

    for (let i = 0; i < form.features.length; i += 1) {
      const feature = form.features[i];
      const key = normalizeFeatureKey(feature.key || feature.label);

      if (!key) return `Feature ${i + 1} key or label is required`;
      if (!feature.label.trim()) return `Feature ${i + 1} label is required`;

      if (keys.has(key)) {
        return `Duplicate feature key found: ${key}`;
      }

      keys.add(key);

      if (!["number", "boolean", "string"].includes(feature.valueType)) {
        return `Feature "${feature.label}" has invalid value type`;
      }

      if (feature.valueType === "number") {
        const numberValue = Number(feature.value);

        if (Number.isNaN(numberValue)) {
          return `Feature "${feature.label}" value must be a number`;
        }

        if (numberValue < 0) {
          return `Feature "${feature.label}" value cannot be negative`;
        }
      }
    }

    return "";
  }, [token, authUser, isAdmin, form]);

  const buildPayload = useCallback(() => {
    return {
      name: form.name.trim(),
      slug: normalizeSlug(form.slug || form.name),
      roleType: form.roleType,
      description: form.description.trim(),
      price: Number(form.price),
      durationInDays: Number(form.durationInDays),
      currency: form.currency.trim().toUpperCase() || "BDT",
      isActive: Boolean(form.isActive),
      sortOrder: Number(form.sortOrder || 0),
      features: form.features.map((feature, index) => {
        const valueType = feature.valueType || "boolean";

        let value = feature.value;

        if (valueType === "number") value = Number(value || 0);
        if (valueType === "boolean") value = Boolean(value);
        if (valueType === "string") value = String(value || "").trim();

        return {
          key: normalizeFeatureKey(feature.key || feature.label),
          label: feature.label.trim(),
          description: String(feature.description || "").trim(),
          valueType,
          value,
          enabled: Boolean(feature.enabled),
          sortOrder: Number(feature.sortOrder ?? index),
        };
      }),
    };
  }, [form]);

  const handleSubmit = useCallback(
    async (e) => {
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

        let res;

        if (editingPlanId) {
          res = await axios.patch(
            `${API_BASE_URL}/plans/${editingPlanId}`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else {
          res = await axios.post(`${API_BASE_URL}/plans`, payload, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }

        setResponse(res.data);
        closeModal();
        triggerReload();
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to save plan");
      } finally {
        setSubmitting(false);
      }
    },
    [
      validateForm,
      buildPayload,
      editingPlanId,
      token,
      closeModal,
      triggerReload,
    ]
  );

  const handleDelete = useCallback(
    async (planId) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this plan?"
      );
      if (!confirmed) return;

      try {
        setDeletingId(planId);
        setError("");
        setResponse(null);

        const res = await axios.delete(`${API_BASE_URL}/plans/${planId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setResponse(res.data);

        if (editingPlanId === planId) {
          closeModal();
        }

        triggerReload();
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to delete plan");
      } finally {
        setDeletingId("");
      }
    },
    [token, editingPlanId, closeModal, triggerReload]
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-rose-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">
            Please login again
          </h2>
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
          <h2 className="text-xl font-black text-slate-900">
            User data missing
          </h2>
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
            Only admins can manage plans.
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
                  Plan Management
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage client and lawyer plans in a clear table with properly
                  organized feature columns.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
                >
                  <FiPlus />
                  Create Plan
                </button>

                <button
                  type="button"
                  onClick={triggerReload}
                  disabled={loadingPlans}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-60"
                >
                  <FiRefreshCw className={loadingPlans ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_170px_170px]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by plan name, slug, role or feature..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All Roles</option>
                <option value="client">Client</option>
                <option value="lawyer">Lawyer</option>
              </select>

              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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
            <StatCard title="Total Plans" value={stats.total} icon={FiLayers} />
            <StatCard title="Active Plans" value={stats.active} icon={FiCheckCircle} />
            <StatCard title="Client Plans" value={stats.client} icon={FiUsers} />
            <StatCard title="Lawyer Plans" value={stats.lawyer} icon={FiBriefcase} />
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  All Plans
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Plan information and feature details are organized in table
                  columns.
                </p>
              </div>
            </div>

            {loadingPlans ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700">
                  <FiLoader className="animate-spin text-cyan-600" />
                  Loading plans...
                </div>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <FiPackage className="mb-3 text-4xl text-slate-400" />
                <p className="text-sm font-black text-slate-700">
                  No plans found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Create a new plan or change your filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-sm text-slate-500">
                      <th className="px-4">Plan</th>
                      <th className="px-4">Role</th>
                      <th className="px-4">Price</th>
                      <th className="px-4">Duration</th>
                      <th className="px-4">Status</th>
                      <th className="px-4">Sort</th>
                      <th className="px-4">Features</th>
                      <th className="px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPlans.map((plan) => {
                      const sortedFeatures = Array.isArray(plan.features)
                        ? plan.features
                            .slice()
                            .sort(
                              (a, b) =>
                                Number(a.sortOrder || 0) -
                                Number(b.sortOrder || 0)
                            )
                        : [];

                      return (
                        <tr
                          key={plan._id}
                          className="bg-white shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 hover:shadow-md"
                        >
                          <td className="rounded-l-3xl px-4 py-4 align-top">
                            <div className="min-w-[210px]">
                              <p className="font-black text-slate-900">
                                {plan.name}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {plan.slug}
                              </p>

                              {plan.description && (
                                <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                                  {plan.description}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getRoleBadgeClass(
                                plan.roleType
                              )}`}
                            >
                              {plan.roleType}
                            </span>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-sm font-black text-slate-900">
                              {plan.currency || "BDT"} {plan.price}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-sm font-bold text-slate-700">
                              {plan.durationInDays} days
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(
                                plan.isActive
                              )}`}
                            >
                              {plan.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                              {plan.sortOrder ?? 0}
                            </span>
                          </td>

                          <td className="px-4 py-4 align-top">
                            {sortedFeatures.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                                <p className="text-xs font-bold text-slate-500">
                                  No features
                                </p>
                              </div>
                            ) : (
                              <div className="min-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                <table className="w-full table-fixed">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                                      <th className="w-[28%] px-3 py-2">
                                        Feature
                                      </th>
                                      <th className="w-[24%] px-3 py-2">
                                        Key
                                      </th>
                                      <th className="w-[14%] px-3 py-2">
                                        Type
                                      </th>
                                      <th className="w-[18%] px-3 py-2">
                                        Value
                                      </th>
                                      <th className="w-[16%] px-3 py-2">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {sortedFeatures.map((feature, index) => (
                                      <tr
                                        key={`${feature.key}-${index}`}
                                        className="border-b border-slate-200 last:border-b-0"
                                      >
                                        <td className="px-3 py-2 align-top">
                                          <p className="text-xs font-black text-slate-800">
                                            {feature.label || "-"}
                                          </p>

                                          {feature.description && (
                                            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                                              {feature.description}
                                            </p>
                                          )}
                                        </td>

                                        <td className="px-3 py-2 align-top">
                                          <p className="break-words text-[11px] font-semibold text-slate-500">
                                            {feature.key || "-"}
                                          </p>
                                        </td>

                                        <td className="px-3 py-2 align-top">
                                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black capitalize text-slate-600 ring-1 ring-slate-200">
                                            {feature.valueType || "boolean"}
                                          </span>
                                        </td>

                                        <td className="px-3 py-2 align-top">
                                          <p className="text-xs font-black text-slate-900">
                                            {formatFeatureValue(feature)}
                                          </p>
                                        </td>

                                        <td className="px-3 py-2 align-top">
                                          <span
                                            className={`rounded-full px-2 py-1 text-[10px] font-black ${
                                              feature.enabled
                                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                                : "bg-slate-200 text-slate-500"
                                            }`}
                                          >
                                            {feature.enabled ? "On" : "Off"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>

                          <td className="rounded-r-3xl px-4 py-4 align-top">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(plan)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
                              >
                                <FiEdit2 className="h-4 w-4" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(plan._id)}
                                disabled={deletingId === plan._id}
                                className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                              >
                                {deletingId === plan._id ? (
                                  <FiLoader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FiTrash2 className="h-4 w-4" />
                                )}
                                {deletingId === plan._id
                                  ? "Deleting..."
                                  : "Delete"}
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
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur-xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {editingPlanId ? "Update Plan" : "Create Plan"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage plan details, pricing, duration, status and dynamic
                    features.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                    <FiAlertCircle />
                    {error}
                  </div>
                )}

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="mb-5">
                    <h4 className="text-lg font-black text-slate-900">
                      Basic Information
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Set the plan name, role type, price and visibility.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Plan Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Client Premium"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Slug *
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={form.slug}
                        onChange={handleChange}
                        placeholder="e.g. client-premium"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Role Type *
                      </label>
                      <select
                        name="roleType"
                        value={form.roleType}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="client">Client</option>
                        <option value="lawyer">Lawyer</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Currency
                      </label>
                      <input
                        type="text"
                        name="currency"
                        value={form.currency}
                        onChange={handleChange}
                        placeholder="BDT"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Price *
                      </label>
                      <input
                        type="number"
                        name="price"
                        min="0"
                        value={form.price}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Duration Days *
                      </label>
                      <input
                        type="number"
                        name="durationInDays"
                        min="1"
                        value={form.durationInDays}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        name="sortOrder"
                        value={form.sortOrder}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 xl:mt-7">
                      <input
                        id="isActive"
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-sm font-bold text-slate-700">
                        Active Plan
                      </span>
                    </label>

                    <div className="md:col-span-2 xl:col-span-4">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Plan description"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        Dynamic Features
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Add and organize features with correct columns.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={addRoleTemplates}
                        className="inline-flex items-center gap-2 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-700 hover:bg-cyan-100"
                      >
                        <FiPlus />
                        Add {form.roleType} Templates
                      </button>

                      <button
                        type="button"
                        onClick={addFeature}
                        className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700"
                      >
                        <FiPlus />
                        Add Feature
                      </button>
                    </div>
                  </div>

                  {form.features.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center">
                      <FiPackage className="mx-auto mb-3 text-4xl text-slate-400" />
                      <p className="text-sm font-black text-slate-700">
                        No features added yet
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Click Add Feature or Add {form.roleType} Templates.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white">
                      <table className="min-w-[1000px] w-full table-fixed">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="w-[18%] px-4 py-3">Label</th>
                            <th className="w-[18%] px-4 py-3">Key</th>
                            <th className="w-[14%] px-4 py-3">Type</th>
                            <th className="w-[18%] px-4 py-3">Value</th>
                            <th className="w-[12%] px-4 py-3">Sort</th>
                            <th className="w-[12%] px-4 py-3">Enabled</th>
                            <th className="w-[8%] px-4 py-3 text-right">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {form.features.map((feature, index) => (
                            <tr
                              key={index}
                              className="border-b border-slate-200 last:border-b-0"
                            >
                              <td className="px-4 py-3 align-top">
                                <input
                                  type="text"
                                  value={feature.label}
                                  onChange={(e) =>
                                    updateFeature(
                                      index,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Case Post Limit"
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:bg-white"
                                />
                              </td>

                              <td className="px-4 py-3 align-top">
                                <input
                                  type="text"
                                  value={feature.key}
                                  onChange={(e) =>
                                    updateFeature(index, "key", e.target.value)
                                  }
                                  placeholder="case_post_limit"
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:bg-white"
                                />
                              </td>

                              <td className="px-4 py-3 align-top">
                                <select
                                  value={feature.valueType}
                                  onChange={(e) =>
                                    updateFeature(
                                      index,
                                      "valueType",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:bg-white"
                                >
                                  <option value="boolean">Boolean</option>
                                  <option value="number">Number</option>
                                  <option value="string">String</option>
                                </select>
                              </td>

                              <td className="px-4 py-3 align-top">
                                {feature.valueType === "boolean" ? (
                                  <label className="flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(feature.value)}
                                      onChange={(e) =>
                                        updateFeature(
                                          index,
                                          "value",
                                          e.target.checked
                                        )
                                      }
                                    />
                                    <span className="text-sm font-bold text-slate-700">
                                      {feature.value ? "Yes" : "No"}
                                    </span>
                                  </label>
                                ) : feature.valueType === "number" ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={feature.value}
                                    onChange={(e) =>
                                      updateFeature(
                                        index,
                                        "value",
                                        e.target.value === ""
                                          ? ""
                                          : Number(e.target.value)
                                      )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:bg-white"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={feature.value}
                                    onChange={(e) =>
                                      updateFeature(
                                        index,
                                        "value",
                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:bg-white"
                                  />
                                )}
                              </td>

                              <td className="px-4 py-3 align-top">
                                <input
                                  type="number"
                                  value={feature.sortOrder}
                                  onChange={(e) =>
                                    updateFeature(
                                      index,
                                      "sortOrder",
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                    )
                                  }
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:bg-white"
                                />
                              </td>

                              <td className="px-4 py-3 align-top">
                                <label className="flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(feature.enabled)}
                                    onChange={(e) =>
                                      updateFeature(
                                        index,
                                        "enabled",
                                        e.target.checked
                                      )
                                    }
                                  />
                                  <span className="text-sm font-bold text-slate-700">
                                    On
                                  </span>
                                </label>
                              </td>

                              <td className="px-4 py-3 text-right align-top">
                                <button
                                  type="button"
                                  onClick={() => removeFeature(index)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100"
                                >
                                  <FiTrash2 />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin" />
                        {editingPlanId ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        {editingPlanId ? "Update Plan" : "Create Plan"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminPlanContent;
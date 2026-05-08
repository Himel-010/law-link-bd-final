"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiClock,
  FiBriefcase,
  FiUser,
  FiUsers,
  FiMessageCircle,
  FiArrowRight,
  FiLoader,
  FiAlertCircle,
  FiX,
  FiCreditCard,
  FiShield,
} from "react-icons/fi";
import { FaCrown, FaGem, FaStar, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import i18n from "../../json/plans.json";

const API_BASE_URL = "http://localhost:4000/api";

const PAYMENT_METHODS = ["bkash", "nogod"];

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

const getVisibleFeatures = (features = []) => {
  if (!Array.isArray(features)) return [];

  return features
    .filter((feature) => {
      if (!feature) return false;
      if (feature.enabled === false) return false;

      if (feature.valueType === "boolean") {
        return Boolean(feature.value);
      }

      if (feature.valueType === "number") {
        return Number(feature.value) > 0;
      }

      if (feature.valueType === "string") {
        return String(feature.value || "").trim() !== "";
      }

      return false;
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
};

const formatFeatureValue = (feature, t) => {
  if (!feature) return "-";

  if (feature.valueType === "boolean") {
    return feature.value ? t.card.yes : t.card.no;
  }

  if (feature.valueType === "number") {
    const numberValue = Number(feature.value || 0);

    if (numberValue === 999999 || numberValue === 9999) {
      return t.card.unlimited;
    }

    return numberValue.toLocaleString();
  }

  return feature.value || "-";
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  if (amount === 0) return null;

  return `৳${amount.toLocaleString("en-BD")}`;
};

const getPlanTone = (plan, index) => {
  const price = Number(plan.price || 0);

  if (price === 0) {
    return {
      label: "Starter",
      icon: FaStar,
      ring: "border-slate-200",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      glow: "from-slate-100 to-white",
      button: "bg-slate-900 hover:bg-slate-800",
      crown: "bg-slate-900 text-white",
    };
  }

  if (index === 1 || price >= 1000) {
    return {
      label: "Popular",
      icon: FaCrown,
      ring: "border-amber-300",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      glow: "from-amber-100 via-yellow-50 to-white",
      button:
        "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700",
      crown: "bg-gradient-to-br from-amber-400 to-yellow-600 text-white",
    };
  }

  return {
    label: "Premium",
    icon: FaGem,
    ring: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    glow: "from-yellow-100 via-amber-50 to-white",
    button:
      "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700",
    crown: "bg-gradient-to-br from-yellow-400 to-amber-600 text-white",
  };
};

const RoleSelectionModal = ({ open, onSelectRole, t }) => {
  if (!open) return null;

  const roleOptions = [
    {
      id: "client",
      title: t.roleModal.client.title,
      description: t.roleModal.client.description,
      button: t.roleModal.client.button,
      icon: FiUser,
      iconClass: "from-amber-400 to-yellow-600",
    },
    {
      id: "lawyer",
      title: t.roleModal.lawyer.title,
      description: t.roleModal.lawyer.description,
      button: t.roleModal.lawyer.button,
      icon: FiBriefcase,
      iconClass: "from-slate-900 to-slate-700",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 pt-20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.25 }}
        >
          <div className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white px-6 py-8 text-center sm:px-10">
            <div className="absolute left-0 top-0 h-28 w-28 rounded-br-full bg-amber-100/70" />
            <div className="absolute bottom-0 right-0 h-32 w-32 rounded-tl-full bg-yellow-100/70" />

            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-xl shadow-amber-500/20">
                <FaCrown className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {t.roleModal.title}
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                {t.roleModal.description}
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {roleOptions.map((role) => {
              const Icon = role.icon;

              return (
                <motion.button
                  key={role.id}
                  type="button"
                  onClick={() => onSelectRole(role.id)}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-50/30 hover:shadow-[0_22px_60px_rgba(245,158,11,0.16)]"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${role.iconClass} text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-black text-slate-950">
                    {role.title}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                    {role.description}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-amber-700">
                    {role.button}
                    <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const PaymentModal = ({
  open,
  plan,
  subscription,
  submitting,
  error,
  message,
  paymentForm,
  setPaymentForm,
  onClose,
  onSubmitPayment,
}) => {
  if (!open || !plan || !subscription) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 pt-20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-6 py-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black text-amber-700">
                <FiCreditCard className="h-4 w-4" />
                Payment Required
              </div>

              <h2 className="text-2xl font-black text-slate-900">
                Complete Payment
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Submit your transaction details for admin verification.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full bg-white p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-md">
                  <FaCrown />
                </div>

                <div>
                  <p className="font-black text-slate-900">{plan.name}</p>
                  <p className="mt-1 text-slate-600">
                    Amount:{" "}
                    <span className="font-black text-slate-900">
                      ৳{Number(plan.price || 0).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              <p className="mt-4 text-slate-600">
                Subscription ID:{" "}
                <span className="break-all font-semibold text-slate-900">
                  {subscription._id}
                </span>
              </p>
            </div>

            <form onSubmit={onSubmitPayment} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Payment Method *
                </label>

                <select
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      method: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Transaction ID *
                </label>

                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      transactionId: e.target.value,
                    }))
                  }
                  placeholder="Enter bKash/Nogod transaction ID"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Sender Number
                </label>

                <input
                  type="text"
                  value={paymentForm.senderNumber}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      senderNumber: e.target.value,
                    }))
                  }
                  placeholder="Example: 017xxxxxxxx"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Note
                </label>

                <textarea
                  rows={3}
                  value={paymentForm.note}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Optional note"
                  className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-600 hover:to-yellow-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Submitting Payment...
                  </>
                ) : (
                  <>
                    Submit Payment
                    <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const PlanCard = ({ plan, index, t, onChoose, choosingPlanId }) => {
  const visibleFeatures = getVisibleFeatures(plan.features);

  const isFree = Number(plan.price || 0) === 0;
  const isLawyer = plan.roleType === "lawyer";
  const isChoosing = choosingPlanId === plan._id;
  const tone = getPlanTone(plan, index);
  const ToneIcon = tone.icon;

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-[28px] border ${tone.ring} bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(245,158,11,0.18)]`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <div
        className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-br ${tone.glow}`}
      />

      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-200/30 blur-2xl transition group-hover:bg-amber-300/40" />

      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone.crown} shadow-lg`}
              >
                <ToneIcon className="h-5 w-5" />
              </div>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tone.badge}`}
              >
                {tone.label}
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-slate-950">
              {plan.name}
            </h3>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
              {plan.description || t.card.defaultDescription}
            </p>
          </div>

          {plan.isActive && (
            <div className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {t.card.active}
            </div>
          )}
        </div>

        <div className="mb-6 rounded-3xl border border-amber-100 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-950">
              {isFree ? t.card.free : formatCurrency(plan.price)}
            </span>

            {!isFree && (
              <span className="mb-1 text-sm font-medium text-slate-500">
                / {plan.durationInDays} {t.card.days}
              </span>
            )}
          </div>

          {isFree && (
            <p className="mt-1 text-sm text-slate-500">
              {plan.durationInDays} {t.card.days}
            </p>
          )}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-slate-500">
              {t.card.duration}
            </p>

            <div className="flex items-center gap-2 font-bold text-slate-800">
              <FiClock className="h-4 w-4 text-amber-600" />
              {plan.durationInDays} {t.card.days}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-slate-500">
              {t.card.role}
            </p>

            <div className="flex items-center gap-2 font-bold capitalize text-slate-800">
              {isLawyer ? (
                <FiBriefcase className="h-4 w-4 text-amber-600" />
              ) : (
                <FiUsers className="h-4 w-4 text-amber-600" />
              )}
              {plan.roleType}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800">
              {t.card.includedFeatures}
            </h4>

            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              {visibleFeatures.length} {t.card.items}
            </span>
          </div>

          {visibleFeatures.length > 0 ? (
            <div className="space-y-2">
              {visibleFeatures.slice(0, 6).map((feature, featureIndex) => (
                <div
                  key={`${feature.key}-${featureIndex}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2 text-slate-700">
                    <FaCheckCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="truncate text-sm font-medium">
                      {feature.label || feature.key}
                    </span>
                  </div>

                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-900">
                    {formatFeatureValue(feature, t)}
                  </span>
                </div>
              ))}

              {visibleFeatures.length > 6 && (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 px-3 py-3 text-center text-sm font-semibold text-amber-700">
                  {t.card.moreFeaturesPrefix}
                  {visibleFeatures.length - 6} {t.card.moreFeaturesSuffix}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              {t.card.noFeatures}
            </div>
          )}
        </div>

        <motion.button
          type="button"
          onClick={() => onChoose(plan)}
          disabled={isChoosing}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-slate-400 ${tone.button}`}
          whileHover={{ scale: isChoosing ? 1 : 1.02 }}
          whileTap={{ scale: isChoosing ? 1 : 0.97 }}
        >
          {isChoosing ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {t.card.choosePackage}
              <FiArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

const PlansPage = () => {
  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const reduxUser = useSelector((state) => state.user.currentUser);
  const t = i18n[currentLanguage]?.plans || i18n.en.plans;

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [selectedRole, setSelectedRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(true);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(false);
  const [choosingPlanId, setChoosingPlanId] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [createdSubscription, setCreatedSubscription] = useState(null);

  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    method: "",
    transactionId: "",
    senderNumber: "",
    note: "",
  });

  useEffect(() => {
    const auth = getStoredAuth();

    if (reduxUser) {
      setAuthUser(reduxUser);
      setToken(auth.token);
      return;
    }

    setAuthUser(auth.user);
    setToken(auth.token);
  }, [reduxUser]);

  const selectedRoleLabel = useMemo(() => {
    if (selectedRole === "lawyer") return t.header.lawyerBadge;
    if (selectedRole === "client") return t.header.clientBadge;
    return "Subscription Packages";
  }, [selectedRole, t]);

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fetchPlans = useCallback(async () => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await axios.get(`${API_BASE_URL}/plans`, {
        params: {
          roleType: selectedRole,
        },
      });

      setPlans(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t.states.errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, t]);

  useEffect(() => {
    if (selectedRole) {
      fetchPlans();
    }
  }, [selectedRole, fetchPlans]);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setPlans([]);
    setError("");
    setMessage("");
    setShowRoleModal(false);
  };

  const openRoleModal = () => {
    setShowRoleModal(true);
  };

  const handleChoosePlan = async (plan) => {
    try {
      setError("");
      setMessage("");
      setPaymentError("");
      setPaymentMessage("");

      if (!token || !authUser) {
        setError("Please login first to purchase a subscription.");
        return;
      }

      if (!["client", "lawyer"].includes(authUser.role)) {
        setError("Only client or lawyer accounts can purchase subscriptions.");
        return;
      }

      if (authUser.role !== plan.roleType) {
        setError(
          `You selected a ${plan.roleType} package, but you are logged in as ${authUser.role}. Please login with the correct account type.`
        );
        return;
      }

      setChoosingPlanId(plan._id);

      const res = await axios.post(
        `${API_BASE_URL}/subscriptions/choose-plan`,
        {
          planId: plan._id,
        },
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );

      const subscription = res.data?.data;

      if (!subscription) {
        throw new Error("Subscription was not created");
      }

      const paymentRequired = res.data?.nextStep?.paymentRequired;

      if (!paymentRequired) {
        setMessage(res.data?.message || "Subscription activated successfully.");

        const storedAuth = getStoredAuth();

        if (storedAuth.user) {
          const updatedUser = {
            ...storedAuth.user,
            subscriptionStatus: "active",
            currentSubscription: subscription._id,
          };

          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
          setAuthUser(updatedUser);
        }

        return;
      }

      setCreatedSubscription(subscription);
      setSelectedPlanForPayment(plan);
      setPaymentModalOpen(true);
      setPaymentForm({
        method: "",
        transactionId: "",
        senderNumber: "",
        note: "",
      });
    } catch (err) {
      const existingSubscription = err?.response?.data?.data;
      const nextStep = err?.response?.data?.nextStep;

      if (existingSubscription && nextStep?.paymentRequired) {
        setCreatedSubscription(existingSubscription);
        setSelectedPlanForPayment(plan);
        setPaymentModalOpen(true);
        setPaymentForm({
          method: "",
          transactionId: "",
          senderNumber: "",
          note: "",
        });
        setPaymentError(
          err?.response?.data?.message ||
            "Pending subscription found. Please submit payment."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to choose plan"
        );
      }
    } finally {
      setChoosingPlanId("");
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    try {
      setPaymentSubmitting(true);
      setPaymentError("");
      setPaymentMessage("");

      if (!createdSubscription?._id) {
        setPaymentError("Subscription ID not found.");
        return;
      }

      if (!paymentForm.method) {
        setPaymentError("Payment method is required.");
        return;
      }

      if (!paymentForm.transactionId.trim()) {
        setPaymentError("Transaction ID is required.");
        return;
      }

      const res = await axios.post(
        `${API_BASE_URL}/payments/create`,
        {
          subscriptionId: createdSubscription._id,
          method: paymentForm.method,
          transactionId: paymentForm.transactionId.trim(),
          senderNumber: paymentForm.senderNumber.trim() || null,
          note: paymentForm.note.trim() || null,
        },
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );

      setPaymentMessage(
        res.data?.message ||
          "Payment submitted successfully. Waiting for admin verification."
      );

      setMessage(
        "Payment submitted successfully. Your subscription will be active after admin verification."
      );

      setPaymentForm({
        method: "",
        transactionId: "",
        senderNumber: "",
        note: "",
      });
    } catch (err) {
      setPaymentError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to submit payment"
      );
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const closePaymentModal = () => {
    if (paymentSubmitting) return;

    setPaymentModalOpen(false);
    setSelectedPlanForPayment(null);
    setCreatedSubscription(null);
    setPaymentError("");
    setPaymentMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-white pb-12 pt-24">
      <RoleSelectionModal
        open={showRoleModal}
        onSelectRole={handleSelectRole}
        t={t}
      />

      <PaymentModal
        open={paymentModalOpen}
        plan={selectedPlanForPayment}
        subscription={createdSubscription}
        submitting={paymentSubmitting}
        error={paymentError}
        message={paymentMessage}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        onClose={closePaymentModal}
        onSubmitPayment={handleSubmitPayment}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.header
          className="mx-auto mb-12 max-w-4xl text-center"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
            <FaCrown className="h-4 w-4" />
            {selectedRoleLabel}
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Choose Your Legal Service Package
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Select whether you want client packages or lawyer packages, then
            choose the subscription that fits your needs.
          </p>

          {selectedRole && (
            <button
              type="button"
              onClick={openRoleModal}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Change Package Type
              <FiArrowRight className="h-4 w-4" />
            </button>
          )}
        </motion.header>

        {message && (
          <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mx-auto mb-6 flex max-w-4xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!selectedRole ? (
          <motion.div
            className="mx-auto max-w-xl rounded-3xl border border-dashed border-amber-300 bg-amber-50/40 px-6 py-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-lg shadow-amber-500/20">
              <FaCrown className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black text-slate-950">
              Choose a package type first
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Select client or lawyer in the popup to view matching
              subscription packages.
            </p>

            <button
              type="button"
              onClick={openRoleModal}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-600 hover:to-yellow-700"
            >
              Select Package Type
              <FiArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-100 bg-white px-5 py-4 text-slate-700 shadow-sm">
              <FiLoader className="h-5 w-5 animate-spin text-amber-600" />
              {t.states.loading}
            </div>
          </div>
        ) : plans.length === 0 ? (
          <motion.div
            className="py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FiMessageCircle className="h-7 w-7" />
            </div>

            <p className="text-lg font-bold text-slate-700">
              {t.states.emptyTitle}
            </p>

            <p className="mt-2 text-slate-500">
              No active packages are available for this role right now.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan._id || `${plan.roleType}-${plan.slug}`}
                plan={plan}
                index={index}
                t={t}
                onChoose={handleChoosePlan}
                choosingPlanId={choosingPlanId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansPage;
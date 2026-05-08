import Plan from "../models/plan.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const normalizeSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const convertFeaturesArrayToObject = (features = []) => {
  const result = {};

  features.forEach((feature) => {
    if (feature.enabled) {
      result[feature.key] = feature.value;
    }
  });

  return result;
};

const mergePlanFeatures = (existingFeatures = [], requiredFeatures = []) => {
  const featureMap = new Map();

  existingFeatures.forEach((feature) => {
    featureMap.set(feature.key, {
      key: feature.key,
      label: feature.label,
      description: feature.description || "",
      valueType: feature.valueType,
      value: feature.value,
      enabled: feature.enabled,
      sortOrder: feature.sortOrder || 0,
    });
  });

  requiredFeatures.forEach((feature) => {
    featureMap.set(feature.key, {
      ...featureMap.get(feature.key),
      ...feature,
      enabled: true,
    });
  });

  return Array.from(featureMap.values()).sort(
    (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
  );
};

export const calculateEndDate = (startDate, durationInDays) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Number(durationInDays || 30));
  return endDate;
};

const FREE_PLAN_CONFIG = {
  client: {
    name: "Client Free",
    slug: "client-free",
    roleType: "client",
    description: "Default free client plan",
    price: 0,
    durationInDays: 30,
    currency: "BDT",
    isActive: true,
    sortOrder: 0,
    features: [
      {
        key: "case_post_limit",
        label: "Case Post Limit",
        valueType: "number",
        value: 1,
        enabled: true,
        sortOrder: 1,
      },
      {
        key: "connection_request_limit",
        label: "Connection Request Limit",
        valueType: "number",
        value: 2,
        enabled: true,
        sortOrder: 2,
      },
      {
        key: "in_app_messaging",
        label: "In App Messaging",
        valueType: "boolean",
        value: true,
        enabled: true,
        sortOrder: 3,
      },
      {
        key: "contact_unlock",
        label: "Contact Unlock",
        valueType: "boolean",
        value: false,
        enabled: true,
        sortOrder: 4,
      },
    ],
  },

  lawyer: {
    name: "Lawyer Free",
    slug: "lawyer-free",
    roleType: "lawyer",
    description: "Default free lawyer plan",
    price: 0,
    durationInDays: 30,
    currency: "BDT",
    isActive: true,
    sortOrder: 0,
    features: [
      {
        key: "connection_request_limit",
        label: "Connection Request Limit",
        valueType: "number",
        value: 3,
        enabled: true,
        sortOrder: 1,
      },
      {
        key: "proposal_limit",
        label: "Proposal Limit",
        valueType: "number",
        value: 5,
        enabled: true,
        sortOrder: 2,
      },
      {
        key: "in_app_messaging",
        label: "In App Messaging",
        valueType: "boolean",
        value: true,
        enabled: true,
        sortOrder: 3,
      },
      {
        key: "contact_unlock",
        label: "Contact Unlock",
        valueType: "boolean",
        value: false,
        enabled: true,
        sortOrder: 4,
      },
    ],
  },
};

export const ensureFreePlanForRole = async (roleType) => {
  if (!["client", "lawyer"].includes(roleType)) return null;

  const config = FREE_PLAN_CONFIG[roleType];

  let plan = await Plan.findOne({
    roleType,
    slug: config.slug,
  });

  if (plan) {
    const mergedFeatures = mergePlanFeatures(plan.features || [], config.features);

    plan.name = config.name;
    plan.description = config.description;
    plan.price = config.price;
    plan.durationInDays = config.durationInDays;
    plan.currency = config.currency;
    plan.isActive = true;
    plan.sortOrder = config.sortOrder;
    plan.features = mergedFeatures;

    await plan.save();
    return plan;
  }

  plan = await Plan.create({
    ...config,
    slug: normalizeSlug(config.slug),
  });

  return plan;
};

export const getActiveSubscription = async (userId) => {
  return Subscription.findOne({
    user: userId,
    status: "active",
    endDate: { $gt: new Date() },
  }).sort({ endDate: -1 });
};

export const syncUserSubscriptionStatus = async (userId) => {
  const activeSub = await getActiveSubscription(userId);

  if (activeSub) {
    await User.findByIdAndUpdate(userId, {
      currentSubscription: activeSub._id,
      subscriptionStatus: "active",
    });

    return activeSub;
  }

  const latestSub = await Subscription.findOne({ user: userId }).sort({
    createdAt: -1,
  });

  await User.findByIdAndUpdate(userId, {
    currentSubscription: null,
    subscriptionStatus: latestSub?.status || "none",
  });

  return null;
};

export const assignFreeSubscriptionToUser = async (user) => {
  if (!user || !["client", "lawyer"].includes(user.role)) return null;

  const existingActive = await getActiveSubscription(user._id);

  if (existingActive) {
    existingActive.features = {
      ...(existingActive.features || {}),
      in_app_messaging: true,
    };

    await existingActive.save();
    await syncUserSubscriptionStatus(user._id);

    return existingActive;
  }

  const plan = await ensureFreePlanForRole(user.role);

  if (!plan) return null;

  const now = new Date();

  const subscription = await Subscription.create({
    user: user._id,
    plan: plan._id,
    roleType: plan.roleType,
    planName: plan.name,
    planSlug: plan.slug,
    price: plan.price,
    currency: plan.currency,
    durationInDays: plan.durationInDays,
    features: {
      ...convertFeaturesArrayToObject(plan.features),
      in_app_messaging: true,
    },

    status: "active",
    startDate: now,
    endDate: calculateEndDate(now, plan.durationInDays),
    activatedAt: now,

    payment: {
      status: "free",
      transactionId: null,
      method: null,
      paidAt: null,
    },
  });

  await User.findByIdAndUpdate(user._id, {
    currentSubscription: subscription._id,
    subscriptionStatus: "active",
  });

  return subscription;
};

export const getNumericFeatureValue = async (userId, featureKey, fallback = 0) => {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) return fallback;

  const value = Number(subscription.features?.[featureKey]);

  if (!Number.isFinite(value)) return fallback;

  return value;
};

export const hasBooleanFeature = async (userId, featureKey) => {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) return false;

  return subscription.features?.[featureKey] === true;
};

export const enableMessagingForActiveSubscription = async (userId) => {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) return null;

  subscription.features = {
    ...(subscription.features || {}),
    in_app_messaging: true,
  };

  await subscription.save();

  return subscription;
};
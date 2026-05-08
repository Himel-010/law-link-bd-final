import Plan from "../models/plan.model.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const ALLOWED_PAYMENT_METHODS = ["bkash", "nogod"];

const convertFeaturesArrayToObject = (features = []) => {
  const result = {};

  features.forEach((feature) => {
    if (feature.enabled) {
      result[feature.key] = feature.value;
    }
  });

  return result;
};

const getUserRoleType = (userRole) => {
  if (userRole === "client") return "client";
  if (userRole === "lawyer") return "lawyer";
  return null;
};

const calculateEndDate = (startDate, durationInDays) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Number(durationInDays || 30));
  return endDate;
};

const normalizeMethod = (method) => {
  return String(method || "").toLowerCase().trim();
};

const syncUserSubscriptionStatus = async (userId) => {
  const activeSub = await Subscription.findOne({
    user: userId,
    status: "active",
    endDate: { $gt: new Date() },
  }).sort({ endDate: -1 });

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

// =========================
// USER: CHOOSE / PURCHASE PLAN
// =========================

export const choosePlan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { planId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required",
      });
    }

    const roleType = getUserRoleType(userRole);

    if (!roleType) {
      return res.status(403).json({
        success: false,
        message: "Only client or lawyer can purchase a plan",
      });
    }

    const plan = await Plan.findOne({
      _id: planId,
      roleType,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found for your role",
      });
    }

    const existingPendingSubscription = await Subscription.findOne({
      user: userId,
      status: "pending",
      plan: plan._id,
    });

    if (existingPendingSubscription && Number(plan.price) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending subscription for this plan. Please submit payment or wait for admin verification.",
        data: existingPendingSubscription,
        nextStep: {
          paymentRequired: true,
          subscriptionId: existingPendingSubscription._id,
          amount: existingPendingSubscription.price,
          currency: existingPendingSubscription.currency,
          createPaymentEndpoint: "/api/payments/create",
        },
      });
    }

    const now = new Date();
    const isFreePlan = Number(plan.price) === 0;

    const subscription = await Subscription.create({
      user: userId,
      plan: plan._id,
      roleType: plan.roleType,
      planName: plan.name,
      planSlug: plan.slug,
      price: plan.price,
      currency: plan.currency,
      durationInDays: plan.durationInDays,
      features: convertFeaturesArrayToObject(plan.features),

      status: isFreePlan ? "active" : "pending",
      startDate: isFreePlan ? now : null,
      endDate: isFreePlan ? calculateEndDate(now, plan.durationInDays) : null,
      activatedAt: isFreePlan ? now : null,

      payment: {
        status: isFreePlan ? "free" : "unpaid",
        transactionId: null,
        method: null,
        paidAt: null,
      },
    });

    await syncUserSubscriptionStatus(userId);

    return res.status(201).json({
      success: true,
      message: isFreePlan
        ? "Free plan activated successfully"
        : "Subscription created successfully. Please submit payment for admin verification.",
      data: subscription,
      nextStep: isFreePlan
        ? null
        : {
            paymentRequired: true,
            subscriptionId: subscription._id,
            amount: subscription.price,
            currency: subscription.currency,
            createPaymentEndpoint: "/api/payments/create",
          },
    });
  } catch (error) {
    console.error("choosePlan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to choose plan",
      error: error.message,
    });
  }
};

// =========================
// USER: CURRENT SUBSCRIPTION
// =========================

export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user?.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: "active",
      endDate: { $gt: new Date() },
    })
      .populate("plan")
      .sort({ endDate: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("getMySubscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};

// =========================
// USER: SUBSCRIPTION HISTORY
// =========================

export const getMySubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {
      user: userId,
    };

    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("plan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: subscriptions,
    });
  } catch (error) {
    console.error("getMySubscriptionHistory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription history",
      error: error.message,
    });
  }
};

// =========================
// USER: CANCEL OWN SUBSCRIPTION
// =========================

export const cancelMySubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.status !== "active" && subscription.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Subscription cannot be cancelled. Current status: ${subscription.status}`,
      });
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();

    await subscription.save();
    await syncUserSubscriptionStatus(userId);

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("cancelMySubscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: CREATE SUBSCRIPTION MANUALLY
// =========================

export const adminCreateSubscription = async (req, res) => {
  try {
    const {
      userId,
      planId,
      startDate,
      status,
      paymentStatus,
      paymentMethod,
      transactionId,
      notes,
    } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: "userId and planId are required",
      });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    if (!["client", "lawyer"].includes(targetUser.role)) {
      return res.status(400).json({
        success: false,
        message: "Target user must be client or lawyer",
      });
    }

    const plan = await Plan.findOne({
      _id: planId,
      roleType: targetUser.role,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Active plan not found for this user's role",
      });
    }

    const isFreePlan = Number(plan.price) === 0;

    let finalPaymentStatus = paymentStatus;
    let finalStatus = status;

    if (isFreePlan) {
      finalPaymentStatus = "free";
      finalStatus = finalStatus || "active";
    } else {
      finalPaymentStatus = finalPaymentStatus || "unpaid";
      finalStatus = finalStatus || "pending";
    }

    if (!["pending", "active", "expired", "cancelled"].includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription status",
      });
    }

    if (
      !["free", "unpaid", "paid", "failed", "refunded"].includes(
        finalPaymentStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    if (!isFreePlan && finalStatus === "active") {
      finalPaymentStatus = "paid";
    }

    const needsPaymentInfo =
      !isFreePlan && (finalStatus === "active" || finalPaymentStatus === "paid");

    const normalizedMethod = normalizeMethod(paymentMethod);

    if (needsPaymentInfo && !normalizedMethod) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod is required for paid or active subscription",
      });
    }

    if (
      normalizedMethod &&
      !ALLOWED_PAYMENT_METHODS.includes(normalizedMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be either bkash or nogod",
      });
    }

    if (needsPaymentInfo && !String(transactionId || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required for paid or active subscription",
      });
    }

    if (transactionId) {
      const existingTx = await Payment.findOne({
        transactionId: String(transactionId).trim(),
      });

      if (existingTx) {
        return res.status(409).json({
          success: false,
          message: "Transaction ID already used",
        });
      }
    }

    const now = new Date();

    const finalStartDate =
      finalStatus === "active"
        ? new Date(startDate || now)
        : startDate
        ? new Date(startDate)
        : null;

    const finalEndDate =
      finalStatus === "active"
        ? calculateEndDate(finalStartDate, plan.durationInDays)
        : null;

    const subscription = await Subscription.create({
      user: targetUser._id,
      plan: plan._id,
      roleType: plan.roleType,
      planName: plan.name,
      planSlug: plan.slug,
      price: plan.price,
      currency: plan.currency,
      durationInDays: plan.durationInDays,
      features: convertFeaturesArrayToObject(plan.features),

      status: finalStatus,
      startDate: finalStartDate,
      endDate: finalEndDate,
      activatedAt: finalStatus === "active" ? now : null,
      cancelledAt: finalStatus === "cancelled" ? now : null,

      payment: {
        status: finalPaymentStatus,
        transactionId: transactionId ? String(transactionId).trim() : null,
        method: normalizedMethod || null,
        paidAt: finalPaymentStatus === "paid" ? now : null,
      },

      adminNotes: notes || "",
    });

    let payment = null;

    if (!isFreePlan && transactionId && normalizedMethod) {
      payment = await Payment.create({
        user: targetUser._id,
        subscription: subscription._id,
        plan: plan._id,
        roleType: plan.roleType,
        planName: plan.name,
        planSlug: plan.slug,
        amount: plan.price,
        currency: plan.currency,
        method: normalizedMethod,
        transactionId: String(transactionId).trim(),
        senderNumber: null,
        paymentStatus: finalPaymentStatus === "paid" ? "verified" : "pending",
        verifiedAt: finalPaymentStatus === "paid" ? now : null,
        verifiedBy: finalPaymentStatus === "paid" ? req.user?.id || null : null,
        note: notes || null,
      });
    }

    await syncUserSubscriptionStatus(targetUser._id);

    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate("user", "name email role phone subscriptionStatus")
      .populate("plan");

    return res.status(201).json({
      success: true,
      message: "Subscription created successfully by admin",
      data: populatedSubscription,
      payment,
    });
  } catch (error) {
    console.error("adminCreateSubscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: GET ALL SUBSCRIPTIONS
// =========================

export const getAllSubscriptionsAdmin = async (req, res) => {
  try {
    const {
      status,
      roleType,
      planSlug,
      userId,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (roleType) filter.roleType = roleType;
    if (planSlug) filter.planSlug = String(planSlug).toLowerCase();
    if (userId) filter.user = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("user", "name email role phone subscriptionStatus")
        .populate("plan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: subscriptions,
    });
  } catch (error) {
    console.error("getAllSubscriptionsAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: GET SUBSCRIPTION BY ID
// =========================

export const getSubscriptionByIdAdmin = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId)
      .populate("user", "name email role phone subscriptionStatus")
      .populate("plan");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("getSubscriptionByIdAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: UPDATE SUBSCRIPTION
// =========================

export const updateSubscriptionAdmin = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const {
      planId,
      startDate,
      status,
      paymentStatus,
      paymentMethod,
      transactionId,
      notes,
    } = req.body;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const targetUser = await User.findById(subscription.user);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Subscription user not found",
      });
    }

    if (!["client", "lawyer"].includes(targetUser.role)) {
      return res.status(400).json({
        success: false,
        message: "Subscription user must be client or lawyer",
      });
    }

    const selectedPlan = planId
      ? await Plan.findOne({
          _id: planId,
          roleType: targetUser.role,
          isActive: true,
        })
      : await Plan.findById(subscription.plan);

    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: "Active plan not found for this user's role",
      });
    }

    const isFreePlan = Number(selectedPlan.price) === 0;

    let finalStatus = status || subscription.status;
    let finalPaymentStatus = paymentStatus || subscription.payment?.status;

    if (isFreePlan) {
      finalPaymentStatus = "free";
      finalStatus = finalStatus || "active";
    } else {
      finalPaymentStatus = finalPaymentStatus || "unpaid";
      finalStatus = finalStatus || "pending";
    }

    if (!["pending", "active", "expired", "cancelled"].includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription status",
      });
    }

    if (
      !["free", "unpaid", "paid", "failed", "refunded"].includes(
        finalPaymentStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    if (!isFreePlan && finalStatus === "active") {
      finalPaymentStatus = "paid";
    }

    const normalizedMethod =
      paymentMethod !== undefined
        ? normalizeMethod(paymentMethod)
        : normalizeMethod(subscription.payment?.method);

    const finalTransactionId =
      transactionId !== undefined
        ? String(transactionId || "").trim()
        : String(subscription.payment?.transactionId || "").trim();

    const needsPaymentInfo =
      !isFreePlan && (finalStatus === "active" || finalPaymentStatus === "paid");

    if (needsPaymentInfo && !normalizedMethod) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod is required for paid or active subscription",
      });
    }

    if (
      normalizedMethod &&
      !ALLOWED_PAYMENT_METHODS.includes(normalizedMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be either bkash or nogod",
      });
    }

    if (needsPaymentInfo && !finalTransactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required for paid or active subscription",
      });
    }

    if (finalTransactionId) {
      const existingTx = await Payment.findOne({
        transactionId: finalTransactionId,
        subscription: { $ne: subscription._id },
      });

      if (existingTx) {
        return res.status(409).json({
          success: false,
          message: "Transaction ID already used",
        });
      }
    }

    const now = new Date();

    const finalStartDate =
      finalStatus === "active"
        ? new Date(startDate || subscription.startDate || now)
        : startDate
        ? new Date(startDate)
        : null;

    const finalEndDate =
      finalStatus === "active"
        ? calculateEndDate(finalStartDate, selectedPlan.durationInDays)
        : null;

    subscription.plan = selectedPlan._id;
    subscription.roleType = selectedPlan.roleType;
    subscription.planName = selectedPlan.name;
    subscription.planSlug = selectedPlan.slug;
    subscription.price = selectedPlan.price;
    subscription.currency = selectedPlan.currency;
    subscription.durationInDays = selectedPlan.durationInDays;
    subscription.features = convertFeaturesArrayToObject(selectedPlan.features);

    subscription.status = finalStatus;
    subscription.startDate = finalStartDate;
    subscription.endDate = finalEndDate;

    subscription.activatedAt =
      finalStatus === "active" ? subscription.activatedAt || now : null;

    subscription.cancelledAt =
      finalStatus === "cancelled" ? subscription.cancelledAt || now : null;

    subscription.payment = {
      status: finalPaymentStatus,
      transactionId: finalTransactionId || null,
      method: normalizedMethod || null,
      paidAt:
        finalPaymentStatus === "paid"
          ? subscription.payment?.paidAt || now
          : null,
    };

    if (notes !== undefined) {
      subscription.adminNotes = notes || "";
    }

    await subscription.save();

    if (!isFreePlan && finalTransactionId && normalizedMethod) {
      await Payment.findOneAndUpdate(
        { subscription: subscription._id },
        {
          user: targetUser._id,
          subscription: subscription._id,
          plan: selectedPlan._id,
          roleType: selectedPlan.roleType,
          planName: selectedPlan.name,
          planSlug: selectedPlan.slug,
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          method: normalizedMethod,
          transactionId: finalTransactionId,
          senderNumber: null,
          paymentStatus: finalPaymentStatus === "paid" ? "verified" : "pending",
          verifiedAt: finalPaymentStatus === "paid" ? now : null,
          verifiedBy:
            finalPaymentStatus === "paid" ? req.user?.id || null : null,
          note: notes || null,
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    }

    await syncUserSubscriptionStatus(targetUser._id);

    const updatedSubscription = await Subscription.findById(subscription._id)
      .populate("user", "name email role phone subscriptionStatus")
      .populate("plan");

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: updatedSubscription,
    });
  } catch (error) {
    console.error("updateSubscriptionAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: DELETE SUBSCRIPTION
// =========================

export const deleteSubscriptionAdmin = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const userId = subscription.user;

    await Payment.deleteMany({
      subscription: subscription._id,
    });

    await Subscription.findByIdAndDelete(subscription._id);

    await syncUserSubscriptionStatus(userId);

    return res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("deleteSubscriptionAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: MARK EXPIRED
// =========================

export const markExpiredSubscriptions = async (req, res) => {
  try {
    const expiredSubscriptions = await Subscription.find({
      status: "active",
      endDate: { $lte: new Date() },
    });

    const result = await Subscription.updateMany(
      {
        status: "active",
        endDate: { $lte: new Date() },
      },
      {
        $set: {
          status: "expired",
        },
      }
    );

    const userIds = [
      ...new Set(expiredSubscriptions.map((sub) => String(sub.user))),
    ];

    await Promise.all(userIds.map((userId) => syncUserSubscriptionStatus(userId)));

    return res.status(200).json({
      success: true,
      message: "Expired subscriptions marked successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("markExpiredSubscriptions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark expired subscriptions",
      error: error.message,
    });
  }
};
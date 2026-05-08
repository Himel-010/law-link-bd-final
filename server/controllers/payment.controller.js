import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const isAdmin = (req) => req.user?.role === "admin";

const ensureOwnerOrAdmin = (req, ownerId) => {
  return isAdmin(req) || String(req.user?.id) === String(ownerId);
};

const normalizeMethod = (method) => {
  return String(method || "").toLowerCase().trim();
};

const ALLOWED_PAYMENT_METHODS = ["bkash", "nogod"];

const calculateEndDate = (startDate, durationInDays) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Number(durationInDays || 30));
  return endDate;
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

    return;
  }

  const latestSub = await Subscription.findOne({ user: userId }).sort({
    createdAt: -1,
  });

  await User.findByIdAndUpdate(userId, {
    currentSubscription: null,
    subscriptionStatus: latestSub?.status || "none",
  });
};

export const createPayment = async (req, res) => {
  try {
    const userId = req.user?.id;

    const {
      subscriptionId,
      transactionId,
      method,
      senderNumber = null,
      note = null,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!subscriptionId || !transactionId || !method) {
      return res.status(400).json({
        success: false,
        message: "subscriptionId, transactionId and method are required",
      });
    }

    const normalizedMethod = normalizeMethod(method);

    if (!ALLOWED_PAYMENT_METHODS.includes(normalizedMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be either bkash or nogod",
      });
    }

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (!ensureOwnerOrAdmin(req, subscription.user)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (subscription.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Free subscription does not require payment",
      });
    }

    if (subscription.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled subscription cannot be paid",
      });
    }

    if (subscription.status === "active" && subscription.payment?.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This subscription is already paid and active",
      });
    }

    const existingTx = await Payment.findOne({
      transactionId: transactionId.trim(),
    });

    if (existingTx) {
      return res.status(409).json({
        success: false,
        message: "Transaction ID already used",
      });
    }

    const existingPendingPayment = await Payment.findOne({
      subscription: subscriptionId,
      paymentStatus: "pending",
    });

    if (existingPendingPayment) {
      return res.status(400).json({
        success: false,
        message: "A pending payment already exists for this subscription",
      });
    }

    const payment = await Payment.create({
      user: subscription.user,
      subscription: subscription._id,
      plan: subscription.plan,
      roleType: subscription.roleType,
      planName: subscription.planName,
      planSlug: subscription.planSlug,
      amount: subscription.price,
      currency: subscription.currency,
      method: normalizedMethod,
      transactionId: transactionId.trim(),
      senderNumber,
      paymentStatus: "pending",
      note,
    });

    subscription.payment.status = "unpaid";
    subscription.payment.transactionId = transactionId.trim();
    subscription.payment.method = normalizedMethod;
    subscription.payment.paidAt = null;

    if (subscription.status !== "active") {
      subscription.status = "pending";
    }

    await subscription.save();
    await syncUserSubscriptionStatus(subscription.user);

    return res.status(201).json({
      success: true,
      message: "Payment request created successfully. Waiting for admin verification",
      data: payment,
    });
  } catch (error) {
    console.error("createPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment request",
      error: error.message,
    });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { paymentStatus, page = 1, limit = 10 } = req.query;

    const filter = {
      user: userId,
    };

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("plan")
        .populate("subscription", "planName planSlug roleType price currency status startDate endDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: payments,
    });
  } catch (error) {
    console.error("getMyPayments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
};

export const getMyPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("plan")
      .populate("subscription", "planName planSlug roleType price currency status startDate endDate")
      .populate("verifiedBy", "name email role");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (!ensureOwnerOrAdmin(req, payment.user)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("getMyPaymentById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can verify payment",
      });
    }

    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending payment can be verified. Current status: ${payment.paymentStatus}`,
      });
    }

    const subscription = await Subscription.findById(payment.subscription);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Related subscription not found",
      });
    }

    const now = new Date();

    payment.paymentStatus = "verified";
    payment.verifiedAt = now;
    payment.verifiedBy = req.user?.id || null;
    payment.rejectedAt = null;
    payment.rejectionReason = null;

    await payment.save();

    subscription.status = "active";
    subscription.activatedAt = now;
    subscription.startDate = now;
    subscription.endDate = calculateEndDate(now, subscription.durationInDays);

    subscription.payment.status = "paid";
    subscription.payment.transactionId = payment.transactionId;
    subscription.payment.method = payment.method;
    subscription.payment.paidAt = now;

    await subscription.save();
    await syncUserSubscriptionStatus(subscription.user);

    return res.status(200).json({
      success: true,
      message: "Payment verified and subscription activated successfully",
      data: {
        payment,
        subscription,
      },
    });
  } catch (error) {
    console.error("verifyPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

export const rejectPayment = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can reject payment",
      });
    }

    const { paymentId } = req.params;
    const { rejectionReason = null } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending payment can be rejected. Current status: ${payment.paymentStatus}`,
      });
    }

    const subscription = await Subscription.findById(payment.subscription);

    payment.paymentStatus = "rejected";
    payment.rejectedAt = new Date();
    payment.rejectionReason = rejectionReason;
    payment.verifiedBy = req.user?.id || null;

    await payment.save();

    if (subscription) {
      subscription.payment.status = "failed";
      await subscription.save();
      await syncUserSubscriptionStatus(subscription.user);
    }

    return res.status(200).json({
      success: true,
      message: "Payment rejected successfully",
      data: payment,
    });
  } catch (error) {
    console.error("rejectPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject payment",
      error: error.message,
    });
  }
};

export const refundPayment = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can refund payment",
      });
    }

    const { paymentId } = req.params;
    const { refundReason = null } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Only verified payment can be refunded",
      });
    }

    const subscription = await Subscription.findById(payment.subscription);

    payment.paymentStatus = "refunded";
    payment.refundedAt = new Date();
    payment.refundReason = refundReason;
    payment.verifiedBy = req.user?.id || null;

    await payment.save();

    if (subscription) {
      subscription.payment.status = "refunded";
      subscription.status = "cancelled";
      subscription.cancelledAt = new Date();

      await subscription.save();
      await syncUserSubscriptionStatus(subscription.user);
    }

    return res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      data: payment,
    });
  } catch (error) {
    console.error("refundPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to refund payment",
      error: error.message,
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can view all payments",
      });
    }

    const {
      paymentStatus,
      method,
      roleType,
      planSlug,
      userId,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (method) filter.method = normalizeMethod(method);
    if (roleType) filter.roleType = roleType;
    if (planSlug) filter.planSlug = String(planSlug).toLowerCase();
    if (userId) filter.user = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("user", "name email role phone subscriptionStatus")
        .populate("plan")
        .populate("subscription", "planName planSlug roleType price currency status startDate endDate")
        .populate("verifiedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: payments,
    });
  } catch (error) {
    console.error("getAllPayments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can view payment details",
      });
    }

    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("user", "name email role phone subscriptionStatus")
      .populate("plan")
      .populate("subscription")
      .populate("verifiedBy", "name email role");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("getPaymentById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};
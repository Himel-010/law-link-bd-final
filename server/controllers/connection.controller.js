import mongoose from "mongoose";
import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import {
  getActiveSubscription,
  getNumericFeatureValue,
  hasBooleanFeature,
} from "../utils/subscription.utils.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeAttachments = (attachments) => {
  if (Array.isArray(attachments)) {
    return attachments.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof attachments === "string") {
    return attachments
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const populateConnection = (query) => {
  return query
    .populate(
      "client",
      "name email phone role subscriptionStatus currentSubscription"
    )
    .populate(
      "lawyer",
      "name email phone role lawRegNumber phoneVerified subscriptionStatus currentSubscription"
    )
    .populate("post", "title category status budgetMin budgetMax client")
    .populate("requestedBy", "name email role")
    .populate("messages.sender", "name email role");
};

const isConnectionParticipant = (req, connection) => {
  const userId = String(req.user.id);

  return (
    String(connection.client?._id || connection.client) === userId ||
    String(connection.lawyer?._id || connection.lawyer) === userId
  );
};

const canAccessConnection = (req, connection) => {
  return req.user.role === "admin" || isConnectionParticipant(req, connection);
};

const canRespondConnection = (req, connection) => {
  const userId = String(req.user.id);

  if (req.user.role === "admin") return true;

  if (String(connection.requestedBy?._id || connection.requestedBy) === userId) {
    return false;
  }

  return isConnectionParticipant(req, connection);
};

const buildConnectionFilter = (req) => {
  const filter = {};

  if (req.user.role === "client") {
    filter.client = req.user.id;
  }

  if (req.user.role === "lawyer") {
    filter.lawyer = req.user.id;
  }

  if (req.user.role === "admin") {
    if (req.query.client && isValidObjectId(req.query.client)) {
      filter.client = req.query.client;
    }

    if (req.query.lawyer && isValidObjectId(req.query.lawyer)) {
      filter.lawyer = req.query.lawyer;
    }
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.post && isValidObjectId(req.query.post)) {
    filter.post = req.query.post;
  }

  return filter;
};

const ensureMessagingAllowed = async (req) => {
  if (req.user.role === "admin") return true;

  if (!["client", "lawyer"].includes(req.user.role)) return false;

  const activeSubscription = await getActiveSubscription(req.user.id);

  if (!activeSubscription) return false;

  if (activeSubscription.features?.in_app_messaging === true) {
    return true;
  }

  activeSubscription.features = {
    ...(activeSubscription.features || {}),
    in_app_messaging: true,
  };

  await activeSubscription.save();

  return true;
};

// =========================
// USER: CREATE CONNECTION REQUEST
// =========================

export const createConnectionRequest = async (req, res, next) => {
  try {
    const { clientId, lawyerId, postId, requestMessage = "" } = req.body;

    if (!["client", "lawyer"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only client or lawyer can create connection request",
      });
    }

    const activeSubscription = await getActiveSubscription(req.user.id);

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to send connection request",
      });
    }

    if (!postId || !isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Valid postId is required",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Connection request is allowed only for open posts",
      });
    }

    let finalClientId = null;
    let finalLawyerId = null;

    if (req.user.role === "lawyer") {
      finalLawyerId = req.user.id;
      finalClientId = clientId || post.client;
    }

    if (req.user.role === "client") {
      finalClientId = req.user.id;

      if (!lawyerId || !isValidObjectId(lawyerId)) {
        return res.status(400).json({
          success: false,
          message: "Valid lawyerId is required",
        });
      }

      finalLawyerId = lawyerId;
    }

    if (String(post.client) !== String(finalClientId)) {
      return res.status(403).json({
        success: false,
        message: "This post does not belong to the selected client",
      });
    }

    if (String(finalClientId) === String(finalLawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Client and lawyer cannot be the same user",
      });
    }

    const [client, lawyer] = await Promise.all([
      User.findOne({ _id: finalClientId, role: "client" }).select(
        "_id role name email"
      ),
      User.findOne({ _id: finalLawyerId, role: "lawyer" }).select(
        "_id role name email"
      ),
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    const monthlyLimit = await getNumericFeatureValue(
      req.user.id,
      "connection_request_limit",
      0
    );

    if (monthlyLimit <= 0) {
      return res.status(403).json({
        success: false,
        message: "Your plan does not allow connection requests",
      });
    }

    const usedRequests = await Connection.countDocuments({
      requestedBy: req.user.id,
      createdAt: {
        $gte: activeSubscription.startDate,
        $lte: activeSubscription.endDate,
      },
    });

    if (usedRequests >= monthlyLimit) {
      return res.status(403).json({
        success: false,
        message: "Connection request limit reached. Please upgrade your plan.",
        limit: monthlyLimit,
        used: usedRequests,
      });
    }

    const existingConnection = await Connection.findOne({
      client: finalClientId,
      lawyer: finalLawyerId,
      post: post._id,
    });

    if (existingConnection) {
      return res.status(409).json({
        success: false,
        message: "Connection request already exists",
        data: existingConnection,
      });
    }

    const connection = await Connection.create({
      client: finalClientId,
      lawyer: finalLawyerId,
      post: post._id,
      requestedBy: req.user.id,
      requestMessage: String(requestMessage || "").trim(),
      status: "pending",
    });

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(201).json({
      success: true,
      message: "Connection request sent successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// ADMIN: CREATE CONNECTION
// =========================

export const adminCreateConnection = async (req, res, next) => {
  try {
    const {
      clientId,
      lawyerId,
      postId,
      requestedBy,
      requestMessage = "",
      responseMessage = "",
      status = "pending",
    } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create connection manually",
      });
    }

    if (!clientId || !isValidObjectId(clientId)) {
      return res.status(400).json({
        success: false,
        message: "Valid clientId is required",
      });
    }

    if (!lawyerId || !isValidObjectId(lawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Valid lawyerId is required",
      });
    }

    if (!postId || !isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Valid postId is required",
      });
    }

    if (
      !["pending", "accepted", "rejected", "cancelled", "blocked"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection status",
      });
    }

    if (String(clientId) === String(lawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Client and lawyer cannot be the same user",
      });
    }

    const [client, lawyer, post] = await Promise.all([
      User.findOne({ _id: clientId, role: "client" }).select(
        "_id role name email"
      ),
      User.findOne({ _id: lawyerId, role: "lawyer" }).select(
        "_id role name email"
      ),
      Post.findById(postId),
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (String(post.client) !== String(clientId)) {
      return res.status(400).json({
        success: false,
        message: "This post does not belong to the selected client",
      });
    }

    const existingConnection = await Connection.findOne({
      client: clientId,
      lawyer: lawyerId,
      post: postId,
    });

    if (existingConnection) {
      return res.status(409).json({
        success: false,
        message: "Connection already exists for this client, lawyer and post",
        data: existingConnection,
      });
    }

    const now = new Date();

    const connection = await Connection.create({
      client: clientId,
      lawyer: lawyerId,
      post: postId,
      requestedBy:
        requestedBy && isValidObjectId(requestedBy) ? requestedBy : req.user.id,
      requestMessage: String(requestMessage || "").trim(),
      responseMessage: String(responseMessage || "").trim(),
      status,
      acceptedAt: status === "accepted" ? now : null,
      rejectedAt: status === "rejected" ? now : null,
      cancelledAt: status === "cancelled" ? now : null,
      blockedAt: status === "blocked" ? now : null,
      lastMessageAt: null,
    });

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(201).json({
      success: true,
      message: "Connection created successfully by admin",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// READ CONNECTIONS
// =========================

export const getMyConnections = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const filter = buildConnectionFilter(req);

    const [connections, total] = await Promise.all([
      populateConnection(
        Connection.find(filter)
          .sort({ lastMessageAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Connection.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Connections fetched successfully",
      total,
      page,
      limit,
      data: connections,
    });
  } catch (error) {
    next(error);
  }
};

export const getConnectionById = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await populateConnection(
      Connection.findById(connectionId)
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this connection",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Connection fetched successfully",
      data: connection,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// ADMIN: UPDATE CONNECTION
// =========================

export const adminUpdateConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const {
      clientId,
      lawyerId,
      postId,
      requestedBy,
      requestMessage,
      responseMessage,
      status,
    } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update connection",
      });
    }

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    const finalClientId = clientId || connection.client;
    const finalLawyerId = lawyerId || connection.lawyer;
    const finalPostId = postId || connection.post;

    if (!isValidObjectId(finalClientId)) {
      return res.status(400).json({
        success: false,
        message: "Valid clientId is required",
      });
    }

    if (!isValidObjectId(finalLawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Valid lawyerId is required",
      });
    }

    if (!isValidObjectId(finalPostId)) {
      return res.status(400).json({
        success: false,
        message: "Valid postId is required",
      });
    }

    if (String(finalClientId) === String(finalLawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Client and lawyer cannot be the same user",
      });
    }

    if (
      status &&
      !["pending", "accepted", "rejected", "cancelled", "blocked"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection status",
      });
    }

    const [client, lawyer, post] = await Promise.all([
      User.findOne({ _id: finalClientId, role: "client" }).select(
        "_id role name email"
      ),
      User.findOne({ _id: finalLawyerId, role: "lawyer" }).select(
        "_id role name email"
      ),
      Post.findById(finalPostId),
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (String(post.client) !== String(finalClientId)) {
      return res.status(400).json({
        success: false,
        message: "This post does not belong to the selected client",
      });
    }

    const duplicateConnection = await Connection.findOne({
      _id: { $ne: connection._id },
      client: finalClientId,
      lawyer: finalLawyerId,
      post: finalPostId,
    });

    if (duplicateConnection) {
      return res.status(409).json({
        success: false,
        message:
          "Another connection already exists for this client, lawyer and post",
      });
    }

    const now = new Date();

    connection.client = finalClientId;
    connection.lawyer = finalLawyerId;
    connection.post = finalPostId;

    if (requestedBy && isValidObjectId(requestedBy)) {
      connection.requestedBy = requestedBy;
    }

    if (requestMessage !== undefined) {
      connection.requestMessage = String(requestMessage || "").trim();
    }

    if (responseMessage !== undefined) {
      connection.responseMessage = String(responseMessage || "").trim();
    }

    if (status && status !== connection.status) {
      connection.status = status;
      connection.acceptedAt = status === "accepted" ? now : null;
      connection.rejectedAt = status === "rejected" ? now : null;
      connection.cancelledAt = status === "cancelled" ? now : null;
      connection.blockedAt = status === "blocked" ? now : null;
    }

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message: "Connection updated successfully by admin",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// STATUS ACTIONS
// =========================

export const acceptConnectionRequest = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { responseMessage = "" } = req.body;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canRespondConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to accept this request",
      });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending request can be accepted. Current status: ${connection.status}`,
      });
    }

    const now = new Date();

    connection.status = "accepted";
    connection.acceptedAt = now;
    connection.rejectedAt = null;
    connection.cancelledAt = null;
    connection.blockedAt = null;
    connection.responseMessage = String(responseMessage || "").trim();

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message:
        "Connection request accepted successfully. Conversation is now available.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectConnectionRequest = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { responseMessage = "" } = req.body;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canRespondConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to reject this request",
      });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending request can be rejected. Current status: ${connection.status}`,
      });
    }

    connection.status = "rejected";
    connection.rejectedAt = new Date();
    connection.responseMessage = String(responseMessage || "").trim();

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message: "Connection request rejected successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelConnectionRequest = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      String(connection.requestedBy) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only requester can cancel this request",
      });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending request can be cancelled. Current status: ${connection.status}`,
      });
    }

    connection.status = "cancelled";
    connection.cancelledAt = new Date();

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message: "Connection request cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// MESSAGES
// =========================

export const sendConnectionMessage = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { message, attachments } = req.body;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to message in this connection",
      });
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Messaging is available only after connection is accepted",
      });
    }

    const allowedMessaging = await ensureMessagingAllowed(req);

    if (!allowedMessaging) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to send messages.",
      });
    }

    connection.messages.push({
      sender: req.user.id,
      message: String(message).trim(),
      attachments: normalizeAttachments(attachments),
      readBy: [req.user.id],
    });

    connection.lastMessageAt = new Date();

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));
    const latestMessage = result.messages[result.messages.length - 1];

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        connection: result,
        message: latestMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getConnectionMessages = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await populateConnection(
      Connection.findById(connectionId)
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view messages",
      });
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Messages are available only after connection is accepted",
      });
    }

    const allowedMessaging = await ensureMessagingAllowed(req);

    if (!allowedMessaging) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to view messages.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: connection.messages,
    });
  } catch (error) {
    next(error);
  }
};

export const markConnectionMessagesAsRead = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update messages",
      });
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message:
          "Messages can be marked as read only after connection is accepted",
      });
    }

    connection.messages.forEach((item) => {
      const alreadyRead = item.readBy.some(
        (readerId) => String(readerId) === String(req.user.id)
      );

      if (!alreadyRead) {
        item.readBy.push(req.user.id);
      }
    });

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message: "Messages marked as read successfully",
      data: result.messages,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// CONTACT
// =========================

export const getConnectionContactDetails = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await populateConnection(
      Connection.findById(connectionId)
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view contact details",
      });
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Contact details are available only after accepted connection",
      });
    }

    const allowedContactUnlock =
      req.user.role === "admin" ||
      (await hasBooleanFeature(req.user.id, "contact_unlock"));

    if (!allowedContactUnlock) {
      return res.status(403).json({
        success: false,
        message: "Contact unlock is a paid feature. Please upgrade your plan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact details fetched successfully",
      data: {
        connectionId: connection._id,
        client: {
          id: connection.client._id,
          name: connection.client.name,
          email: connection.client.email,
          phone: connection.client.phone,
        },
        lawyer: {
          id: connection.lawyer._id,
          name: connection.lawyer.name,
          email: connection.lawyer.email,
          phone: connection.lawyer.phone,
          lawRegNumber: connection.lawyer.lawRegNumber,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// ADMIN: DELETE CONNECTION
// =========================

export const adminDeleteConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete connection",
      });
    }

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findByIdAndDelete(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Connection deleted successfully by admin",
    });
  } catch (error) {
    next(error);
  }
};
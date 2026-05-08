import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.js";

import {
  createConnectionRequest,
  getMyConnections,
  getConnectionById,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  sendConnectionMessage,
  getConnectionMessages,
  markConnectionMessagesAsRead,
  getConnectionContactDetails,
  adminCreateConnection,
  adminUpdateConnection,
  adminDeleteConnection,
} from "../controllers/connection.controller.js";

const router = express.Router();

// =========================
// ADMIN CRUD ROUTES
// IMPORTANT: keep these before "/:connectionId"
// =========================

router.post(
  "/admin/create",
  protect,
  authorizeRoles("admin"),
  adminCreateConnection
);

router.patch(
  "/admin/:connectionId",
  protect,
  authorizeRoles("admin"),
  adminUpdateConnection
);

router.delete(
  "/admin/:connectionId",
  protect,
  authorizeRoles("admin"),
  adminDeleteConnection
);

// =========================
// USER / SHARED ROUTES
// =========================

router.post(
  "/request",
  protect,
  authorizeRoles("client", "lawyer"),
  createConnectionRequest
);

router.get(
  "/my",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getMyConnections
);

router.get(
  "/:connectionId",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getConnectionById
);

router.patch(
  "/:connectionId/accept",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  acceptConnectionRequest
);

router.patch(
  "/:connectionId/reject",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  rejectConnectionRequest
);

router.patch(
  "/:connectionId/cancel",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  cancelConnectionRequest
);

router.post(
  "/:connectionId/messages",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  sendConnectionMessage
);

router.get(
  "/:connectionId/messages",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getConnectionMessages
);

router.patch(
  "/:connectionId/messages/read",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  markConnectionMessagesAsRead
);

router.get(
  "/:connectionId/contact",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getConnectionContactDetails
);

export default router;
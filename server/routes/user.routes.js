import express from "express";

import {
  registerClient,
  registerLawyer,
  registerAdmin,
  loginUser,
  getPublicLawyers,
  getAllUsers,
  getUsersDropdown,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// =========================
// PUBLIC ROUTES
// =========================

// REGISTER
router.post("/register/client", registerClient);
router.post("/register/lawyer", registerLawyer);
router.post("/register/admin", registerAdmin);

// LOGIN
router.post("/login", loginUser);

// PUBLIC LAWYER LISTING
// Example:
// /api/users/lawyers?search=rahman&subscriptionStatus=active&phoneVerified=true&limit=12
router.get("/lawyers", getPublicLawyers);

// =========================
// ADMIN PROTECTED ROUTES
// =========================

// Dropdown users for admin post create/update
// Example: /api/users/dropdown?role=client&limit=50
router.get("/dropdown", protect, adminOnly, getUsersDropdown);

// Get all users with cursor pagination
// Example: /api/users?limit=20&role=client&search=rahim
router.get("/", protect, adminOnly, getAllUsers);

// Update user
router.put("/:id", protect, adminOnly, updateUser);

// Delete user
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;
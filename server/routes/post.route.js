import express from "express";
import {
  createPost,
  getAllPosts,
  getSinglePost,
  getMyPosts,
  updatePost,
  deletePost,
  placeBid,
  withdrawBid,
  acceptBid,
  closePost,
  cancelPost,
  adminGetAllPosts,
  adminGetSinglePost,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
} from "../controllers/post.controller.js";

import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                               CLIENT SPECIAL                               */
/* -------------------------------------------------------------------------- */

router.get("/client/my-posts", protect, authorizeRoles("client"), getMyPosts);

/* -------------------------------------------------------------------------- */
/*                                  ADMIN                                     */
/* -------------------------------------------------------------------------- */

router.get("/admin/all", protect, authorizeRoles("admin"), adminGetAllPosts);
router.get("/admin/:id", protect, authorizeRoles("admin"), adminGetSinglePost);
router.post("/admin/create", protect, authorizeRoles("admin"), adminCreatePost);
router.patch(
  "/admin/update/:id",
  protect,
  authorizeRoles("admin"),
  adminUpdatePost
);
router.delete(
  "/admin/delete/:id",
  protect,
  authorizeRoles("admin"),
  adminDeletePost
);

/* -------------------------------------------------------------------------- */
/*                                  PUBLIC                                    */
/* -------------------------------------------------------------------------- */

router.get("/", getAllPosts);
router.get("/:id", getSinglePost);

/* -------------------------------------------------------------------------- */
/*                                  CLIENT                                    */
/* -------------------------------------------------------------------------- */

router.post("/", protect, authorizeRoles("client"), createPost);
router.patch("/:id", protect, authorizeRoles("client", "admin"), updatePost);
router.delete("/:id", protect, authorizeRoles("client", "admin"), deletePost);

router.patch(
  "/:id/accept-bid/:bidId",
  protect,
  authorizeRoles("client", "admin"),
  acceptBid
);

router.patch(
  "/:id/close",
  protect,
  authorizeRoles("client", "admin"),
  closePost
);

router.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("client", "admin"),
  cancelPost
);

/* -------------------------------------------------------------------------- */
/*                                  LAWYER                                    */
/* -------------------------------------------------------------------------- */

router.post("/:id/bid", protect, authorizeRoles("lawyer"), placeBid);

router.patch(
  "/:id/withdraw-bid/:bidId",
  protect,
  authorizeRoles("lawyer"),
  withdrawBid
);

export default router;
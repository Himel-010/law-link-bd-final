import express from "express";
import { protect } from "../middleware/auth.js";
import {
  requireActiveSubscription,
  checkNumericFeatureLimit,
} from "../middleware/subscriptionAccess.js";

import Proposal from "../models/proposal.model.js";
import { createProposal } from "../controllers/proposal.controller.js";

const router = express.Router();

router.post(
  "/",
  protect,
  requireActiveSubscription,
  checkNumericFeatureLimit("proposal_limit", async (req) => {
    return Proposal.countDocuments({
      lawyer: req.user.id,
      createdAt: {
        $gte: req.subscription.startDate,
        $lte: req.subscription.endDate,
      },
    });
  }),
  createProposal
);

export default router;
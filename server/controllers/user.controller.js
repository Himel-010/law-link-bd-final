import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { assignFreeSubscriptionToUser } from "../utils/subscription.utils.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeLimit = (limit = DEFAULT_LIMIT) => {
  const safeLimit = Math.max(Number(limit) || DEFAULT_LIMIT, 1);
  return Math.min(safeLimit, MAX_LIMIT);
};

const encodeCursor = (doc) => {
  if (!doc) return null;

  const payload = {
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    id: doc._id.toString(),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    );

    if (!parsed?.createdAt || !parsed?.id || !isValidObjectId(parsed.id)) {
      return null;
    }

    const createdAt = new Date(parsed.createdAt);

    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return {
      createdAt,
      id: new mongoose.Types.ObjectId(parsed.id),
    };
  } catch {
    return null;
  }
};

const getCursorFilter = (cursor) => {
  const decoded = decodeCursor(cursor);

  if (!decoded) return {};

  return {
    $or: [
      { createdAt: { $lt: decoded.createdAt } },
      {
        createdAt: decoded.createdAt,
        _id: { $lt: decoded.id },
      },
    ],
  };
};

const buildUserFilter = (query = {}) => {
  const { role, search, subscriptionStatus } = query;

  const filter = {};

  if (role && role !== "all") {
    filter.role = role;
  }

  if (subscriptionStatus && subscriptionStatus !== "all") {
    filter.subscriptionStatus = subscriptionStatus;
  }

  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { email: { $regex: search.trim(), $options: "i" } },
      { phone: { $regex: search.trim(), $options: "i" } },
      { nid: { $regex: search.trim(), $options: "i" } },
      { lawRegNumber: { $regex: search.trim(), $options: "i" } },
    ];
  }

  return filter;
};

const getSafeUserData = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || null,
  nid: user.nid || null,
  lawRegNumber: user.lawRegNumber || null,
  phoneVerified: user.phoneVerified || 0,
  role: user.role,
  subscriptionStatus: user.subscriptionStatus,
  currentSubscription: user.currentSubscription,
});

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const registerClient = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: "client",
    });

    await assignFreeSubscriptionToUser(user);

    const finalUser = await User.findById(user._id)
      .select("-password")
      .populate(
        "currentSubscription",
        "planName planSlug roleType status startDate endDate price currency features"
      );

    const token = generateToken(finalUser);

    return res.status(201).json({
      success: true,
      message: "Client registered successfully. Free plan activated.",
      user: getSafeUserData(finalUser),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register client",
      error: err.message,
    });
  }
};

export const registerLawyer = async (req, res) => {
  try {
    const { name, email, nid, lawRegNumber, phone, phoneVerified, password } =
      req.body;

    if (!name || !email || !nid || !lawRegNumber || !phone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, nid, lawRegNumber, phone and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      nid: nid.trim(),
      lawRegNumber: lawRegNumber.trim(),
      phone: phone.trim(),
      phoneVerified: Number(phoneVerified) === 1 ? 1 : 0,
      password: hashedPassword,
      role: "lawyer",
    });

    await assignFreeSubscriptionToUser(user);

    const finalUser = await User.findById(user._id)
      .select("-password")
      .populate(
        "currentSubscription",
        "planName planSlug roleType status startDate endDate price currency features"
      );

    const token = generateToken(finalUser);

    return res.status(201).json({
      success: true,
      message: "Lawyer registered successfully. Free plan activated.",
      user: getSafeUserData(finalUser),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register lawyer",
      error: err.message,
    });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      password: hashedPassword,
      role: "admin",
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      user: getSafeUserData(user),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register admin",
      error: err.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    let user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (["client", "lawyer"].includes(user.role) && user.subscriptionStatus === "none") {
      await assignFreeSubscriptionToUser(user);
    }

    user = await User.findById(user._id)
      .select("-password")
      .populate(
        "currentSubscription",
        "planName planSlug roleType status startDate endDate price currency features"
      );

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful ✅",
      user: getSafeUserData(user),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
};

export const getPublicLawyers = async (req, res) => {
  try {
    const {
      search = "",
      subscriptionStatus = "all",
      phoneVerified = "all",
      cursor,
      limit = 12,
    } = req.query;

    const safeLimit = normalizeLimit(limit);

    const filter = {
      role: "lawyer",
    };

    if (subscriptionStatus && subscriptionStatus !== "all") {
      filter.subscriptionStatus = subscriptionStatus;
    }

    if (phoneVerified && phoneVerified !== "all") {
      filter.phoneVerified = phoneVerified === "true" ? 1 : 0;
    }

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
        { lawRegNumber: { $regex: search.trim(), $options: "i" } },
        { nid: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const cursorFilter = getCursorFilter(cursor);

    const finalFilter = Object.keys(cursorFilter).length
      ? { $and: [filter, cursorFilter] }
      : filter;

    const lawyers = await User.find(finalFilter)
      .select(
        "name email phone role lawRegNumber phoneVerified subscriptionStatus currentSubscription createdAt"
      )
      .populate({
        path: "currentSubscription",
        select:
          "planName planSlug roleType status startDate endDate price currency features",
      })
      .sort({
        subscriptionStatus: 1,
        createdAt: -1,
        _id: -1,
      })
      .limit(safeLimit + 1)
      .lean();

    const hasNextPage = lawyers.length > safeLimit;
    const data = hasNextPage ? lawyers.slice(0, safeLimit) : lawyers;
    const nextCursor = hasNextPage ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({
      success: true,
      message: "Lawyers fetched successfully",
      meta: {
        limit: safeLimit,
        hasNextPage,
        nextCursor,
      },
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lawyers",
      error: err.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = normalizeLimit(req.query.limit);
    const filter = buildUserFilter(req.query);
    const cursorFilter = getCursorFilter(cursor);

    const finalFilter = Object.keys(cursorFilter).length
      ? { $and: [filter, cursorFilter] }
      : filter;

    const users = await User.find(finalFilter)
      .select("-password")
      .populate(
        "currentSubscription",
        "planName planSlug roleType status startDate endDate price currency features"
      )
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(limit + 1)
      .lean();

    const hasNextPage = users.length > limit;
    const data = hasNextPage ? users.slice(0, limit) : users;
    const nextCursor = hasNextPage ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      meta: {
        limit,
        hasNextPage,
        nextCursor,
      },
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

export const getUsersDropdown = async (req, res) => {
  try {
    const { role = "client", search = "", cursor } = req.query;
    const limit = normalizeLimit(req.query.limit || 50);

    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const cursorFilter = getCursorFilter(cursor);

    const finalFilter = Object.keys(cursorFilter).length
      ? { $and: [filter, cursorFilter] }
      : filter;

    const users = await User.find(finalFilter)
      .select("name email phone role createdAt")
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(limit + 1)
      .lean();

    const hasNextPage = users.length > limit;
    const data = hasNextPage ? users.slice(0, limit) : users;
    const nextCursor = hasNextPage ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({
      success: true,
      message: "Dropdown users fetched successfully",
      meta: {
        limit,
        hasNextPage,
        nextCursor,
      },
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dropdown users",
      error: err.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const updateData = { ...req.body };

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();

      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.phone) updateData.phone = updateData.phone.trim();
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate(
        "currentSubscription",
        "planName planSlug roleType status startDate endDate price currency features"
      );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: err.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    if (req.user?.id?.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: err.message,
    });
  }
};
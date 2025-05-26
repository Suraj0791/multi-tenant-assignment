import express from "express";
import { auth } from "../middleware/auth.js";
import {
  ensureOrganizationAccess,
  ensureAdminAccess,
  ensureManagerAccess,
  ensureOrganizationData,
} from "../middleware/organizationAuth.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import { generateInviteToken } from "../utils/invitation.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get organization details
router.get("/", ensureOrganizationAccess, async (req, res) => {
  try {
    const organization = await Organization.findById(
      req.user.organization
    ).select("-__v");

    res.json({ organization });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get organization settings
router.get("/settings", ensureOrganizationAccess, async (req, res) => {
  try {
    const organization = await Organization.findById(
      req.user.organization
    ).select("settings name description website");

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Ensure settings object exists
    if (!organization.settings) {
      organization.settings = {
        categories: [
          "Development",
          "Design",
          "Marketing",
          "Sales",
          "Support",
          "Other",
        ],
        priorities: ["low", "medium", "high"],
      };
      await organization.save();
    }

    res.json({
      settings: organization.settings,
      name: organization.name,
      description: organization.description,
      website: organization.website,
    });
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update organization settings (admin only)
router.put(
  "/settings",
  ensureAdminAccess,
  ensureOrganizationAccess,
  async (req, res) => {
    try {
      const organization = await Organization.findById(req.user.organization);

      if (req.body.settings) {
        organization.settings = {
          ...organization.settings,
          ...req.body.settings,
        };
      }

      if (req.body.name) organization.name = req.body.name;
      if (req.body.description) organization.description = req.body.description;
      if (req.body.website) organization.website = req.body.website;

      await organization.save();
      res.json({ organization });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get organization members
router.get("/members", ensureOrganizationAccess, async (req, res) => {
  try {
    const members = await User.find({ organization: req.user.organization })
      .select("-password")
      .sort({ role: 1, firstName: 1 });

    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member role (admin only)
router.put("/members/:userId/role", ensureAdminAccess, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "manager", "member"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const member = await User.findOne({
      _id: req.params.userId,
      organization: req.user.organization,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    member.role = role;
    await member.save();

    res.json({ member });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove member from organization (admin only)
router.delete("/members/:userId", ensureAdminAccess, async (req, res) => {
  try {
    const member = await User.findOne({
      _id: req.params.userId,
      organization: req.user.organization,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    member.organization = null;
    member.role = "member";
    await member.save();

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invitation (admin and manager only)
router.post("/invites", ensureManagerAccess, async (req, res) => {
  try {
    const { email, role } = req.body;

    // Validate role
    if (!["member", "manager"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if user already exists in organization
    const existingUser = await User.findOne({
      email,
      organization: req.user.organization,
    });

    if (existingUser) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Create invitation
    const invitation = new Invitation({
      email,
      role,
      organization: req.user.organization,
      createdBy: req.user._id,
      token: generateInviteToken(),
    });

    await invitation.save();

    // Generate invite link
    const inviteLink = `${process.env.FRONTEND_URL}/join/${invitation.token}`;

    // Log invite link for development
    console.log("\n=== Invitation Link ===");
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    console.log(`Link: ${inviteLink}`);
    console.log("=====================\n");

    // TODO: Send invitation email
    // Note: Currently using Resend's free tier which only allows sending to the account it was created with
    // For development, please use the console log above to get the invite link

    res.status(201).json({
      invitation,
      inviteLink,
      note: "Due to email service limitations, please use the console log to get the invite link",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending invitations (admin and manager only)
router.get("/invites", ensureManagerAccess, async (req, res) => {
  try {
    const invitations = await Invitation.find({
      organization: req.user.organization,
      status: "pending",
    }).populate("createdBy", "firstName lastName email");

    res.json({ invitations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel invitation (admin and manager only)
router.delete("/invites/:inviteId", ensureManagerAccess, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.inviteId,
      organization: req.user.organization,
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    invitation.status = "expired";
    await invitation.save();

    res.json({ message: "Invitation cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

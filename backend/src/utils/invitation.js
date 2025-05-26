import crypto from "crypto";

/**
 * Generates a secure random token for invitations
 * @returns {string} A secure random token
 */
export const generateInviteToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Validates an invitation token format
 * @param {string} token The token to validate
 * @returns {boolean} Whether the token is valid
 */
export const isValidInviteToken = (token) => {
  return typeof token === "string" && token.length === 64;
};

import crypto from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Readable, avoids O, 0, I, 1

export const generateExamKey = (length = 6): string => {
  let key = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    key += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return key;
};

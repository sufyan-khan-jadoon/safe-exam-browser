import { api } from "./api";
import { SignupInput, LoginInput } from "../../../backend/src/validators/auth.validator";

export const authService = {
  signup: async (data: SignupInput) => {
    const response = await api.post("/auth/signup", data);
    return response.data;
  },

  login: async (data: LoginInput) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post(`/verification/verify/${token}`);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/password/forgot", { email });
    return response.data;
  },

  resetPassword: async (password: string, token: string) => {
    const response = await api.post(`/password/reset/${token}`, { password });
    return response.data;
  },
};

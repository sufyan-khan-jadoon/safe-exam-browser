import api from "./api";

export const proctorService = {
  logViolation: async (type: string, description?: string) => {
    const response = await api.post("/student/violation", { type, description });
    return response.data;
  },

  getExamSessions: async (examId: string) => {
    const response = await api.get(`/exams/${examId}/sessions`);
    return response.data;
  },
};

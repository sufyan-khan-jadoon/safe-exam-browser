import api from "./api";

export interface ExamData {
  id?: string;
  examKey?: string;
  examTitle: string;
  examDescription?: string;
  durationInMinutes: number;
  totalMarks: number;
  passingMarks: number;
  examStartDate: string | Date;
  examEndDate: string | Date;
  isPublished?: boolean;
}

export const examService = {
  createExam: async (data: ExamData) => {
    const response = await api.post("/exams", data);
    return response.data;
  },

  getExams: async () => {
    const response = await api.get("/exams");
    return response.data;
  },

  getExamById: async (id: string) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  updateExam: async (id: string, data: Partial<ExamData>) => {
    const response = await api.put(`/exams/${id}`, data);
    return response.data;
  },

  deleteExam: async (id: string) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },
};

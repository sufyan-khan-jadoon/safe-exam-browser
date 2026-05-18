import api from "./api";

export interface QuestionData {
  id?: string;
  examId?: string;
  questionText: string;
  questionType: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  options: string[];
  correctAnswer: string;
  points: number;
}

export const questionService = {
  createQuestion: async (examId: string, data: QuestionData) => {
    const response = await api.post(`/exams/${examId}/questions`, data);
    return response.data;
  },

  getQuestionsForExam: async (examId: string) => {
    const response = await api.get(`/exams/${examId}/questions`);
    return response.data;
  },

  updateQuestion: async (id: string, data: Partial<QuestionData>) => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
  },

  deleteQuestion: async (id: string) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },
};

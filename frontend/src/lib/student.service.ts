import api from "./api";

export interface StudentJoinData {
  fullName: string;
  rollNumber: string;
  examKey: string;
}

export const studentService = {
  joinExam: async (data: StudentJoinData) => {
    const response = await api.post("/student/join", data);
    return response.data;
  },

  getStudentExam: async () => {
    const response = await api.get("/student/exam");
    return response.data;
  },

  saveAnswer: async (questionId: string, answerText: string) => {
    const response = await api.post("/student/answers", { questionId, answerText });
    return response.data;
  },

  submitExam: async () => {
    const response = await api.post("/student/submit");
    return response.data;
  },
};

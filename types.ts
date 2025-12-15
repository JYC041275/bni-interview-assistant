export interface BniFormData {
  // Header Info
  applicationDate: string;
  introducer: string;
  applicantName: string;
  companyName: string;
  taxId: string; // 統編
  jobTitle: string;
  interviewDate: string;
  location: string;
  category: string;
  interviewer: string; // 訪談委員

  // Preliminary
  webSearchInfo: string;
  interviewerOpinion: string;
  introducerOpinion: string;

  // Questions 1-23 (Mapping to the keys in the PDF)
  q1_motivation: string;
  q2_advantage: string;
  q3_expectation: string;
  q4_attendance_commitment: string;
  q5_attendance_rules_check: string;
  q6_substitute_availability: string;
  q7_invite_guest: string;
  q8_special_events: string;
  q9_business_verification: string;
  q10_industry_background: string;
  q11_client_source: string;
  q12_team_status: string;
  q13_favorite_part: string;
  q14_previous_bni: string;
  q15_other_organizations: string;
  q16_training_commitment: string;
  q17_one_to_one: string;
  q18_leadership_role: string;
  q19_fees_awareness: string;
  q20_non_refundable: string;
  q21_induction_ceremony: string;
  q22_member_questions: string;
  q23_system_questions: string;

  // Attachments
  photos: string[]; // Base64 data strings
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUSD: number;
  costNTD: number;
  timestamp: number;
}

export interface AnalysisResult {
  summary: string;
  transcript: string; // With speaker labels
  formData: BniFormData;
  tokenUsage?: TokenUsage; // Optional for backward compatibility
}

export type AIModel = 'gemini' | 'deepseek';

export const INITIAL_FORM_DATA: BniFormData = {
  applicationDate: new Date().toISOString().split('T')[0],
  introducer: "",
  applicantName: "",
  companyName: "",
  taxId: "",
  jobTitle: "",
  interviewDate: new Date().toISOString().split('T')[0],
  location: "九宮格會議室",
  category: "",
  interviewer: "",
  webSearchInfo: "",
  interviewerOpinion: "",
  introducerOpinion: "",
  q1_motivation: "",
  q2_advantage: "",
  q3_expectation: "",
  q4_attendance_commitment: "",
  q5_attendance_rules_check: "",
  q6_substitute_availability: "",
  q7_invite_guest: "",
  q8_special_events: "",
  q9_business_verification: "",
  q10_industry_background: "",
  q11_client_source: "",
  q12_team_status: "",
  q13_favorite_part: "",
  q14_previous_bni: "",
  q15_other_organizations: "",
  q16_training_commitment: "",
  q17_one_to_one: "",
  q18_leadership_role: "",
  q19_fees_awareness: "",
  q20_non_refundable: "",
  q21_induction_ceremony: "",
  q22_member_questions: "",
  q23_system_questions: "",
  photos: []
};

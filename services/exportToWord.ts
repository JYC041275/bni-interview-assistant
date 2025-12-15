import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { BniFormData } from '../types';

// Helper function to convert base64 to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const exportToWord = async (formData: BniFormData, summary: string, transcript: string) => {
    const children: Paragraph[] = [
        // Title
        new Paragraph({
            children: [
                new TextRun({
                    text: "BNI 台北市北區長安分會申請入會訪談",
                    size: 36, // 18pt
                    color: "FF0000", // Red
                    bold: true,
                })
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        }),

        new Paragraph({
            text: "建議 60 分鐘內完成",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }),

        // Header Information
        new Paragraph({
            children: [
                new TextRun({ text: "申請日期：", bold: true }),
                new TextRun(formData.applicationDate)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "引薦人：", bold: true }),
                new TextRun(formData.introducer)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "姓名：", bold: true }),
                new TextRun(formData.applicantName)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "申請公司：", bold: true }),
                new TextRun(formData.companyName)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "統編：", bold: true }),
                new TextRun(formData.taxId)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "職稱：", bold: true }),
                new TextRun(formData.jobTitle)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "訪談時間：", bold: true }),
                new TextRun(formData.interviewDate)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "訪談地點：", bold: true }),
                new TextRun(formData.location)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "專業類別：", bold: true }),
                new TextRun(formData.category)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "訪談委員：", bold: true }),
                new TextRun(formData.interviewer)
            ],
            spacing: { after: 200 }
        }),

        // Preliminary Info
        new Paragraph({
            children: [
                new TextRun({ text: "網路搜尋相關資訊：", bold: true })
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: formData.webSearchInfo,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({ text: "訪談委員個人意見：", bold: true })
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: formData.interviewerOpinion,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({ text: "引薦人的意見：", bold: true })
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: formData.introducerOpinion,
            spacing: { after: 400 }
        }),

        // Summary Section (Moved to before Questions)
        new Paragraph({
            children: [
                new TextRun({ text: "會議摘要", bold: true, size: 28 }) // ~14pt
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
        }),
        new Paragraph({
            text: summary || "尚無摘要資料",
            spacing: { after: 400 }
        }),

        // Questions Section
        new Paragraph({
            children: [
                new TextRun({ text: "訪談記錄", bold: true, size: 28 })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
        }),

        // All 23 questions
        ...createQuestionParagraphs(1, "您為何決定加入 BNI？為何選擇長安分會？想要成就一個什麼樣的分會？", formData.q1_motivation),
        ...createQuestionParagraphs(2, "您認為自己能為 BNI 及長安分會帶來什麼優勢？", formData.q2_advantage),
        ...createQuestionParagraphs(3, "您期待在 BNI 及長安分會得到什麼？", formData.q3_expectation),
        ...createQuestionParagraphs(4, "每週四早上 6:30 的會議會不會影響您的行程？每週 120 分鐘的會議你能全程參與嗎？", formData.q4_attendance_commitment),
        ...createQuestionParagraphs(5, "BNI 有非常明確的出席規定。", formData.q5_attendance_rules_check),
        ...createQuestionParagraphs(6, "如果無法親自出席，您找的到代理人嗎？", formData.q6_substitute_availability),
        ...createQuestionParagraphs(7, "入會當天，分會需要你至少邀請一位來賓參加例會，見證你的入會宣誓。你是否願意有承諾的邀請至少一位來賓?", formData.q7_invite_guest),
        ...createQuestionParagraphs(8, "每一年分會都會有一些特別活動來增加引薦數量（例如 BOD 來賓日），您願意邀請能受益的人來嗎？", formData.q8_special_events),
        ...createQuestionParagraphs(9, "在審核過程中，我們想確定您在我們分會申請的代表產業別是？您提供哪些產品或服務？主要產品、服務是什麼？", formData.q9_business_verification),
        ...createQuestionParagraphs(10, "什麼機緣開始接觸這個領域？從事這個領域有多久？是否有別的事業同時進行中？", formData.q10_industry_background),
        ...createQuestionParagraphs(11, "您主要客戶來源和背景是什麼？", formData.q11_client_source),
        ...createQuestionParagraphs(12, "您是否有團隊？", formData.q12_team_status),
        ...createQuestionParagraphs(13, "在你的專業中，您最喜歡哪一部份？", formData.q13_favorite_part),
        ...createQuestionParagraphs(14, "您曾經申請加入別的 BNI 分會嗎？在那裡的經驗如何？為何離開？", formData.q14_previous_bni),
        ...createQuestionParagraphs(15, "您有參加其他的交流團體嗎？有什麼經驗？", formData.q15_other_organizations),
        ...createQuestionParagraphs(16, "新會員夥伴需要在入會六週內參加會員成功培訓，日後會有一對一與引薦工作坊，這如同 BNI 的使用說明書，能夠幫助新夥伴快速進入狀況，您能出席嗎？", formData.q16_training_commitment),
        ...createQuestionParagraphs(17, "所有會員夥伴都要加入成功護照計畫。您願意在例會以外的時間與會員夥伴約一對一嗎？", formData.q17_one_to_one),
        ...createQuestionParagraphs(18, "若未來 6 到 12 個月中將請您擔任領導職位，您願意思考適合哪個職位並在時機成熟時幫忙嗎？", formData.q18_leadership_role),
        ...createQuestionParagraphs(19, "您知道還需另外缴交餐費 / 場地費嗎？費用是每月 1700 元在大直的美福飯店實體會議，另外交給秘書財務。", formData.q19_fees_awareness),
        ...createQuestionParagraphs(20, "入會後會費是不能退的，在入會申請表上有註明。您目前尚未通過審核，在暸解這些資訊後，有因為哪個部分而覺得 BNI 可能不適合您或是您所屬專業嗎？", formData.q20_non_refundable),
        ...createQuestionParagraphs(21, "訪談結束後，會員委員會會在 14 個工作天進行討論及投票，並通知你是否可以入會。通知後你需要在兩週內宣誓入會。你是否願意?", formData.q21_induction_ceremony),
        ...createQuestionParagraphs(22, "您對於 BNI 會員身份還有什麼疑問嗎？", formData.q22_member_questions),
        ...createQuestionParagraphs(23, "關於 BNI 系統或長安分會還有什麼問題嗎？", formData.q23_system_questions),

        // Photos Section (if any)
        ...(formData.photos && formData.photos.length > 0 ? [
            new Paragraph({
                children: [
                    new TextRun({ text: "照片佐證", bold: true, size: 28 })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            }),
            ...formData.photos.flatMap((photoBase64, index) => {
                try {
                    const imageData = base64ToUint8Array(photoBase64);
                    return [
                        new Paragraph({
                            text: `照片 ${index + 1}`,
                            spacing: { before: 200, after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageData,
                                    transformation: {
                                        width: 400,
                                        height: 300,
                                    },
                                    type: 'png' // Specify if known, or it might infer
                                })
                            ],
                            spacing: { after: 200 }
                        })
                    ];
                } catch (error) {
                    console.error(`處理照片 ${index + 1} 時發生錯誤:`, error);
                    return [];
                }
            })
        ] : [])
    ];

    // Create document with children
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: {
                            name: "Microsoft JhengHei",
                            eastAsia: "Microsoft JhengHei"
                        },
                    },
                },
                heading1: {
                    run: {
                        font: {
                            name: "Microsoft JhengHei",
                            eastAsia: "Microsoft JhengHei"
                        },
                        bold: true,
                    }
                },
                heading2: {
                    run: {
                        font: {
                            name: "Microsoft JhengHei",
                            eastAsia: "Microsoft JhengHei"
                        },
                        bold: true,
                    }
                }
            },
        },
        sections: [{
            properties: {},
            children: children
        }]
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `BNI訪談記錄_${formData.applicantName || '未命名'}_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, fileName);
};

function createQuestionParagraphs(num: number, question: string, answer: string): Paragraph[] {
    return [
        new Paragraph({
            children: [
                new TextRun({ text: `${num}. `, bold: true }),
                new TextRun({ text: question, bold: true })
            ],
            spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: `回覆 ${num}：`, bold: true, color: "C41E3A" }),
                new TextRun(` ${answer || '(尚未填寫)'}`)
            ],
            spacing: { after: 100 }
        })
    ];
}

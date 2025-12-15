import React from 'react';
import { BniFormData } from '../types';

interface Props {
  data: BniFormData;
  onChange: (field: keyof BniFormData, value: any) => void;
}

const QuestionBlock = ({
  num,
  question,
  value,
  onChange,
  subtext
}: {
  num: number | string;
  question: string;
  value: string;
  onChange: (val: string) => void;
  subtext?: string;
}) => (
  <div className="mb-6 break-inside-avoid">
    <div className="font-bold text-gray-900 mb-1 flex gap-2">
      <span>{num}.</span>
      <span>{question}</span>
    </div>
    {subtext && <div className="text-sm text-gray-600 mb-2 whitespace-pre-line ml-6">{subtext}</div>}
    <div className="flex gap-2 ml-6">
      <span className="font-bold text-red-700 shrink-0">回覆{typeof num === 'number' ? '' : ` ${num}`}：</span>
      <textarea
        className="w-full p-2 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-gray-800 resize-y overflow-hidden"
        style={{ minHeight: '5rem' }}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
      />
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="text-xl font-bold text-red-600 border-b-2 border-red-200 pb-1 mb-4 mt-8 break-after-avoid">{title}</h3>
);

export const RecordForm: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 pb-24 shadow-lg min-h-screen print:shadow-none print:max-w-none print:w-full print:p-0 print:pb-12 print:min-h-0" id="bni-form-print">
      {/* Header */}
      <div className="mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold text-center mb-2">BNI 台北市北區長安分會申請入會訪談</h1>
        <p className="text-center text-sm text-gray-500 mb-6">建議 60 分鐘內完成</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center"><label className="w-24 font-bold">申請日期：</label><input type="text" value={data.applicationDate} onChange={e => onChange('applicationDate', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
            <div className="flex items-center"><label className="w-24 font-bold">引薦人：</label><input type="text" value={data.introducer} onChange={e => onChange('introducer', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
            <div className="flex items-center"><label className="w-24 font-bold">姓名：</label><input type="text" value={data.applicantName} onChange={e => onChange('applicantName', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
            <div className="flex items-center"><label className="w-24 font-bold">申請公司：</label><input type="text" value={data.companyName} onChange={e => onChange('companyName', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
            <div className="flex items-center"><label className="w-24 font-bold">統編：</label><input type="text" value={data.taxId} onChange={e => onChange('taxId', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
            <div className="flex items-center"><label className="w-24 font-bold">職稱：</label><input type="text" value={data.jobTitle} onChange={e => onChange('jobTitle', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center"><label className="w-24 font-bold">訪談時間：</label><input type="text" value={data.interviewDate} onChange={e => onChange('interviewDate', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
            <div className="flex items-center"><label className="w-24 font-bold">訪談地點：</label><input type="text" value={data.location} onChange={e => onChange('location', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
            <div className="flex items-center"><label className="w-24 font-bold">專業類別：</label><input type="text" value={data.category} onChange={e => onChange('category', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
            <div className="flex items-center"><label className="w-24 font-bold">訪談委員：</label><input type="text" value={data.interviewer} onChange={e => onChange('interviewer', e.target.value)} className="flex-1 border-b border-gray-300 focus:border-red-500 outline-none" /></div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <label className="font-bold block">網路搜尋相關資訊：</label>
            <textarea className="w-full border-b border-gray-300 focus:border-red-500 outline-none resize-none" rows={2} value={data.webSearchInfo} onChange={e => onChange('webSearchInfo', e.target.value)} />
          </div>
          <div>
            <label className="font-bold block">訪談委員個人意見：</label>
            <textarea className="w-full border-b border-gray-300 focus:border-red-500 outline-none resize-none" rows={2} value={data.interviewerOpinion} onChange={e => onChange('interviewerOpinion', e.target.value)} />
          </div>
          <div>
            <label className="font-bold block">引薦人的意見：</label>
            <textarea className="w-full border-b border-gray-300 focus:border-red-500 outline-none resize-none" rows={2} value={data.introducerOpinion} onChange={e => onChange('introducerOpinion', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Main Questions */}
      <SectionHeader title="訪談記錄：" />

      <QuestionBlock
        num={1}
        question="您為何決定加入 BNI？為何選擇長安分會？想要成就一個什麼樣的分會？"
        subtext="建立人脈、拓展業務、合作機會，期望與優秀企業家互相成長。"
        value={data.q1_motivation}
        onChange={(v) => onChange('q1_motivation', v)}
      />

      <QuestionBlock
        num={2}
        question="您認為自己能為 BNI 及長安分會帶來什麼優勢？"
        value={data.q2_advantage}
        onChange={(v) => onChange('q2_advantage', v)}
      />

      <QuestionBlock
        num={3}
        question="您期待在 BNI 及長安分會得到什麼？"
        value={data.q3_expectation}
        onChange={(v) => onChange('q3_expectation', v)}
      />

      <QuestionBlock
        num={4}
        question="每週四早上 6:30 的會議會不會影響您的行程？每週 120 分鐘的會議你能全程參與嗎？"
        value={data.q4_attendance_commitment}
        onChange={(v) => onChange('q4_attendance_commitment', v)}
      />

      <QuestionBlock
        num={5}
        question="BNI 有非常明確的出席規定。"
        subtext={`現在我想跟您說明清楚，讓您更瞭解規定。在每 6 個月的滾動會期中，最多只能缺席 3 次。如果缺席 4 次就必須離開分會。如果有代理人出席就不算缺席。代理人不一定要和你同行業，他可以是任何願意代為出席幫你簡報的人。代理人在每 6 個月內最多只能使用 3 次。關於出席規定有什麼疑問嗎？`}
        value={data.q5_attendance_rules_check}
        onChange={(v) => onChange('q5_attendance_rules_check', v)}
      />

      <QuestionBlock
        num={6}
        question="如果無法親自出席，您找的到代理人嗎？"
        value={data.q6_substitute_availability}
        onChange={(v) => onChange('q6_substitute_availability', v)}
      />

      <QuestionBlock
        num={7}
        question="入會當天，分會需要你至少邀請一位來賓參加例會，見證你的入會宣誓。你是否願意有承諾的邀請至少一位來賓? (可以是你的配偶 重要合夥人及代理人)"
        value={data.q7_invite_guest}
        onChange={(v) => onChange('q7_invite_guest', v)}
      />

      <QuestionBlock
        num={8}
        question="每一年分會都會有一些特別活動來增加引薦數量（例如 BOD 來賓日），您願意邀請能受益的人來嗎？ 願意參與。"
        value={data.q8_special_events}
        onChange={(v) => onChange('q8_special_events', v)}
      />

      <QuestionBlock
        num={9}
        question="在審核過程中，我們想確定您在我們分會申請的代表產業別是？您提供哪些產品或服務？主要產品、服務是什麼？（若有多項，請委員務必追問營業額的比例）"
        value={data.q9_business_verification}
        onChange={(v) => onChange('q9_business_verification', v)}
      />

      <QuestionBlock
        num={10}
        question="什麼機緣開始接觸這個領域？從事這個領域有多久？是否有別的事業同時進行中？"
        value={data.q10_industry_background}
        onChange={(v) => onChange('q10_industry_background', v)}
      />

      <QuestionBlock
        num={11}
        question="您主要客戶來源和背景是什麼？ 企業主與高階經理人。"
        value={data.q11_client_source}
        onChange={(v) => onChange('q11_client_source', v)}
      />

      <QuestionBlock
        num={12}
        question="您是否有團隊？ 有。"
        value={data.q12_team_status}
        onChange={(v) => onChange('q12_team_status', v)}
      />

      <QuestionBlock
        num={13}
        question="在你的專業中，您最喜歡哪一部份？"
        value={data.q13_favorite_part}
        onChange={(v) => onChange('q13_favorite_part', v)}
      />

      <QuestionBlock
        num={14}
        question="您曾經申請加入別的 BNI 分會嗎？在那裡的經驗如何？為何離開？"
        value={data.q14_previous_bni}
        onChange={(v) => onChange('q14_previous_bni', v)}
      />

      <QuestionBlock
        num={15}
        question="您有參加其他的交流團體嗎？有什麼經驗？"
        value={data.q15_other_organizations}
        onChange={(v) => onChange('q15_other_organizations', v)}
      />

      <QuestionBlock
        num={16}
        question="新會員夥伴需要在入會六週內參加會員成功培訓，日後會有一對一與引薦工作坊，這如同 BNI 的使用說明書，能夠幫助新夥伴快速進入狀況，您能出席嗎？"
        value={data.q16_training_commitment}
        onChange={(v) => onChange('q16_training_commitment', v)}
      />

      <QuestionBlock
        num={17}
        question="所有會員夥伴都要加入成功護照計畫。您願意在例會以外的時間與會員夥伴約一對一嗎？"
        value={data.q17_one_to_one}
        onChange={(v) => onChange('q17_one_to_one', v)}
      />

      <QuestionBlock
        num={18}
        question="若未來 6 到 12 個月中將請您擔任領導職位，您願意思考適合哪個職位並在時機成熟時幫忙嗎？"
        value={data.q18_leadership_role}
        onChange={(v) => onChange('q18_leadership_role', v)}
      />

      <QuestionBlock
        num={19}
        question="您知道還需另外缴交餐費 / 場地費嗎？費用是每月 1700 元在大直的美福飯店實體會議，另外交給秘書財務。"
        value={data.q19_fees_awareness}
        onChange={(v) => onChange('q19_fees_awareness', v)}
      />

      <QuestionBlock
        num={20}
        question="入會後會費是不能退的，在入會申請表上有註明。您目前尚未通過審核，在暸解這些資訊後，有因為哪個部分而覺得 BNI 可能不適合您或是您所屬專業嗎？"
        value={data.q20_non_refundable}
        onChange={(v) => onChange('q20_non_refundable', v)}
      />

      <QuestionBlock
        num={21}
        question="訪談結束後，會員委員會會在 14 個工作天進行討論及投票，並通知你是否可以入會。通知後你需要在兩週內宣誓入會。你是否願意?"
        value={data.q21_induction_ceremony}
        onChange={(v) => onChange('q21_induction_ceremony', v)}
      />

      <QuestionBlock
        num={22}
        question="您對於 BNI 會員身份還有什麼疑問嗎？"
        value={data.q22_member_questions}
        onChange={(v) => onChange('q22_member_questions', v)}
      />

      <QuestionBlock
        num={23}
        question="關於 BNI 系統或長安分會還有什麼問題嗎？"
        value={data.q23_system_questions}
        onChange={(v) => onChange('q23_system_questions', v)}
      />

      <div className="mt-8 pt-4 border-t-2 border-gray-300 break-inside-avoid">
        <SectionHeader title="照片佐證 (最多 5 張)" />
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            {data.photos.map((photo, index) => (
              <div key={index} className="relative w-96 border rounded-lg overflow-hidden group" style={{ aspectRatio: '4/3' }}>
                <img src={`data:image/jpeg;base64,${photo}`} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    const newPhotos = [...data.photos];
                    newPhotos.splice(index, 1);
                    onChange('photos', newPhotos);
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="移除"
                >
                  &times;
                </button>
              </div>
            ))}
            {data.photos.length < 5 && (
              <label className="w-96 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors" style={{ aspectRatio: '4/3' }}>
                <span className="text-4xl text-gray-400 mb-1">+</span>
                <span className="text-xs text-gray-500">上傳照片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length + data.photos.length > 5) {
                      alert("最多只能上傳 5 張照片");
                      return;
                    }

                    Promise.all(files.map(file => new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                      reader.readAsDataURL(file as Blob);
                    }))).then(newImages => {
                      onChange('photos', [...data.photos, ...newImages]);
                    });
                  }}
                />
              </label>
            )}
          </div>
          <p className="text-sm text-gray-500">支援 jpg, png 格式,建議上傳訪談實況或合照。</p>
        </div>

        <p className="font-bold text-gray-800 mb-2">請務必告知申請人：長安會員委員會目前審核的速度，約為訪談後 7-10 天完成。</p>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
          <li>若收到「審核通過」的通知，請在收到通知的三天內完成繳費，長安的秘書財務將會協助刷卡或匯款；如未如期完成繳費，將視同撤回審核通過，將開放給相同專業類別的其他來賓申請入會。</li>
          <li>繳費完成後的兩週內，亦須完成報到宣誓手續。如無正當理由完成宣誓報到，分會得開出信用證，請申請人最快於六個月後，才能再重新申請入會。（信用證於兩年內必須啟用）</li>
        </ol>

        <p className="font-bold text-gray-800 mt-6 mb-2">副主席給委員的溫馨提醒：</p>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
          <li>盡量約訪在對方辦公室並拍攝照片，將是值得參考的資料。</li>
          <li>抱著好奇、感興趣的態度，而非詰問的態度來做訪談，是對申請人基本的尊重。</li>
          <li>做委員的好處是能多結識一位申請人。</li>
          <li>請不要隨意承諾會申請通過或是不會通過。</li>
          <li>會員的訪談角度中立，切勿因為申請人的審核通過與否而產生負面情緒。</li>
        </ol>
      </div>

    </div>
  );
};
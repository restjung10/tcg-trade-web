export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 text-sm leading-relaxed text-black dark:text-zinc-50">
      <h1 className="mb-6 text-xl font-bold">개인정보처리방침</h1>

      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        TCGinside(이하 &ldquo;사이트&rdquo;)는 이용자의 개인정보를 중요시하며,
        「개인정보보호법」 등 관련 법령을 준수합니다. 본 방침은 사이트가 어떤
        개인정보를 어떤 목적으로 수집·이용하고, 어떻게 보호하는지 안내합니다.
      </p>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">1. 수집하는 개인정보 항목 및 수집 방법</h2>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
          <li>카카오 로그인 시 카카오로부터 제공받는 정보: 이메일, 카카오 고유 회원번호</li>
          <li>사이트에서 직접 입력하는 정보: 닉네임</li>
          <li>
            계좌 인증 시 입력하는 정보: 은행명, 예금주명, 계좌번호(계좌번호는
            AES-256-GCM 방식으로 암호화하여 저장하며, 거래 상대방에게 공유되는
            시점 외에는 열람할 수 없습니다)
          </li>
          <li>서비스 이용 중 생성되는 정보: 게시글·이미지·채팅 내용, 신고 내역</li>
          <li>부정 이용 방지를 위한 접속 로그, 서비스 이용 기록</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">2. 개인정보의 수집 및 이용 목적</h2>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
          <li>회원 식별 및 1인 1계정 원칙 유지(중복 가입 방지)</li>
          <li>
            계좌 인증을 통한 실명 확인 — 사기 거래 방지를 위한 판매/구매 게시글
            작성 및 채팅 이용 자격 부여
          </li>
          <li>게시글 이미지의 AI 생성 여부 판별을 통한 허위 매물 방지</li>
          <li>신고 처리, 부정 이용자 제재 및 재가입 방지</li>
          <li>서비스 제공, 부정 이용 방지, 고객 문의 대응</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">3. 개인정보 처리의 위탁</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          사이트는 게시글에 첨부된 이미지의 AI 생성 여부 판별을 위해 해외
          업체인 Sightengine에 이미지 데이터 처리를 위탁하고 있습니다. 위탁받은
          업체는 해당 목적 범위 내에서만 데이터를 처리합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">4. 개인정보의 보유 및 이용 기간</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          회원 탈퇴 시 닉네임, 카카오 고유 회원번호 등 식별 정보는 지체 없이
          익명 처리·파기합니다. 다만 거래 상대방 보호 및 사기 이력 추적을
          위해 게시글·채팅 내용은 익명화된 상태로 보존되며, 관계 법령에 따라
          보존 의무가 있는 정보는 해당 기간 동안 별도 보관 후 파기합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">5. 개인정보의 제3자 제공</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          사이트는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
          다만 거래 진행 과정에서 계좌 정보는 실제 거래 상대방에게만
          공개되며, 법령에 근거하거나 수사기관의 적법한 요청이 있는 경우
          예외로 합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">6. 정보주체의 권리와 행사 방법</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할
          수 있으며, 마이페이지에서 직접 회원탈퇴(개인정보 삭제)를 할 수
          있습니다. 그 외 문의는 아래 연락처로 요청할 수 있습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">7. 개인정보의 안전성 확보 조치</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          계좌번호 등 민감한 정보는 암호화하여 저장하며, 데이터베이스 접근
          권한을 최소한으로 제한하고 있습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">8. 개인정보 보호책임자</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          이메일: restjung10@naver.com
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">9. 시행일자</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          본 방침은 2026년 7월 6일부터 시행됩니다.
        </p>
      </section>
    </div>
  );
}

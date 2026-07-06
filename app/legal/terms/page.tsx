export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 text-sm leading-relaxed text-black dark:text-zinc-50">
      <h1 className="mb-6 text-xl font-bold">이용약관</h1>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">제1조 (목적)</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          이 약관은 TCGinside(이하 &ldquo;사이트&rdquo;)가 제공하는 TCG 카드
          거래 커뮤니티 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여
          사이트와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로
          합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">제2조 (회원가입 및 계정)</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          서비스는 만 14세 이상만 이용할 수 있으며, 카카오 계정을 통한 로그인
          방식으로 가입합니다. 부정 이용 방지를 위해 1인당 1개의 계정만
          허용되며, 동일인이 여러 계정을 생성하거나 관리자에 의해 차단된
          카카오 계정으로 재가입을 시도하는 행위는 금지됩니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">
          제3조 (통신판매중개자로서의 지위 및 책임 제한)
        </h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          사이트는 회원 간 TCG 카드 거래를 위한 정보통신서비스를 제공하는{" "}
          <strong>통신판매중개자</strong>이며, 직접 상품을 판매하거나 구매하는{" "}
          <strong>통신판매의 당사자가 아닙니다.</strong> 게시글에 등록된
          상품의 정보, 가격, 상태에 대한 정확성 및 거래(대금 결제, 배송,
          하자 등)의 이행 책임은 거래 당사자인 판매 회원과 구매 회원 본인에게
          있으며, 사이트는 이에 대해 원칙적으로 책임을 지지 않습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">제4조 (회원의 의무)</h2>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
          <li>허위 매물, 사기, 실물과 다른 이미지 등록 등을 금지합니다.</li>
          <li>타인의 계좌 정보 등 개인정보를 도용하거나 악용해서는 안 됩니다.</li>
          <li>
            신고 접수 또는 계좌 인증 반려 등 사유로 관리자가 이용을 제한할 수
            있으며, 제재된 계정의 카카오 계정은 재가입이 제한될 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">제5조 (서비스의 변경 및 중단)</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          사이트는 운영상, 기술상 필요에 따라 서비스의 전부 또는 일부를
          변경하거나 중단할 수 있습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">제6조 (면책조항)</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          사이트는 회원 간 거래에 직접 개입하지 않으며, 거래 과정에서 발생한
          분쟁, 사기, 손해에 대해 관계 법령이 정하는 경우를 제외하고 책임을
          지지 않습니다. 다만 사기 방지를 위해 계좌 인증, 신고, 이용 제한 등의
          장치를 운영합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">제7조 (분쟁 해결 및 준거법)</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          이 약관은 대한민국 법령에 따라 규율되며, 서비스 이용과 관련해
          분쟁이 발생할 경우 원만한 해결을 위해 노력합니다.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">부칙</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          이 약관은 2026년 7월 6일부터 시행됩니다.
        </p>
      </section>
    </div>
  );
}

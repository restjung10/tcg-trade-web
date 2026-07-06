"use client";

import { useTransition } from "react";
import { withdrawAccount } from "@/lib/actions/account";
import { Button } from "@/components/ui/Button";

export function WithdrawButton() {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (
      !window.confirm(
        "정말로 회원탈퇴 하시겠습니까? 로그아웃되며, 닉네임/프로필 사진 등 개인정보는 삭제됩니다.",
      )
    ) {
      return;
    }
    startTransition(() => {
      withdrawAccount();
    });
  };

  return (
    <Button onClick={handleClick} variant="danger" disabled={pending}>
      {pending ? "처리 중..." : "회원탈퇴"}
    </Button>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  shareAccount,
  confirmPayment,
  shareTracking,
  confirmReceipt,
  cancelTrade,
  getSharedAccountInfo,
} from "@/lib/actions/tradeTransaction";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

export type TradeTransaction = {
  id: string;
  account_shared_at: string | null;
  payment_confirmed_at: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

type AccountInfo = {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
};

export function TransactionPanel({
  chatRoomId,
  currentUserId,
  payerId,
  shipperId,
  initialTransaction,
}: {
  chatRoomId: string;
  currentUserId: string;
  payerId: string;
  shipperId: string;
  initialTransaction: TradeTransaction | null;
}) {
  const [tx, setTx] = useState<TradeTransaction | null>(initialTransaction);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [trackingInput, setTrackingInput] = useState("");

  const isPayer = currentUserId === payerId;
  const isShipper = currentUserId === shipperId;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trade-transaction-${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trade_transactions",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          setTx(payload.new as TradeTransaction);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [chatRoomId]);

  useEffect(() => {
    if (tx?.account_shared_at && !accountInfo) {
      getSharedAccountInfo(chatRoomId).then((info) => {
        if (info) setAccountInfo(info);
      });
    }
  }, [tx?.account_shared_at, accountInfo, chatRoomId]);

  const runAction = (
    action: () => Promise<{ error?: string } | undefined>,
  ) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  if (tx?.completed_at) {
    return (
      <div className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
        거래가 완료되었습니다.
      </div>
    );
  }

  // 취소된 거래는 처음(계좌 전송 전) 상태로 되돌아간 것처럼 보여준다.
  const shared = Boolean(tx?.account_shared_at) && !tx?.cancelled_at;

  if (tx?.cancelled_at) {
    return (
      <div className="mb-4 flex flex-col gap-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
        <p className="text-zinc-500 dark:text-zinc-400">
          거래가 취소되었습니다.
        </p>
        {isShipper ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => runAction(() => shareAccount(chatRoomId))}
            className="self-start"
          >
            계좌 다시 전송
          </Button>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">
            상대방이 계좌를 다시 전송하면 여기에 표시됩니다.
          </p>
        )}
        {error && <p className="text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <p className="font-medium text-black dark:text-zinc-50">
          거래 진행 상황
        </p>
        {shared && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm("거래를 취소하시겠습니까?")) {
                runAction(() => cancelTrade(chatRoomId));
              }
            }}
            className="text-xs text-red-500 hover:underline"
          >
            거래 취소
          </button>
        )}
      </div>

      {!shared &&
        (isShipper ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => runAction(() => shareAccount(chatRoomId))}
            className="self-start"
          >
            계좌 전송
          </Button>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">
            상대방이 계좌를 전송하면 여기에 표시됩니다.
          </p>
        ))}

      {shared && accountInfo && (
        <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
          <p className="text-black dark:text-zinc-50">
            {accountInfo.bankName} {accountInfo.accountNumber}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            예금주: {accountInfo.accountHolderName}
          </p>
          <p className="mt-2 text-xs text-red-500">
            [주의] 여기 표시된 계좌가 아닌 다른 계좌로 입금을 요구하면
            사기꾼일 가능성이 높습니다.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(accountInfo.accountNumber)
              }
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              계좌번호 복사
            </button>
            <a
              href="https://thecheat.co.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              더치트에서 사기 이력 조회
            </a>
          </div>
        </div>
      )}

      {shared &&
        !tx?.payment_confirmed_at &&
        (isPayer ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => runAction(() => confirmPayment(chatRoomId))}
            className="self-start"
          >
            입금완료
          </Button>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">
            상대방의 입금완료 확인을 기다리고 있습니다.
          </p>
        ))}

      {tx?.payment_confirmed_at &&
        !tx.shipped_at &&
        (isShipper ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData();
              formData.set("trackingNumber", trackingInput);
              runAction(() => shareTracking(chatRoomId, formData));
            }}
            className="flex gap-2"
          >
            <input
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="송장번호"
              className={inputClass}
            />
            <Button type="submit" size="sm" disabled={pending}>
              송장번호 전송
            </Button>
          </form>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">
            상대방이 입금을 확인하고 배송을 준비하고 있습니다.
          </p>
        ))}

      {tx?.shipped_at && !tx.completed_at && (
        <>
          <p className="text-black dark:text-zinc-50">
            송장번호: {tx.tracking_number}
          </p>
          {isPayer ? (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => runAction(() => confirmReceipt(chatRoomId))}
              className="self-start"
            >
              수령확인
            </Button>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400">
              상대방의 수령확인을 기다리고 있습니다.
            </p>
          )}
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

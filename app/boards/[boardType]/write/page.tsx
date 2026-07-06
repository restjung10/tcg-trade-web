import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { boardTypeSchema } from "@/lib/validators/post";
import { createPost } from "@/lib/actions/posts";
import { PostForm } from "@/components/board/PostForm";
import { LinkButton } from "@/components/ui/LinkButton";

export default async function WritePostPage({
  params,
}: {
  params: Promise<{ boardType: string }>;
}) {
  const { boardType: boardTypeParam } = await params;
  const parsed = boardTypeSchema.safeParse(boardTypeParam);
  if (!parsed.success) {
    notFound();
  }
  const boardType = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const isApproved = bankAccount?.status === "approved";

  const action = createPost.bind(null, boardType);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-black dark:text-zinc-50">
        {boardType === "sell" ? "판매글" : "구매글"} 작성
      </h1>
      {isApproved ? (
        <PostForm
          action={action}
          submitLabel="등록"
          imageUpload={{ userId: user.id, boardType }}
        />
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-md border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">
            계좌 인증이 완료된 사용자만 글을 작성할 수 있습니다. 마이페이지에서
            계좌를 등록하고 관리자 승인을 받아주세요.
            {bankAccount?.status === "pending" && " (현재 심사 중입니다.)"}
            {bankAccount?.status === "rejected" &&
              " (이전 신청이 반려되었습니다. 다시 등록해주세요.)"}
          </p>
          <LinkButton href="/mypage" variant="primary">
            마이페이지로 이동
          </LinkButton>
        </div>
      )}
    </div>
  );
}

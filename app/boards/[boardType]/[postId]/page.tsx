import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { boardTypeSchema, BOARD_TITLE } from "@/lib/validators/post";
import { deletePost, updatePostStatus } from "@/lib/actions/posts";
import { startChat } from "@/lib/actions/chat";
import { StatusBadge } from "@/components/board/StatusBadge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { inputClass, type PostStatusValue } from "@/lib/ui";

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardType: string; postId: string }>;
  searchParams: Promise<{ reported?: string; chatLimited?: string }>;
}) {
  const { boardType: boardTypeParam, postId } = await params;
  const { reported, chatLimited } = await searchParams;
  const parsedBoardType = boardTypeSchema.safeParse(boardTypeParam);
  if (!parsedBoardType.success) {
    notFound();
  }
  const boardType = parsedBoardType.data;

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, content, price, status, view_count, created_at, author_id, profiles(nickname)",
    )
    .eq("id", postId)
    .eq("board_type", boardType)
    .single();

  if (!post) {
    notFound();
  }

  await createAdminClient().rpc("increment_post_view", {
    p_post_id: postId,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id === post.author_id;

  const profile = post.profiles as unknown as { nickname: string } | null;
  const authorNickname = profile?.nickname ?? "알수없음";
  const status = post.status as PostStatusValue;

  const { data: images } = await supabase
    .from("post_images")
    .select("final_path")
    .eq("post_id", postId)
    .eq("verification_status", "approved")
    .order("sort_order");

  const imageUrls = (images ?? [])
    .map((img) => img.final_path)
    .filter((path): path is string => Boolean(path))
    .map(
      (path) =>
        supabase.storage.from("post-images-final").getPublicUrl(path).data
          .publicUrl,
    );

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link
        href={`/boards/${boardType}`}
        className="mb-4 inline-block text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← {BOARD_TITLE[boardType]} 목록
      </Link>

      <div className="mb-4 border-b border-zinc-300 pb-4 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-black dark:text-zinc-50">
            {post.title}
          </h1>
          <StatusBadge status={status} />
        </div>
        <div className="mt-2 flex gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{authorNickname}</span>
          <span>{String(post.created_at).slice(0, 10)}</span>
          <span>조회 {post.view_count + 1}</span>
        </div>
      </div>

      {post.price !== null && (
        <p className="mb-4 text-xl font-bold text-indigo-600 dark:text-indigo-400">
          {post.price.toLocaleString("ko-KR")}원
        </p>
      )}

      {imageUrls.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={post.title}
              className="w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}

      {isAuthor ? (
        <div className="mb-6 flex flex-col gap-3 border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <form
            action={updatePostStatus.bind(null, boardType, postId)}
            className="flex items-center gap-2"
          >
            <select
              name="status"
              defaultValue={status === "completed" ? "trading" : status}
              className={inputClass}
            >
              <option value="trading">거래중</option>
              <option value="reserved">예약중</option>
            </select>
            <Button type="submit" variant="secondary">
              상태 변경
            </Button>
          </form>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            "거래완료"는 채팅방에서 거래 절차(계좌 전송 → 입금확인 → 송장전송 → 수령확인)를
            마치면 자동으로 전환됩니다.
          </p>
          <div className="flex gap-2">
            <LinkButton
              href={`/boards/${boardType}/${postId}/edit`}
              variant="secondary"
            >
              수정
            </LinkButton>
            <form action={deletePost.bind(null, boardType, postId)}>
              <Button type="submit" variant="danger">
                삭제
              </Button>
            </form>
          </div>
        </div>
      ) : (
        user && (
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-200 pb-6 dark:border-zinc-800">
            <form action={startChat.bind(null, boardType, postId)} className="flex-1">
              <Button type="submit" variant="primary" className="w-full">
                채팅하기
              </Button>
            </form>
            <Link
              href={`/boards/${boardType}/${postId}/report`}
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              신고
            </Link>
          </div>
        )
      )}

      {reported === "1" && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          신고가 접수되었습니다.
        </p>
      )}

      {chatLimited === "1" && (
        <p className="mb-4 text-sm text-red-500">
          채팅방을 너무 자주 시작하고 있습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}

      <p className="whitespace-pre-wrap text-black dark:text-zinc-50">
        {post.content}
      </p>
    </div>
  );
}

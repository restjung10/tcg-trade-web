import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { boardTypeSchema } from "@/lib/validators/post";
import { deletePost } from "@/lib/actions/posts";

const STATUS_LABEL = {
  trading: "거래중",
  reserved: "예약중",
  completed: "거래완료",
} as const;

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ boardType: string; postId: string }>;
}) {
  const { boardType: boardTypeParam, postId } = await params;
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
  const status = post.status as keyof typeof STATUS_LABEL;

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
      <div className="mb-4 border-b border-zinc-300 pb-4 dark:border-zinc-700">
        <h1 className="text-xl font-bold text-black dark:text-zinc-50">
          {post.title}
        </h1>
        <div className="mt-2 flex gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{authorNickname}</span>
          <span>{String(post.created_at).slice(0, 10)}</span>
          <span>조회 {post.view_count + 1}</span>
          <span>{STATUS_LABEL[status]}</span>
        </div>
      </div>

      {post.price !== null && (
        <p className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
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

      <p className="whitespace-pre-wrap text-black dark:text-zinc-50">
        {post.content}
      </p>

      {isAuthor && (
        <div className="mt-8 flex gap-2">
          <Link
            href={`/boards/${boardType}/${postId}/edit`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            수정
          </Link>
          <form action={deletePost.bind(null, boardType, postId)}>
            <button
              type="submit"
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-500 dark:border-red-900"
            >
              삭제
            </button>
          </form>
        </div>
      )}

      <div className="mt-8">
        <Link
          href={`/boards/${boardType}`}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          목록으로
        </Link>
      </div>
    </div>
  );
}

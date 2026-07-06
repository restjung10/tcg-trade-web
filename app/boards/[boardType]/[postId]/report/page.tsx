import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { boardTypeSchema } from "@/lib/validators/post";
import { ReportForm } from "@/components/board/ReportForm";

export default async function ReportPostPage({
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, author_id")
    .eq("id", postId)
    .eq("board_type", boardType)
    .single();

  if (!post) {
    notFound();
  }

  if (post.author_id === user.id) {
    redirect(`/boards/${boardType}/${postId}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-2 text-xl font-bold text-black dark:text-zinc-50">
        게시글 신고
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        {post.title}
      </p>
      <ReportForm boardType={boardType} postId={postId} />
    </div>
  );
}

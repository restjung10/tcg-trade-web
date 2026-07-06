import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { boardTypeSchema } from "@/lib/validators/post";
import { updatePost } from "@/lib/actions/posts";
import { PostForm } from "@/components/board/PostForm";

export default async function EditPostPage({
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
    .select("title, content, price, author_id")
    .eq("id", postId)
    .single();

  if (!post) {
    notFound();
  }

  if (post.author_id !== user.id) {
    redirect(`/boards/${boardType}/${postId}`);
  }

  const action = updatePost.bind(null, boardType, postId);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-black dark:text-zinc-50">
        게시글 수정
      </h1>
      <PostForm
        action={action}
        submitLabel="수정 완료"
        defaultValues={{
          title: post.title,
          content: post.content,
          price: post.price,
        }}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { boardTypeSchema } from "@/lib/validators/post";
import { createPost } from "@/lib/actions/posts";
import { PostForm } from "@/components/board/PostForm";

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

  const action = createPost.bind(null, boardType);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-black dark:text-zinc-50">
        {boardType === "sell" ? "판매글" : "구매글"} 작성
      </h1>
      <PostForm action={action} submitLabel="등록" />
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BoardType } from "@/lib/validators/post";

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UploadedImage = {
  path: string;
  previewUrl: string;
  fileName: string;
};

export function ImageUploader({
  userId,
  boardType,
  required,
}: {
  userId: string;
  boardType: BoardType;
  required: boolean;
}) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setError(null);

    if (images.length + files.length > MAX_FILES) {
      setError(`이미지는 최대 ${MAX_FILES}장까지 첨부할 수 있습니다.`);
      return;
    }

    const supabase = createClient();

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("jpg, png, webp 형식만 첨부할 수 있습니다.");
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError("이미지 1장당 10MB 이하만 첨부할 수 있습니다.");
        continue;
      }

      setUploading(true);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images-pending")
        .upload(path, file);

      if (uploadError) {
        setError("이미지 업로드 중 오류가 발생했습니다.");
        setUploading(false);
        continue;
      }

      setImages((prev) => [
        ...prev,
        { path, previewUrl: URL.createObjectURL(file), fileName: file.name },
      ]);
      setUploading(false);
    }
  };

  const handleRemove = async (path: string) => {
    const supabase = createClient();
    await supabase.storage.from("post-images-pending").remove([path]);
    setImages((prev) => prev.filter((img) => img.path !== path));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-zinc-600 dark:text-zinc-400">
        이미지{" "}
        {required ? (
          <span className="text-red-500">(최소 1장 필수)</span>
        ) : (
          "(선택)"
        )}
      </label>

      {boardType === "sell" && (
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          첨부한 이미지는 AI 생성 이미지 여부를 자동 검증하며, 통과한
          이미지에는 닉네임/날짜 워터마크가 자동으로 추가됩니다.
        </p>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploading || images.length >= MAX_FILES}
        onChange={(e) => handleFiles(e.target.files)}
        className="text-sm"
      />

      {uploading && <p className="text-sm text-zinc-500">업로드 중...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.path} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={img.fileName}
                className="h-24 w-24 rounded object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(img.path)}
                className="absolute -right-1 -top-1 rounded-full bg-black px-1.5 text-xs text-white"
              >
                x
              </button>
              <input type="hidden" name="imagePaths" value={img.path} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

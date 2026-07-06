import Link from "next/link";

export type ChatRoomSummary = {
  room_id: string;
  post_title: string;
  other_nickname: string;
  last_message: string | null;
  unread: boolean;
};

export function ChatRoomList({ rooms }: { rooms: ChatRoomSummary[] }) {
  if (rooms.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
        참여 중인 채팅방이 없습니다.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {rooms.map((room) => (
        <li key={room.room_id}>
          <Link
            href={`/chat/${room.room_id}`}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-black dark:text-zinc-50">
                {room.post_title}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {room.other_nickname}
                {room.last_message ? ` · ${room.last_message}` : ""}
              </span>
            </div>
            {room.unread && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

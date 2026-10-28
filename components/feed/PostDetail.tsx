"use client";
import { useRouter } from "next/navigation";
import { Post } from "@/types/petbook";
import { PostCard } from "./PostCard";
import { usePet } from "@/lib/context/PetContext";
export function PostDetail({ post }: { post: Post }) {
  const router = useRouter();
  const { activePet } = usePet();
  return <PostCard key={post.id + activePet?.id} post={post} expanded onPostDeleted={() => { router.push("/"); router.refresh(); }} />;
}

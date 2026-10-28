"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getCurrentUser,
  savePet,
  createPost,
  deletePost,
  toggleReaction,
  addComment,
  toggleFollow,
  markNotificationsAsRead,
  getFeedPosts,
  getComments,
  getPostById,
  getUnreadNotificationCount,
} from "@/lib/petbook-service";
import { ZodError, z } from "zod";
import { dbQuerySingle } from "@/lib/db";
import { assertOwnedMedia } from "@/lib/petbook-service";

function actionError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message || "Dữ liệu không hợp lệ.";
  if (error instanceof Error && !('code' in error)) return error.message;
  return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}
import { Pet, ReactionType } from "@/types/petbook";
import { redirect } from "next/navigation";

// Auth Actions
export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: `Đăng nhập thất bại: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function registerAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim() || email?.split("@")[0];

  if (!email || !password) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu." };
  }

  if (!z.string().email().safeParse(email).success || password.length < 8 || password.length > 128 || (fullName?.length || 0) > 80) {
    return { error: "Nhập email hợp lệ, tên tối đa 80 ký tự và mật khẩu từ 8–128 ký tự." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/pet/new`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: `Đăng ký thất bại: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { success: true, needsConfirmation: !data.session };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// Post Actions
export async function createPostAction(payload: {
  petId: string;
  content: string;
  visibility?: string;
  media?: { url: string; media_type?: "image" | "video"; mime_type?: string; file_size?: number }[];
}) {
  const { user } = await getCurrentUser();
  if (!user) {
    return { error: "Bạn cần đăng nhập để đăng bài." };
  }

  if (!payload.petId) {
    return { error: "Vui lòng chọn boss để đăng bài." };
  }

  try {
    const post = await createPost({
      petId: payload.petId,
      authorId: user.id,
      content: payload.content,
      visibility: payload.visibility,
      media: payload.media,
    });

    revalidatePath("/");
    revalidatePath(`/pet/[id]`, "page");
    return { success: true, post };
  } catch (err: any) {
    return { error: actionError(err) };
  }
}

export async function deletePostAction(postId: string) {
  const { user } = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập." };

  try {
    await deletePost(postId, user.id);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: actionError(err) };
  }
}

// Reaction Actions
export async function reactPostAction(postId: string, petId: string, type: ReactionType) {
  const { user } = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập." };

  try {
    const result = await toggleReaction(postId, petId, user.id, type);
    return { success: true, ...result };
  } catch (err: any) {
    return { error: actionError(err) };
  }
}

// Comment Actions
export async function addCommentAction(payload: {
  postId: string;
  petId: string;
  content: string;
  parentId?: string;
}) {
  const { user } = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập." };

  if (!z.string().trim().min(1).max(2000).safeParse(payload.content).success) return { error: "Bình luận cần từ 1 đến 2.000 ký tự." };

  try {
    const comment = await addComment({
      postId: payload.postId,
      petId: payload.petId,
      userId: user.id,
      content: payload.content,
      parentId: payload.parentId,
    });
    return { success: true, comment };
  } catch (err: any) {
    return { error: actionError(err) };
  }
}

// Follow Actions
export async function toggleFollowAction(followerPetId: string, followingPetId: string) {
  const { user } = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập." };

  try {
    const result = await toggleFollow(followerPetId, followingPetId, user.id);
    revalidatePath("/");
    revalidatePath(`/pet/[id]`, "page");
    return { success: true, ...result };
  } catch (err: any) {
    return { error: actionError(err) };
  }
}

// Pet Profile Actions
export async function savePetAction(petData: Partial<Pet> & { name: string; species: string }) {
  const { user } = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập." };

  if (!z.string().trim().min(1).max(80).safeParse(petData.name).success) return { error: "Tên boss cần từ 1 đến 80 ký tự." };

  try {
    const pet = await savePet({
      ...petData,
      owner_id: user.id,
    });

    revalidatePath("/");
    revalidatePath("/my-pets");
    revalidatePath(`/pet/${pet.slug}`);
    return { success: true, pet };
  } catch (err: any) {
    return { error: actionError(err) };
  }
}

// Notification Actions
export async function markNotificationsReadAction() {
  const { user } = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập." };

  try {
    await markNotificationsAsRead(user.id);
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    return { error: actionError(err) };
  }
}

export async function loadFeedAction(params: Parameters<typeof getFeedPosts>[0]) {
  try { return { posts: await getFeedPosts(params) }; }
  catch (error) { return { error: actionError(error) }; }
}

export async function updatePostAction(postId: string, content: string, visibility: string) {
  const { user } = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập." };
  const parsed = z.object({ id: z.string().uuid(), content: z.string().trim().max(10000), visibility: z.enum(["public", "followers", "private"]) }).safeParse({ id: postId, content, visibility });
  if (!parsed.success) return { error: "Nội dung hoặc quyền xem không hợp lệ." };
  try {
    const post = await getPostById(postId);
    if (!post || post.author_id !== user.id) return { error: "Bạn không có quyền sửa bài viết." };
    if (!parsed.data.content && !post.media.length) return { error: "Bài viết cần nội dung hoặc ảnh/video." };
    await dbQuerySingle("UPDATE public.posts SET content = $1, visibility = $2, updated_at = NOW() WHERE id = $3 AND author_id = $4 RETURNING id", [parsed.data.content, parsed.data.visibility, postId, user.id]);
    revalidatePath("/"); revalidatePath(`/post/${postId}`);
    return { success: true };
  } catch (error) { return { error: actionError(error) }; }
}

export async function getFollowStateAction(petId: string, targetId: string) {
  const { user, pets } = await getCurrentUser();
  if (!user || !pets.some(pet => pet.id === petId) || !z.string().uuid().safeParse(targetId).success) return { following: false };
  const row = await dbQuerySingle("SELECT 1 FROM public.follows WHERE follower_pet_id = $1 AND following_pet_id = $2", [petId, targetId]);
  return { following: Boolean(row) };
}

export async function notificationCountAction() {
  const { user } = await getCurrentUser();
  return { count: user ? await getUnreadNotificationCount(user.id) : 0 };
}

export async function markNotificationAction(id: string) {
  const { user } = await getCurrentUser();
  if (!user || !z.string().uuid().safeParse(id).success) return { error: "Thông báo không hợp lệ." };
  try {
    await dbQuerySingle("UPDATE public.notifications SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING id", [id, user.id]);
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) { return { error: actionError(error) }; }
}

export async function loadCommentsAction(postId: string, offset = 0) {
  if (!z.number().int().min(0).max(100000).safeParse(offset).success) return { error: "Trang bình luận không hợp lệ." };
  try { return { comments: await getComments(postId, offset) }; }
  catch (error) { return { error: actionError(error) }; }
}

export async function loadReactionAction(postId: string, petId: string) {
  try {
    const post = await getPostById(postId, petId);
    if (!post) return { error: "Không tìm thấy bài viết." };
    return { type: post.user_reaction || null, count: post.reaction_count };
  } catch (error) { return { error: actionError(error) }; }
}

export async function saveProfileAction(formData: FormData) {
  const { user, profile } = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập." };
  const result = z.object({
    display_name: z.string().trim().min(1).max(80),
    bio: z.string().trim().max(1000), avatar_url: z.string().max(2048),
  }).safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0].message };
  try {
    if (result.data.avatar_url && result.data.avatar_url !== profile?.avatar_url) assertOwnedMedia(result.data.avatar_url, user.id);
    await dbQuerySingle("UPDATE public.profiles SET display_name = $1, bio = $2, avatar_url = $3, updated_at = NOW() WHERE id = $4 RETURNING id", [result.data.display_name, result.data.bio, result.data.avatar_url || null, user.id]);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) { return { error: actionError(error) }; }
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Vui lòng nhập email hợp lệ." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: "Chưa gửi được email. Vui lòng thử lại sau." };
  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get("password");
  if (!z.string().min(8).max(128).safeParse(password).success) return { error: "Mật khẩu cần từ 8–128 ký tự." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Liên kết hết hạn. Hãy yêu cầu email đặt lại mật khẩu mới." };
  const { error } = await supabase.auth.updateUser({ password: password as string });
  if (error) return { error: "Không đổi được mật khẩu. Hãy thử liên kết mới." };
  return { success: true };
}

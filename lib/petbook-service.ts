import { dbQuery, dbQuerySingle, dbTransaction } from "@/lib/db";
import { cache } from "react";
import { cookies } from "next/headers";
import { feedInput, petInput, postAccessSql, postInput, uuid, mediaUrl } from "@/lib/social-validation";
import { Pet, Post, Comment, Reaction, Profile, ReactionType, Notification } from "@/types/petbook";
import { createClient } from "@/lib/supabase/server";

// 1. Get current logged in user & profile
export const getCurrentUser = cache(async (): Promise<{ user: any; profile: Profile | null; pets: Pet[] }> => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, profile: null, pets: [] };
    }

    // Fetch profile
    let profile = await dbQuerySingle<Profile>(
      `SELECT * FROM public.profiles WHERE id = $1`,
      [user.id]
    );

    // Auto-create profile if missing
    if (!profile) {
      const email = user.email || "";
      const baseName = email.split("@")[0] || "user";
      const cleanUsername = baseName.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || `user_${Date.now()}`;

      profile = await dbQuerySingle<Profile>(
        `INSERT INTO public.profiles (id, username, display_name, avatar_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [user.id, `${cleanUsername}_${user.id.slice(0, 8)}`, user.user_metadata?.full_name || baseName, null]
      );
    }

    // Fetch user's pets
    const pets = await dbQuery<Pet>(
      `SELECT * FROM public.pets WHERE owner_id = $1 ORDER BY created_at ASC`,
      [user.id]
    );

    return { user, profile, pets };
  } catch (err) {
    console.error("Unable to load user profile");
    throw new Error("Không thể kết nối tài khoản. Vui lòng thử lại.");
  }
});

export async function getActivePetId(): Promise<string | undefined> {
  const { pets } = await getCurrentUser();
  const saved = (await cookies()).get("petbook_active_pet_id")?.value;
  return pets.find(pet => pet.id === saved)?.id || pets[0]?.id;
}

export async function requireOwnedPet(petId: string, userId: string) {
  const pet = await dbQuerySingle<Pet>("SELECT * FROM public.pets WHERE id = $1 AND owner_id = $2", [uuid.parse(petId), userId]);
  if (!pet) throw new Error("Bạn chỉ có thể sử dụng hồ sơ thú cưng của mình.");
  return pet;
}

// 2. Pet CRUD
export async function getPetBySlug(slug: string, viewerPetId?: string): Promise<Pet | null> {
  const pet = await dbQuerySingle<Pet>(
    `SELECT p.*,
       json_build_object('id', pr.id, 'username', pr.username, 'display_name', pr.display_name, 'avatar_url', pr.avatar_url) as owner
     FROM public.pets p
     JOIN public.profiles pr ON pr.id = p.owner_id
     WHERE p.slug = $1`,
    [slug]
  );

  if (!pet) return null;

  if (viewerPetId && viewerPetId !== pet.id) {
    const followCheck = await dbQuerySingle(
      `SELECT 1 FROM public.follows WHERE follower_pet_id = $1 AND following_pet_id = $2`,
      [viewerPetId, pet.id]
    );
    pet.is_following = Boolean(followCheck);
  }

  return pet;
}

export async function getPetById(id: string): Promise<Pet | null> {
  if (!uuid.safeParse(id).success) return null;
  return await dbQuerySingle<Pet>(
    `SELECT p.*,
       json_build_object('id', pr.id, 'username', pr.username, 'display_name', pr.display_name, 'avatar_url', pr.avatar_url) as owner
     FROM public.pets p
     JOIN public.profiles pr ON pr.id = p.owner_id
     WHERE p.id = $1`,
    [id]
  );
}

export async function getUserPets(userId: string): Promise<Pet[]> {
  return await dbQuery<Pet>(
    `SELECT * FROM public.pets WHERE owner_id = $1 ORDER BY created_at ASC`,
    [userId]
  );
}

export async function savePet(data: Partial<Pet> & { owner_id: string; name: string; species: string }): Promise<Pet> {
  const ownerId = data.owner_id;
  const validated = petInput.parse(data);
  const existingPet = validated.id ? await requireOwnedPet(validated.id, ownerId) : null;
  for (const field of ["avatar_url", "cover_url"] as const) {
    if (validated[field] && validated[field] !== existingPet?.[field]) {
      assertOwnedMedia(validated[field]!, ownerId);
    }
  }
  data = { ...validated, owner_id: ownerId };
  const personalityJson = JSON.stringify(data.personality || []);
  let slug = data.slug;

  if (!slug) {
    slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "pet";
  }

  if (data.id) {
    const updated = await dbQuerySingle<Pet>(
      `UPDATE public.pets
       SET name = $1, breed = $2, gender = $3, birthday = $4, avatar_url = $5, cover_url = $6, bio = $7, personality = $8, species = $11, updated_at = NOW()
       WHERE id = $9 AND owner_id = $10
       RETURNING *`,
      [
        data.name,
        data.breed || null,
        data.gender || "male",
        data.birthday || null,
        data.avatar_url || null,
        data.cover_url || null,
        data.bio || null,
        personalityJson,
        data.id,
        data.owner_id,
        data.species,
      ]
    );
    if (!updated) throw new Error("Không thể cập nhật hồ sơ thú cưng.");
    return updated;
  }

  // Ensure unique slug
  let counter = 0;
  let finalSlug = slug;
  while (await dbQuerySingle(`SELECT 1 FROM public.pets WHERE slug = $1`, [finalSlug])) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }

  const inserted = await dbQuerySingle<Pet>(
    `INSERT INTO public.pets (owner_id, name, slug, species, breed, gender, birthday, avatar_url, cover_url, bio, personality)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.owner_id,
      data.name,
      finalSlug,
      data.species || "dog",
      data.breed || null,
      data.gender || "male",
      data.birthday || null,
      data.avatar_url || null,
      data.cover_url || null,
      data.bio || null,
      personalityJson,
    ]
  );

  return inserted!;
}

// 3. Feed Posts
export async function getFeedPosts(params: Partial<import("zod").infer<typeof feedInput>> = {}): Promise<Post[]> {
  const input = feedInput.parse(params);
  const { user, pets } = await getCurrentUser();
  const viewerPetId = pets.find(p => p.id === input.viewerPetId)?.id || await getActivePetId() || null;
  const values: unknown[] = [input.limit, input.offset, user?.id || null, viewerPetId];
  const where = [postAccessSql("$3")];
  const add = (value: unknown) => { values.push(value); return "$" + values.length; };
  if (input.petId) where.push("p.pet_id = " + add(input.petId));
  if (input.postId) where.push("p.id = " + add(input.postId));
  if (input.query) where.push("p.content ILIKE " + add("%" + input.query.replace(/[\\%_]/g, "\\$&") + "%"));
  if (input.mediaOnly) where.push("EXISTS (SELECT 1 FROM public.post_media m WHERE m.post_id = p.id)");
  if (input.mode === "following") where.push("EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_pet_id = $4 AND f.following_pet_id = p.pet_id)");
  if (input.memories) where.push("p.author_id = $3 AND (p.created_at AT TIME ZONE 'Asia/Bangkok')::date < (NOW() AT TIME ZONE 'Asia/Bangkok')::date AND to_char(p.created_at AT TIME ZONE 'Asia/Bangkok', 'MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Bangkok', 'MM-DD')");
  return dbQuery<Post>(
    `SELECT p.*, row_to_json(pt) as pet,
      json_build_object('id', pr.id, 'username', pr.username, 'display_name', pr.display_name, 'avatar_url', pr.avatar_url) as author,
      COALESCE((SELECT json_agg(pm ORDER BY pm.sort_order, pm.id) FROM public.post_media pm WHERE pm.post_id = p.id), '[]'::json) as media,
      (SELECT r.type FROM public.reactions r WHERE r.post_id = p.id AND r.pet_id = $4) as user_reaction,
      $4::uuid as user_reaction_pet_id,
      COALESCE((SELECT json_agg(c) FROM (
        SELECT c.*, json_build_object('id', cp.id, 'name', cp.name, 'slug', cp.slug, 'avatar_url', cp.avatar_url) as pet
        FROM public.comments c JOIN public.pets cp ON cp.id = c.pet_id WHERE c.post_id = p.id
        ORDER BY c.created_at, c.id LIMIT 3
      ) c), '[]'::json) as recent_comments
    FROM public.posts p JOIN public.pets pt ON pt.id = p.pet_id JOIN public.profiles pr ON pr.id = p.author_id
    WHERE ${where.join(" AND ")} ORDER BY p.created_at DESC, p.id DESC LIMIT $1 OFFSET $2`, values
  );
}

export async function getPostById(postId: string, viewerPetId?: string): Promise<Post | null> {
  if (!uuid.safeParse(postId).success) return null;
  return (await getFeedPosts({ postId, viewerPetId, limit: 1 }))[0] || null;
}

export function assertOwnedMedia(url: string, userId: string) {
  mediaUrl.parse(url);
  if (!url.startsWith("/api/media/" + userId + "/")) throw new Error("Tệp không thuộc tài khoản của bạn.");
}

export async function createPost(payload: {
  petId: string; authorId: string; content: string; visibility?: string;
  media?: { url: string; media_type?: "image" | "video"; mime_type?: string; file_size?: number }[];
}): Promise<Post> {
  const input = postInput.parse(payload);
  await requireOwnedPet(input.petId, payload.authorId);
  for (const item of input.media) assertOwnedMedia(item.url, payload.authorId);
  const postId = await dbTransaction(async client => {
    const { rows } = await client.query<{ id: string }>(
      "INSERT INTO public.posts (pet_id, author_id, content, visibility) VALUES ($1, $2, $3, $4) RETURNING id",
      [input.petId, payload.authorId, input.content, input.visibility]
    );
    for (const [index, media] of input.media.entries()) {
      await client.query("INSERT INTO public.post_media (post_id, url, media_type, mime_type, file_size, sort_order) VALUES ($1, $2, $3, $4, $5, $6)",
        [rows[0].id, media.url, media.media_type, media.mime_type || null, media.file_size || null, index]);
    }
    return rows[0].id;
  });
  const post = await getPostById(postId, input.petId);
  if (!post) throw new Error("Không thể đọc bài viết vừa tạo.");
  return post;
}

export async function deletePost(postId: string, authorId: string): Promise<boolean> {
  const deleted = await dbQuerySingle("DELETE FROM public.posts WHERE id = $1 AND author_id = $2 RETURNING id", [uuid.parse(postId), authorId]);
  if (!deleted) throw new Error("Bài viết không tồn tại hoặc bạn không có quyền xóa.");
  return true;
}

export async function toggleReaction(postId: string, petId: string, userId: string, type: ReactionType) {
  await requireOwnedPet(petId, userId);
  if (!["bone", "paw", "heart", "haha", "wow"].includes(type)) throw new Error("Cảm xúc không hợp lệ.");
  const post = await getPostById(postId, petId);
  if (!post) throw new Error("Không thể tương tác với bài viết này.");
  return dbTransaction(async client => {
    // Lock the post so concurrent toggles see an accurate counter.
    await client.query("SELECT id FROM public.posts WHERE id = $1 FOR UPDATE", [postId]);
    const existing = (await client.query<Reaction>("SELECT * FROM public.reactions WHERE post_id = $1 AND pet_id = $2", [postId, petId])).rows[0];
    let next: ReactionType | null = type;
    if (existing?.type === type) {
      await client.query("DELETE FROM public.reactions WHERE id = $1", [existing.id]);
      next = null;
    } else {
      await client.query("INSERT INTO public.reactions (post_id, pet_id, user_id, type) VALUES ($1, $2, $3, $4) ON CONFLICT (post_id, pet_id) DO UPDATE SET type = EXCLUDED.type", [postId, petId, userId, type]);
    }
    if (!existing && post.author_id !== userId) {
      await client.query("INSERT INTO public.notifications (recipient_id, actor_pet_id, type, reference_id, message) VALUES ($1, $2, 'reaction', $3, $4)", [post.author_id, petId, postId, "Một boss vừa thả cảm xúc vào bài viết của bạn."]);
    }
    const count = (await client.query("SELECT reaction_count FROM public.posts WHERE id = $1", [postId])).rows[0]?.reaction_count || 0;
    return { reacted: next !== null, type: next, reaction_count: count };
  });
}

export async function getComments(postId: string, offset = 0): Promise<Comment[]> {
  if (!await getPostById(postId)) throw new Error("Bạn không có quyền xem bài viết.");
  return dbQuery<Comment>(`SELECT c.*, json_build_object('id', pt.id, 'name', pt.name, 'slug', pt.slug, 'avatar_url', pt.avatar_url) as pet
    FROM public.comments c JOIN public.pets pt ON pt.id = c.pet_id WHERE c.post_id = $1
    ORDER BY c.created_at, c.id LIMIT 30 OFFSET $2`, [postId, Math.max(0, Math.min(100000, Math.floor(offset)))]);
}

export async function addComment(payload: { postId: string; petId: string; userId: string; content: string; parentId?: string }): Promise<Comment> {
  const pet = await requireOwnedPet(payload.petId, payload.userId);
  const post = await getPostById(payload.postId);
  if (!post) throw new Error("Bạn không có quyền xem bài viết.");
  const content = payload.content.trim();
  if (!content || content.length > 2000) throw new Error("Bình luận cần từ 1 đến 2.000 ký tự.");
  if (payload.parentId) {
    if (!await dbQuerySingle("SELECT id FROM public.comments WHERE id = $1 AND post_id = $2", [uuid.parse(payload.parentId), post.id])) throw new Error("Bình luận trả lời không hợp lệ.");
  }
  const comment = await dbTransaction(async client => {
    const inserted = (await client.query<Comment>("INSERT INTO public.comments (post_id, pet_id, user_id, parent_id, content) VALUES ($1, $2, $3, $4, $5) RETURNING *", [post.id, pet.id, payload.userId, payload.parentId || null, content])).rows[0];
    if (post.author_id !== payload.userId) {
      await client.query("INSERT INTO public.notifications (recipient_id, actor_pet_id, type, reference_id, message) VALUES ($1, $2, 'comment', $3, $4)", [post.author_id, pet.id, post.id, pet.name + " đã bình luận vào bài viết của bạn."]);
    }
    return inserted;
  });
  return { ...comment, pet };
}

export async function toggleFollow(followerPetId: string, followingPetId: string, userId: string): Promise<{ following: boolean }> {
  const pet = await requireOwnedPet(followerPetId, userId);
  if (followerPetId === followingPetId) throw new Error("Boss không thể tự theo dõi mình.");
  const target = await getPetById(uuid.parse(followingPetId));
  if (!target) throw new Error("Không tìm thấy thú cưng.");
  return dbTransaction(async client => {
    await client.query("SELECT id FROM public.pets WHERE id = $1 FOR UPDATE", [followerPetId]);
    const removed = await client.query("DELETE FROM public.follows WHERE follower_pet_id = $1 AND following_pet_id = $2 RETURNING id", [followerPetId, followingPetId]);
    if (removed.rowCount) return { following: false };
    await client.query("INSERT INTO public.follows (follower_pet_id, following_pet_id) VALUES ($1, $2)", [followerPetId, followingPetId]);
    if (target.owner_id !== userId) await client.query("INSERT INTO public.notifications (recipient_id, actor_pet_id, type, reference_id, message) VALUES ($1, $2, 'follow', $3, $4)", [target.owner_id, pet.id, pet.id, pet.name + " vừa theo dõi " + target.name + "!"]);
    return { following: true };
  });
}

// 7. Suggested Pets
export async function getSuggestedPets(currentPetId?: string, limit = 5): Promise<Pet[]> {
  const queryParams: any[] = [limit];
  let excludeClause = "";

  if (currentPetId) {
    queryParams.push(currentPetId);
    excludeClause = `WHERE p.id != $2 AND NOT EXISTS (
      SELECT 1 FROM public.follows f WHERE f.follower_pet_id = $2 AND f.following_pet_id = p.id
    )`;
  }

  return await dbQuery<Pet>(
    `SELECT p.*,
       json_build_object('id', pr.id, 'username', pr.username, 'display_name', pr.display_name) as owner
     FROM public.pets p
     JOIN public.profiles pr ON pr.id = p.owner_id
     ${excludeClause}
     ORDER BY p.follower_count DESC, p.created_at DESC
     LIMIT $1`,
    queryParams
  );
}

// 8. Notifications
export async function getNotifications(userId: string, offset = 0): Promise<Notification[]> {
  return await dbQuery<Notification>(
    `SELECT n.*,
       json_build_object('id', pt.id, 'name', pt.name, 'slug', pt.slug, 'avatar_url', pt.avatar_url) as actor_pet
     FROM public.notifications n
     LEFT JOIN public.pets pt ON pt.id = n.actor_pet_id
     WHERE n.recipient_id = $1
     ORDER BY n.created_at DESC
     LIMIT 30 OFFSET $2`,
    [userId, offset]
  );
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const row = await dbQuerySingle<{ count: string }>("SELECT count(*) FROM public.notifications WHERE recipient_id = $1 AND NOT is_read", [userId]);
  return Number(row?.count || 0);
}

export async function searchPets(query = "", petSpecies = "", offset = 0): Promise<Pet[]> {
  return dbQuery<Pet>(`SELECT p.*, json_build_object('id', pr.id, 'username', pr.username, 'display_name', pr.display_name) as owner
    FROM public.pets p JOIN public.profiles pr ON pr.id = p.owner_id
    WHERE ($1 = '' OR p.name ILIKE $2 OR p.breed ILIKE $2 OR pr.username ILIKE $2)
    AND ($3 = '' OR p.species = $3) ORDER BY p.follower_count DESC, p.id LIMIT 24 OFFSET $4`,
    [query, '%' + query.replace(/[\\%_]/g, '\\$&') + '%', petSpecies, offset]);
}

export async function canReadMedia(url: string, userId: string | null): Promise<boolean> {
  if (userId && url.startsWith(`/api/media/${userId}/`)) return true;
  const row = await dbQuerySingle(`SELECT 1 WHERE
    EXISTS (SELECT 1 FROM public.post_media m JOIN public.posts p ON p.id = m.post_id WHERE m.url = $1 AND ${postAccessSql('$2')})
    OR EXISTS (SELECT 1 FROM public.pets WHERE avatar_url = $1 OR cover_url = $1)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE avatar_url = $1)`, [url, userId]);
  return Boolean(row);
}

export async function getBirthdayPets(): Promise<Pet[]> {
  const { user } = await getCurrentUser();
  if (!user) return [];
  return dbQuery<Pet>(`SELECT p.* FROM public.pets p WHERE p.birthday IS NOT NULL
    AND (p.owner_id = $1 OR EXISTS (SELECT 1 FROM public.follows f JOIN public.pets me ON me.id = f.follower_pet_id WHERE me.owner_id = $1 AND f.following_pet_id = p.id))
    AND to_char(p.birthday, 'MM-DD') IN (SELECT to_char(day, 'MM-DD') FROM generate_series((NOW() AT TIME ZONE 'Asia/Bangkok')::date, (NOW() AT TIME ZONE 'Asia/Bangkok')::date + 7, '1 day') day)
    ORDER BY p.birthday, p.id LIMIT 20`, [user.id]);
}

export async function markNotificationsAsRead(userId: string): Promise<boolean> {
  await dbQuery(`UPDATE public.notifications SET is_read = true WHERE recipient_id = $1`, [userId]);
  return true;
}

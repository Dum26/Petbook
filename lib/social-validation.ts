import { z } from "zod";

export const uuid = z.string().uuid("Mã không hợp lệ.");
export const species = z.enum(["dog", "cat", "bird", "hamster", "rabbit", "other"]);
export const speciesLabels = { dog: "Chó 🐶", cat: "Mèo 🐱", bird: "Chim 🐦", hamster: "Hamster 🐹", rabbit: "Thỏ 🐰", other: "Khác 🐾" };
export const mediaUrl = z.string().max(2048).refine(value => value === "" || /^\/api\/media\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp|gif|mp4|webm|mov)$/.test(value), "Hãy tải ảnh bằng nút tải lên của PetBook.");
export const postInput = z.object({
  petId: uuid,
  content: z.string().trim().max(10000, "Bài viết tối đa 10.000 ký tự."),
  visibility: z.enum(["public", "followers", "private"]).default("public"),
  media: z.array(z.object({ url: mediaUrl, media_type: z.enum(["image", "video"]).default("image"), mime_type: z.string().max(100).optional(), file_size: z.number().int().min(0).max(50 * 1024 * 1024).optional() })).max(10, "Mỗi bài tối đa 10 tệp.").default([]),
}).refine(value => value.content.length > 0 || value.media.length > 0, "Hãy viết nội dung hoặc chọn ảnh/video.");

export const petInput = z.object({
  id: uuid.optional(), name: z.string().trim().min(1).max(80), species,
  breed: z.string().trim().max(120).nullish(), gender: z.enum(["male", "female"]).default("male"),
  birthday: z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10)), "Ngày sinh không hợp lệ.").nullish(),
  avatar_url: z.string().max(2048).nullish(), cover_url: z.string().max(2048).nullish(),
  bio: z.string().trim().max(2000).nullish(), personality: z.array(z.string().trim().max(50)).max(15).default([]),
});

export const feedInput = z.object({
  petId: uuid.optional(), viewerPetId: uuid.optional(), postId: uuid.optional(),
  limit: z.number().int().min(1).max(30).default(20), offset: z.number().int().min(0).max(100000).default(0),
  mode: z.enum(["discover", "following"]).default("discover"),
  query: z.string().trim().max(100).default(""), mediaOnly: z.boolean().default(false), memories: z.boolean().default(false),
});

// Same policy as can_view_post() in the migration; identity comes only from the server.
export function postAccessSql(userParameter: string, alias = "p") {
  return `(${alias}.visibility = 'public' OR ${alias}.author_id = ${userParameter}::uuid OR
    (${alias}.visibility = 'followers' AND EXISTS (
      SELECT 1 FROM public.follows vf JOIN public.pets vp ON vp.id = vf.follower_pet_id
      WHERE vf.following_pet_id = ${alias}.pet_id AND vp.owner_id = ${userParameter}::uuid)))`;
}

export function birthdayDaysAway(birthday: string, today: string): number {
  const date = new Date(`${today}T00:00:00Z`);
  const monthDay = birthday.slice(5, 10);
  let next = new Date(`${date.getUTCFullYear()}-${monthDay}T00:00:00Z`);
  if (next < date) next = new Date(`${date.getUTCFullYear() + 1}-${monthDay}T00:00:00Z`);
  return Math.round((next.getTime() - date.getTime()) / 86400000);
}

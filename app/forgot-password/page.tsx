import { PasswordForm } from "@/components/account/PasswordForm";
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <PasswordForm expired={(await searchParams).error === "expired"} />;
}

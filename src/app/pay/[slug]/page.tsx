import { redirect } from "next/navigation";

// Legacy giving URL kept for back-compat (QR codes / old links).
export const dynamic = "force-dynamic";

export default async function LegacyPayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/give/${slug}`);
}
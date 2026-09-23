import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Legacy giving callback (old Paystack-era links). Now that payments settle
// asynchronously via MTN MoMo, simply route users to the modern receipt page.
export default async function LegacyPayCallbackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/give/${slug}/callback`);
}
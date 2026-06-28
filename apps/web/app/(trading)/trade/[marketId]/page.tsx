import { redirect } from "next/navigation";

export default async function TradeLegacyRedirect({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = await params;
  redirect(`/trade/spot/${marketId}`);
}

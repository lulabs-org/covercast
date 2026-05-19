import LiveView from "../components/LiveView";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; s?: string }>;
}) {
  const params = await searchParams;
  return <LiveView templateId={params.t} slotId={params.s} />;
}

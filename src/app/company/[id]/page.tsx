import { CompanyView } from "./company-view";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompanyView id={id} />;
}

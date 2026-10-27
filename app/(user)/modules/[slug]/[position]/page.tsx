import ModuleGuidePage from '@/components/user/ModuleGuidePage';

export default async function Page({ params }: { params: Promise<{ slug: string; position: string }> }) {
  const { slug, position } = await params;
  return <ModuleGuidePage slug={slug} position={Number(position)} />;
}

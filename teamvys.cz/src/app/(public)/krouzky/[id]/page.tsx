import { AdminCreatedCourseDetail } from '@/components/public-admin-products';

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props) {
  await params;
  return { title: 'Kroužek' };
}

export default async function CourseDetail({ params }: Props) {
  const { id } = await params;
  return <AdminCreatedCourseDetail productId={id} />;
}

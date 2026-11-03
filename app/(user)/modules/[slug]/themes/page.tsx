import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SleepThemePicker from '@/components/sleep/SleepThemePicker';
import { isReflectionLesson, loadModule, reflectionDomainFromSteps } from '@/lib/modules';

export const metadata: Metadata = {
  title: 'Choose a QHRT Reflection Theme',
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await loadModule(slug);
  if ('missing' in result || !result.module) notFound();
  const lesson = result.module.lessons.find((item) => isReflectionLesson(item.steps));
  if (!lesson) notFound();
  return (
    <SleepThemePicker
      domain={reflectionDomainFromSteps(lesson.steps)}
      lessonPath={`/modules/${slug}`}
      eyebrow={result.module.title}
      heading="Choose one theme"
      intro={
        lesson.description ??
        'Choose one theme and one statement. The guided reflection uses that theme for the still-frame, the rating, and the breathing sequence.'
      }
    />
  );
}

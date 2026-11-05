'use client';

import Link from 'next/link';
import { Accordion, Typography } from '@heroui/react';
import { FAQ_ITEMS } from '@/lib/faq';

export default function FaqList() {
  return (
    <Accordion>
      {FAQ_ITEMS.map((item) => (
        <Accordion.Item key={item.id} id={item.id}>
          <Accordion.Heading>
            <Accordion.Trigger className="px-0 py-5 font-normal tracking-tight hover:bg-transparent data-[hovered=true]:bg-transparent">
              <Typography type="body" className="font-normal tracking-tight">
                {item.question}
              </Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body className="max-w-xl px-0 pb-5">
              <Typography type="body-sm" color="muted">
                {item.id === 'privacy' ? (
                  <>
                    You need to be signed in. Only you can see your own submissions. Staff with an
                    admin role can manage content. We handle personal information under United
                    States law, including the privacy law of your state. Those state laws differ.
                    Read the{' '}
                    <Link href="/privacy" className="text-brand hover:opacity-80">
                      Privacy
                    </Link>{' '}
                    page for details.
                  </>
                ) : (
                  item.answer
                )}
              </Typography>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

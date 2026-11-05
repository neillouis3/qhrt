import { Typography } from '@heroui/react';

export default function InfoBody({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => {
        const lines = block.split('\n');
        const list = lines.filter((line) => line.trim().startsWith('- '));
        const prose = lines.filter((line) => !line.trim().startsWith('- ')).join(' ').trim();
        return (
          <div key={block.slice(0, 40)} className="flex flex-col gap-2">
            {prose ? (
              <Typography type="body" color="muted">
                {prose}
              </Typography>
            ) : null}
            {list.length > 0 ? (
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {list.map((line) => (
                  <li key={line}>
                    <Typography type="body" color="muted">
                      {line.replace(/^\s*-\s*/, '')}
                    </Typography>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { Label, ListBox, Select } from '@heroui/react';

export default function FieldSelect({
  label,
  placeholder,
  selectedKey,
  onChange,
  items,
  isDisabled,
}: {
  label?: string;
  placeholder: string;
  selectedKey: string;
  onChange: (key: string) => void;
  items: { id: string; name: string }[];
  isDisabled?: boolean;
}) {
  return (
    <Select
      fullWidth
      placeholder={placeholder}
      selectedKey={selectedKey || null}
      isDisabled={isDisabled}
      aria-label={label ?? placeholder}
      onSelectionChange={(key) => {
        if (key == null) return;
        onChange(String(key));
      }}
    >
      {label ? <Label>{label}</Label> : null}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
              {item.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

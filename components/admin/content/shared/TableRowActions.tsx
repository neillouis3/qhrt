import { Button } from '@heroui/react';

export function TableRowActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit ? (
        <Button size="sm" variant="ghost" onPress={onEdit}>
          Edit
        </Button>
      ) : null}
      {onDelete ? (
        <Button size="sm" variant="danger-soft" onPress={onDelete}>
          Delete
        </Button>
      ) : null}
    </div>
  );
}

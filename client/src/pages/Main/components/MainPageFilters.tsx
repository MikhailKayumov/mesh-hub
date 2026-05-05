import { Chip, Group, Select } from '@mantine/core';
import type { CategoryResponse } from '@/app/api/dto.ts';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Новые' },
  { value: 'createdAt', label: 'Старые' },
  { value: 'name', label: 'A → Z' },
  { value: '-name', label: 'Z → A' },
];

interface MainPageFiltersProps {
  allCategories: CategoryResponse[];
  selectedCategories: number[];
  onCategoriesChange: (value: number[]) => void;
  sort: string;
  onSortChange: (value: string) => void;
}

export function MainPageFilters({
  allCategories,
  selectedCategories,
  onCategoriesChange,
  sort,
  onSortChange,
}: MainPageFiltersProps) {
  const handleChipChange = (values: string[]) => {
    onCategoriesChange(values.map(Number));
  };

  return (
    <Group align="center" gap="sm" wrap="wrap">
      {allCategories.length > 0 && (
        <Chip.Group multiple value={selectedCategories.map(String)} onChange={handleChipChange}>
          <Group gap="xs" wrap="wrap">
            {allCategories.map((cat) => (
              <Chip key={cat.id} value={String(cat.id)} size="sm">
                {cat.name}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      )}
      <Select
        data={SORT_OPTIONS}
        value={sort}
        onChange={(value) => value && onSortChange(value)}
        allowDeselect={false}
        size="sm"
        w={140}
        ml="auto"
      />
    </Group>
  );
}

import { Badge, Combobox, Group, Image, Loader, ScrollArea, Text, TextInput, useCombobox } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModels3DQuery } from '@/app/api/models-3d.ts';
import { useScenesQuery } from '@/app/api/scenes.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { getThumbnailSrc } from '@/shared/utils/model3d.ts';
import { buildAbsolutePath } from '@/shared/utils/router.ts';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

const PLACEHOLDER_THUMB_STYLE = {
  width: 20,
  height: 20,
  borderRadius: 2,
  background: 'var(--mantine-color-default-hover)',
} as const;

export function SearchInput() {
  const navigate = useNavigate();
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, DEBOUNCE_MS);

  const skip = debouncedQuery.trim().length < MIN_QUERY_LENGTH;

  const { data: modelsData, isFetching: isModelsFetching } = useModels3DQuery(
    { size: 5, skip: 0, search: debouncedQuery.trim() },
    { skip },
  );
  const { data: scenesData, isFetching: isScenesFetching } = useScenesQuery(
    { search: debouncedQuery.trim() },
    { skip },
  );

  const models = (modelsData?.data ?? []).slice(0, 5);
  const scenes = (scenesData ?? []).slice(0, 5);
  const isLoading = !skip && (isModelsFetching || isScenesFetching);
  const showEmpty = !skip && !isLoading && models.length === 0 && scenes.length === 0;

  const handleSelect = (value: string) => {
    const [kind, id] = value.split(':');
    if (!kind || !id) return;
    if (kind === 'model') {
      navigate(buildAbsolutePath([RouterPaths.Models, id]));
    } else if (kind === 'scene') {
      navigate(buildAbsolutePath([RouterPaths.Scenes, id]));
    }
    combobox.closeDropdown();
    setQuery('');
  };

  return (
    <Combobox store={combobox} width={360} position="bottom-start" withinPortal onOptionSubmit={handleSelect}>
      <Combobox.Target>
        <TextInput
          placeholder="Поиск моделей и сцен..."
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            if (event.currentTarget.value.trim().length >= MIN_QUERY_LENGTH) {
              combobox.openDropdown();
            } else {
              combobox.closeDropdown();
            }
          }}
          onFocus={() => {
            if (query.trim().length >= MIN_QUERY_LENGTH) combobox.openDropdown();
          }}
          onBlur={() => combobox.closeDropdown()}
          leftSection={isLoading ? <Loader size={14} /> : <IconSearch size={16} />}
          w={320}
          aria-label="Search"
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <ScrollArea.Autosize mah={360} type="scroll">
          <Combobox.Options>
            {models.length > 0 && (
              <Combobox.Group label="Модели">
                {models.map((m) => {
                  const fmt = m.file?.originalFormat?.toLowerCase();
                  const src = getThumbnailSrc(m.id, m.thumbnail);
                  return (
                    <Combobox.Option key={m.id} value={`model:${m.id}`}>
                      <Group gap="xs" wrap="nowrap">
                        {src ? (
                          <Image src={src} w={20} h={20} radius={2} fit="cover" />
                        ) : (
                          <div style={PLACEHOLDER_THUMB_STYLE} />
                        )}
                        <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                          {m.name}
                        </Text>
                        {fmt && (
                          <Badge size="xs" variant="light">
                            {fmt}
                          </Badge>
                        )}
                      </Group>
                    </Combobox.Option>
                  );
                })}
              </Combobox.Group>
            )}

            {scenes.length > 0 && (
              <Combobox.Group label="Сцены">
                {scenes.map((s) => (
                  <Combobox.Option key={s.id} value={`scene:${s.id}`}>
                    <Group gap="xs" wrap="nowrap">
                      {s.thumbnailPath ? (
                        <Image src={s.thumbnailPath} w={20} h={20} radius={2} fit="cover" />
                      ) : (
                        <div style={PLACEHOLDER_THUMB_STYLE} />
                      )}
                      <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                        {s.name}
                      </Text>
                      <Badge size="xs" color="teal" variant="light">
                        Scene
                      </Badge>
                    </Group>
                  </Combobox.Option>
                ))}
              </Combobox.Group>
            )}

            {showEmpty && <Combobox.Empty>Ничего не найдено</Combobox.Empty>}
          </Combobox.Options>
        </ScrollArea.Autosize>
      </Combobox.Dropdown>
    </Combobox>
  );
}

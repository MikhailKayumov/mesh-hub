import { Button, Container, Paper, Stack, TextInput, Title } from '@mantine/core';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useCreateOrganizationMutation } from '@/app/api/organizations.ts';
import { orgActions } from '@/entities/organization';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function OrgCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [createOrganization, { isLoading, error }] = useCreateOrganizationMutation();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    setNameError(null);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
    setSlugError(null);
  }

  async function handleSubmit() {
    let valid = true;

    if (!name.trim()) {
      setNameError('Название обязательно');
      valid = false;
    }

    if (!slug.trim()) {
      setSlugError('Слаг обязателен');
      valid = false;
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Только строчные буквы, цифры и дефисы');
      valid = false;
    }

    if (!valid) return;

    const result = await createOrganization({ name: name.trim(), slug: slug.trim() });

    if ('data' in result && result.data) {
      dispatch(orgActions.setCurrentOrg(result.data.id));
      navigate(buildAbsolutePath([RouterPaths.Org, result.data.id]));
    }
  }

  const apiError = error && 'message' in error ? (error as { message: string }).message : undefined;

  return (
    <Container size="xs" py="xl">
      <Paper p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>Создать организацию</Title>

          <TextInput
            label="Название"
            placeholder="My Company"
            value={name}
            onChange={(e) => handleNameChange(e.currentTarget.value)}
            error={nameError}
            required
          />

          <TextInput
            label="Слаг"
            description="Только строчные буквы, цифры и дефисы"
            placeholder="my-company"
            value={slug}
            onChange={(e) => handleSlugChange(e.currentTarget.value)}
            error={slugError}
            required
          />

          {apiError && (
            <TextInput
              readOnly
              value={apiError}
              styles={{ input: { color: 'var(--mantine-color-red-6)', border: 'none', background: 'transparent' } }}
            />
          )}

          <Button onClick={handleSubmit} loading={isLoading}>
            Создать
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

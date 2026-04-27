import { Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod/v4';
import { useCreateSceneMutation } from '@/app/api/scenes.ts';

const schema = z.object({
    name: z.string().min(1, 'Name is required').max(120, 'Name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    workspaceId: string;
    opened: boolean;
    onClose: () => void;
    onCreated: (sceneId: string) => void;
}

export function CreateSceneModal({ workspaceId, opened, onClose, onCreated }: Props) {
    const [createScene, { isLoading }] = useCreateSceneMutation();

    const form = useForm<FormValues>({
        initialValues: { name: '', description: '' },
        validate: zodResolver(schema),
    });

    const handleSubmit = async (values: FormValues) => {
        try {
            const scene = await createScene({
                name: values.name,
                description: values.description || undefined,
                workspaceId,
            }).unwrap();
            form.reset();
            onCreated(scene.id);
        } catch {
            // handled by RTK Query error state
        }
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={handleClose} title="New Scene" centered size="sm">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput label="Name" placeholder="My scene" required {...form.getInputProps('name')} />
                    <Textarea
                        label="Description"
                        placeholder="Optional description"
                        autosize
                        minRows={2}
                        maxRows={4}
                        {...form.getInputProps('description')}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={handleClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Create
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}

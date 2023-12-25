import { useForm } from '@mantine/form';
import { JSONContent } from '@tiptap/react';
import { Model3DResponseDto } from '@/api/dto.ts';

type FormData = {
  name: string;
  description: JSONContent | null;
};

const t = `{"type":"doc","content":[{"type":"heading","attrs":{"textAlign":"left","level":3},"content":[{"type":"text","text":"Обереги никого не защитили"}]},{"type":"paragraph","attrs":{"textAlign":"left"},"content":[{"type":"text","text":"С учётом сложившейся международной обстановки, убеждённость некоторых оппонентов является качественно новой ступенью как самодостаточных, так и внешне зависимых концептуальных решений."}]},{"type":"orderedList","attrs":{"start":1},"content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":"left"},"content":[{"type":"text","text":"Не следует забывать, что спикеры палаты госдумы негодуют"}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":"left"},"content":[{"type":"text","text":"Эксперты утверждают, что современная методология разработки стала доступной ширнармассам"}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":"left"},"content":[{"type":"text","text":"Инцидент не исчерпан: частокол на границе починят"}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":"left"},"content":[{"type":"text","text":"Звук клавиш печатной машинки оправдал надежды граждан"}]}]}]}]}`;

export default function useModel3DEditPropertiesForm(model: Model3DResponseDto) {
  const form = useForm<FormData>({
    initialValues: {
      name: model.name ?? '',
      description: JSON.parse(model.description ?? t),
    },
    transformValues: (values) => ({
      name: values.name.trim(),
      description: JSON.stringify(values.description) as any,
    }),
  });

  return {
    form,
    onSubmit: form.onSubmit(async (data) => {
      console.log(data);
    }),
  };
}

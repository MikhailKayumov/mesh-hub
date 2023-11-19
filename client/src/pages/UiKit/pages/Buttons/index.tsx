import Button from '@/components/Button';
import LinkButton from '@/components/LinkButton';
import { Paper } from '@/components/Paper';
import RouterPaths from '@/router/paths.ts';

export default function UiKitButtonsPage() {
  return (
    <div className="w-full">
      <Paper className="flex gap-4 p-4">
        <div>
          <h2 className="mb-4 mt-0">Buttons</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Button disabled>Кнопка</Button>
              <Button>Кнопка</Button>
              <Button size="md">Кнопка</Button>
              <Button size="sm">Кнопка</Button>
            </div>
            <div className="flex items-start gap-3">
              <Button variant="outlined" disabled>
                Кнопка
              </Button>
              <Button variant="outlined">Кнопка</Button>
              <Button size="md" variant="outlined">
                Кнопка
              </Button>
              <Button size="sm" variant="outlined">
                Кнопка
              </Button>
            </div>
            <div className="flex items-start gap-3">
              <Button variant="text" disabled>
                Кнопка
              </Button>
              <Button variant="text">Кнопка</Button>
              <Button size="md" variant="text">
                Кнопка
              </Button>
              <Button size="sm" variant="text">
                Кнопка
              </Button>
            </div>
          </div>
        </div>
        <div>
          <h2 className="mb-4 mt-0">Link Buttons</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <LinkButton to={RouterPaths.Base} disabled>
                Кнопка
              </LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`}>Кнопка</LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`} size="md">
                Кнопка
              </LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`} size="sm">
                Кнопка
              </LinkButton>
            </div>
            <div className="flex items-start gap-3">
              <LinkButton to={`/${RouterPaths.Profile}`} variant="outlined" disabled>
                Кнопка
              </LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`} variant="outlined">
                Кнопка
              </LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`} size="md" variant="outlined">
                Кнопка
              </LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`} size="sm" variant="outlined">
                Кнопка
              </LinkButton>
            </div>
            <div className="flex items-start gap-3">
              <LinkButton to={`/${RouterPaths.Profile}`} variant="text" disabled className={'mr-8'}>
                Кнопка
              </LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`} variant="text" className={'mr-8'}>
                Кнопка
              </LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`} size="md" variant="text" className={'mr-6'}>
                Кнопка
              </LinkButton>
              <LinkButton to={`/${RouterPaths.Profile}`} size="sm" variant="text">
                Кнопка
              </LinkButton>
            </div>
          </div>
        </div>
      </Paper>
    </div>
  );
}

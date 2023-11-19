import { Paper } from '@/components/Paper';
import Typography from '@/components/Typography';

export default function UiKitTypographyPage() {
  return (
    <>
      <Paper className="flex flex-col gap-3">
        <Typography variant="h1">Заголовок/Heading 1</Typography>
        <Typography variant="h2">Заголовок/Heading 2</Typography>
        <Typography variant="h3">Заголовок/Heading 3</Typography>
        <Typography variant="h4">Заголовок/Heading 4</Typography>
      </Paper>
      <Paper className="mt-4 gap-0">
        <Typography variant="p">
          Параграф/Paragraph: Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства
        </Typography>
        <p></p>
        <a href="#">Ссылка/Link</a>
        <blockquote>
          Цитата/Blockquote: Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства
        </blockquote>
        <figure>
          <img
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-images/elephant-660-480.jpg"
            alt="Elephant at sunset"
          />
          <figcaption>Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства</figcaption>
        </figure>
        <div>
          <strong>Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства</strong>
        </div>
        <div>
          <em>Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства</em>
        </div>
        <div>
          <code>Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства</code>
        </div>
        <div>
          <pre>{`Широкая электрификация южных\nгуберний даст мощный толчок\nподъёму сельского хозяйства`}</pre>
        </div>
      </Paper>
    </>
  );
}

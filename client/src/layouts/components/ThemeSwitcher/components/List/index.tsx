import { clsx } from 'clsx';
import { themes } from '../../constants.ts';
import { ThemeListProps } from '../../model.ts';

export default function ThemeList({ open, currentTheme, onThemeSelect }: ThemeListProps) {
  return (
    <div
      className={clsx(
        'shadow-2x transition-no absolute right-0 top-[100%] origin-top-right rounded-md bg-white shadow-xl transition-transform duration-[320ms] dark:bg-slate-900',
        { 'scale-1': open, 'scale-0': !open },
      )}
    >
      <ul className="m-0 flex list-none flex-col gap-1 px-2 py-3">
        {themes.map(({ name, title, Icon }) => (
          <li key={name} className="m-0 p-0">
            <button
              className={clsx(
                'w-full flex cursor-pointer select-none items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-blue-800 hover:text-white active:bg-blue-700',
                { 'bg-blue-800': currentTheme === name, 'text-white': currentTheme === name },
              )}
              onClick={() => onThemeSelect(name)}
            >
              <Icon height={24} />
              <span>{title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

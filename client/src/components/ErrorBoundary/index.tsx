import { useRouteError } from 'react-router-dom';

export default function ErrorBoundary() {
  const error: Error = useRouteError() as Error;

  return (
    <>
      <h1 className="text-white bg-red-600 font-headings font-bold py-2 px-4 mb-0">Упс! Что-то пошло не так</h1>
      <div className="px-4">
        <h3 className="text-red-600">Ошибка: {error.message}</h3>
        <p className="text-red-600">{error.stack}</p>
      </div>
    </>
  );
}

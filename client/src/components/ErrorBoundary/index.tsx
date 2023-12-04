import { useRouteError } from 'react-router-dom';

export default function ErrorBoundary() {
  const error: Error = useRouteError() as Error;

  return (
    <>
      <h1>Упс! Что-то пошло не так</h1>
      <div>
        <h3>Ошибка: {error.message}</h3>
        <p>{error.stack}</p>
      </div>
    </>
  );
}

import dayjs from 'dayjs';

/**
 * Форматирует дату в читаемый формат для списка сообщений (например, "Сегодня", "Вчера", "12 октября").
 */
export const formatChatMessageDate = (dateString: string | Date): string => {
  const date = dayjs(dateString);
  if (!date?.isValid()) {
    return '';
  }

  const today = dayjs();

  if (date.isSame(today, 'day')) {
    return 'Сегодня';
  } else if (date.isSame(today.subtract(1, 'day'), 'day')) {
    return 'Вчера';
  } else if (date.isSame(today, 'year')) {
    return date.format('D MMMM, YYYY');
  } else {
    return date.format('D MMMM');
  }
};

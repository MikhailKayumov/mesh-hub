import { useMemo } from 'react';
import { ChatListItem, ChatMessage } from '@/widgets/Chat/model.ts';

/**
 * Хук для группировки сообщений по датам и подготовки данных для виртуального списка.
 * @param {ChatMessage[]} messages - Массив сообщений.
 */
const useGroupMessages = (messages: ChatMessage[]) => {
  return useMemo(() => {
    const groupedMessages: { [key: string]: ChatMessage[] } = {};

    // Группируем сообщения по датам
    messages.forEach((message) => {
      const date = new Date(message.datetime).toISOString().split('T')[0];
      if (!groupedMessages[date]) {
        groupedMessages[date] = [];
      }
      groupedMessages[date].push(message);
    });

    console.log(groupedMessages);

    // Преобразуем группированные сообщения в плоский массив для виртуального списка
    const flatMessages: ChatListItem[] = messages.map((message, index) => ({
      message,
      isFirstInGroup: index === 0,
      showDate: index === 0,
      isOwner: message.isOwner ?? false,
    }));

    Object.keys(groupedMessages).forEach((date) => {
      groupedMessages[date].forEach((message, index) => {
        flatMessages.push({
          message,
          isFirstInGroup: index === 0,
          showDate: index === 0,
          isOwner: message.isOwner ?? false,
        });
      });
    });

    return {
      flatMessages,
      itemCount: flatMessages.length,
      getItem: (index: number) => flatMessages[index],
    };
  }, [messages]); // Пересчитываем только при изменении messages или currentUserId
};

export default useGroupMessages;

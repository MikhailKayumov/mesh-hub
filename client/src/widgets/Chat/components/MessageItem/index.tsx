import { ChatListItem } from '@/widgets/Chat/model.ts'; // Утилита для форматирования дат
import { formatChatMessageDate } from '@/widgets/Chat/utils.ts';

/**
 * Компонент для отображения отдельного сообщения.
 * @param {ChatListItem} props - Пропсы компонента.
 */
export const MessageItem = ({ message, isOwner, isFirstInGroup, showDate }: ChatListItem) => {
  return (
    <div>
      {showDate && (
        <div style={{ textAlign: 'center', margin: '8px 0', color: '#666' }}>
          {formatChatMessageDate(message.datetime)}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: isOwner ? 'flex-end' : 'flex-start',
          marginBottom: isFirstInGroup ? '8px' : '4px',
        }}
      >
        <div
          style={{
            backgroundColor: isOwner ? '#007bff' : '#f1f1f1',
            color: isOwner ? '#fff' : '#000',
            padding: '8px 12px',
            borderRadius: '8px',
            maxWidth: '70%',
            wordBreak: 'break-word',
          }}
        >
          {isFirstInGroup && <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{message.userName}</div>}
          <div>{message.text}</div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
            {message.datetime.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

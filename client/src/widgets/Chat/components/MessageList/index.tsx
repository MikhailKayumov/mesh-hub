import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useCurrentUser } from '@/entities/user/hooks';
import { MessageItem } from '@/widgets/Chat/components/MessageItem';
import useGroupMessages from '@/widgets/Chat/hooks/useGroupMessages.ts';
import { ChatMessage } from '@/widgets/Chat/model.ts';

interface MessageListProps {
  messages: ChatMessage[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const currentUser = useCurrentUser();
  const { groupedMessages, itemCount, getItem } = useGroupMessages(messages);

  const Row = ({ index, style }: ListChildComponentProps) => {
    const { message, isOwner, isFirstInGroup, showDate } = getItem(index);

    return (
      <div style={style}>
        <MessageItem message={message} isOwner={isOwner} isFirstInGroup={isFirstInGroup} showDate={showDate} />
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          itemCount={itemCount}
          itemSize={100} // Высота каждого элемента (можно адаптировать)
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};

export default MessageList;

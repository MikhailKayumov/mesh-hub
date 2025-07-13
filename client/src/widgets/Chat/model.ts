/**
 * Тип сообщения.
 * @property {string} id - Уникальный идентификатор сообщения.
 * @property {string} userId - ID пользователя, отправившего сообщение.
 * @property {string} userName - Имя пользователя, отправившего сообщение.
 * @property {string} text - Текст сообщения.
 * @property {number} timestamp - Дата сообщения ISO 8601.
 */
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  datetime: Date;
  isOwner: boolean;
}

/**
 * Интерфейс пропсов компонентов сообщения чата.
 * @property {ChatMessage} message - Объект сообщения.
 * @property {boolean} isCurrentUser - Флаг, указывающий, принадлежит ли сообщение текущему пользователю.
 * @property {boolean} isFirstInGroup - Флаг, указывающий, является ли сообщение первым в группе.
 * @property {boolean} showDate - Флаг, указывающий, нужно ли показывать дату.
 */
export interface ChatListItem {
  message: ChatMessage;
  isOwner: boolean;
  isFirstInGroup: boolean;
  showDate: boolean;
}

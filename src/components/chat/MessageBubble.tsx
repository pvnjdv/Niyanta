import React from 'react';
import { Message } from '../../types/agent';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => (
  <div style={{ alignSelf: 'flex-end', maxWidth: '78%', background: 'var(--bg-msg-out)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
    <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{message.content}</div>
  </div>
);

export default MessageBubble;

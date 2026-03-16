import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, Image } from 'react-bootstrap';
import { BsEmojiSmile, BsPaperclip, BsSend, BsX } from 'react-icons/bs';
import EmojiPicker from 'emoji-picker-react';
import { useDropzone } from 'react-dropzone';

const MessageInput = ({ onSendMessage, onTypingStart, onTypingStop, conversationId }) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [files, setFiles] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const inputRef = useRef(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': [],
      'audio/*': [],
      'application/pdf': [],
    },
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    maxSize: 16 * 1024 * 1024, // 16MB
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleTyping = () => {
    onTypingStart();
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    setTypingTimeout(setTimeout(() => {
      onTypingStop();
    }, 2000));
  };

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message, files);
      setMessage('');
      setFiles([]);
      onTypingStop();
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <div className="p-3 bg-light border-top">
      {/* File previews */}
      {files.length > 0 && (
        <div className="d-flex gap-2 mb-2 overflow-auto">
          {files.map((file, index) => (
            <div key={index} className="position-relative">
              {file.type.startsWith('image/') ? (
                <Image 
                  src={URL.createObjectURL(file)} 
                  thumbnail 
                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                />
              ) : (
                <div className="p-2 bg-white border rounded">
                  {file.name}
                </div>
              )}
              <Button
                variant="danger"
                size="sm"
                className="position-absolute top-0 end-0 rounded-circle"
                style={{ transform: 'translate(50%, -50%)' }}
                onClick={() => removeFile(index)}
              >
                <BsX size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Form className="d-flex align-items-center" style={{ gap: '8px' }}>
        <Button variant="link" className="text-secondary p-0" onClick={() => setShowEmoji(!showEmoji)}>
          <BsEmojiSmile size={24} />
        </Button>

        <div {...getRootProps()} style={{ cursor: 'pointer' }}>
          <input {...getInputProps()} />
          <Button variant="link" className="text-secondary p-0">
            <BsPaperclip size={24} />
          </Button>
        </div>

        <Form.Control
          ref={inputRef}
          as="textarea"
          rows={1}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-grow-1"
          style={{ resize: 'none', borderRadius: '24px' }}
        />

        <Button 
          variant="primary" 
          className="rounded-circle p-2" 
          onClick={handleSend}
          disabled={!message.trim() && files.length === 0}
        >
          <BsSend size={20} />
        </Button>
      </Form>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="position-absolute bottom-100 start-0 mb-2">
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
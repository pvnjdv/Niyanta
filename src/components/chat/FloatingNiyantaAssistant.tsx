import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Link, Code, Mic, Send, Info, X } from 'lucide-react';

interface FloatingNiyantaAssistantProps {
  onSend?: (message: string) => void;
  isSending?: boolean;
}

const FloatingNiyantaAssistant: React.FC<FloatingNiyantaAssistantProps> = ({ onSend, isSending = false }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 2000;
  const chatRef = useRef<HTMLDivElement>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setMessage(value);
      setCharCount(value.length);
    }
  };

  const handleSend = () => {
    if (message.trim() && !isSending) {
      onSend?.(message);
      setMessage('');
      setCharCount(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('.floating-ai-button')) {
          setIsChatOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
      }}>
        {/* Floating 3D Glowing Niyanta Logo */}
        <button 
          className="floating-ai-button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 500ms cubic-bezier(0.25, 1.1, 0.4, 1)',
            transform: isChatOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.9) 0%, rgba(75, 0, 130, 0.9) 100%)',
            boxShadow: '0 0 20px var(--accent), 0 0 40px rgba(138, 43, 226, 0.5), 0 0 60px rgba(75, 0, 130, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {/* 3D effect */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
            opacity: 0.3,
          }}></div>
          
          {/* Inner glow */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.1)',
          }}></div>
          
          {/* Niyanta Logo */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isChatOpen ? (
              <X size={32} strokeWidth={2.5} />
            ) : (
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '24px',
                fontWeight: 700,
                color: 'white',
              }}>
                नि
              </div>
            )}
          </div>
          
          {/* Glowing animation */}
          <div className="glow-pulse" style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'var(--accent)',
            opacity: 0.2,
          }}></div>
        </button>

        {/* Chat Interface */}
        {isChatOpen && (
          <div 
            ref={chatRef}
            className="chat-popup"
            style={{
              position: 'absolute',
              bottom: '80px',
              right: 0,
              width: '500px',
              maxWidth: '90vw',
              transition: 'all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transformOrigin: 'bottom right',
            }}
          >
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
            }}>
              
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px 8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--status-success)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}></div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}>Niyanta AI Assistant</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    borderRadius: '12px',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    GROQ
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    PRO
                  </span>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tile-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Input Section */}
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <textarea
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  disabled={isSending}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontSize: '15px',
                    fontFamily: 'var(--font-body)',
                    lineHeight: '1.6',
                    minHeight: '120px',
                    color: 'var(--text-primary)',
                    scrollbarWidth: 'none',
                  }}
                  placeholder="What would you like to explore today? Ask anything about workflows, agents, or operations..."
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.02), transparent)',
                  pointerEvents: 'none',
                }}></div>
              </div>

              {/* Controls Section */}
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Attachment Group */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px',
                      background: 'var(--bg-input)',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                    }}>
                      <IconButton icon={<Paperclip size={16} />} tooltip="Upload files" />
                      <IconButton icon={<Link size={16} />} tooltip="Web link" />
                      <IconButton icon={<Code size={16} />} tooltip="Code repo" />
                      <IconButton icon={<FigmaIcon />} tooltip="Design file" />
                    </div>

                    {/* Voice Button */}
                    <IconButton 
                      icon={<Mic size={16} />} 
                      tooltip="Voice input" 
                      standalone 
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Character Counter */}
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      <span style={{ color: charCount > maxChars * 0.9 ? '#EF4444' : 'var(--text-secondary)' }}>
                        {charCount}
                      </span>
                      <span>/</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{maxChars}</span>
                    </div>

                    {/* Send Button */}
                    <button 
                      onClick={handleSend}
                      disabled={!message.trim() || isSending}
                      className="send-button"
                      style={{
                        position: 'relative',
                        padding: '12px',
                        background: message.trim() && !isSending 
                          ? 'linear-gradient(135deg, var(--accent) 0%, rgba(138, 43, 226, 0.8) 100%)'
                          : 'var(--bg-tile)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: message.trim() && !isSending ? 'pointer' : 'not-allowed',
                        transition: 'all 300ms cubic-bezier(0.25, 1.1, 0.4, 1)',
                        color: 'white',
                        boxShadow: message.trim() && !isSending 
                          ? '0 4px 12px rgba(138, 43, 226, 0.3)'
                          : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: message.trim() && !isSending ? 1 : 0.5,
                      }}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  gap: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={12} />
                    <span>
                      Press <kbd style={{
                        padding: '2px 6px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                      }}>Shift + Enter</kbd> for new line
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      background: 'var(--status-success)',
                      borderRadius: '50%',
                    }}></div>
                    <span>All systems operational</span>
                  </div>
                </div>
              </div>

              {/* Floating Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '24px',
                pointerEvents: 'none',
                background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.03), transparent, rgba(75, 0, 130, 0.03))',
              }}></div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes glow-ping {
          75%, 100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
        
        .floating-ai-button:hover {
          transform: scale(1.15) rotate(5deg) !important;
          box-shadow: 0 0 30px var(--accent), 0 0 50px rgba(138, 43, 226, 0.7), 0 0 70px rgba(75, 0, 130, 0.5) !important;
        }

        .floating-ai-button:active {
          transform: scale(1.05) !important;
        }

        .glow-pulse {
          animation: glow-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .chat-popup {
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.1) rotate(-2deg);
          box-shadow: 0 6px 20px rgba(138, 43, 226, 0.5) !important;
        }

        .send-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        textarea::placeholder {
          color: var(--text-muted);
        }

        textarea::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

// Icon Button Component
interface IconButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  standalone?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, tooltip, standalone = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onMouseEnter={(e) => {
          setShowTooltip(true);
          e.currentTarget.style.background = 'var(--bg-tile-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          setShowTooltip(false);
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        style={{
          padding: '10px',
          background: 'transparent',
          border: standalone ? '1px solid var(--border)' : 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 300ms cubic-bezier(0.25, 1.1, 0.4, 1)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </button>
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 12px',
          background: 'var(--bg-panel)',
          color: 'var(--text-primary)',
          fontSize: '11px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border)',
          zIndex: 1001,
          fontFamily: 'var(--font-body)',
        }}>
          {tooltip}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid var(--bg-panel)',
          }}></div>
        </div>
      )}
    </div>
  );
};

// Figma Icon Component
const FigmaIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117v-6.038H8.148zm7.704 0c-2.476 0-4.49 2.015-4.49 4.49s2.014 4.49 4.49 4.49 4.49-2.015 4.49-4.49-2.014-4.49-4.49-4.49zm0 7.509c-1.665 0-3.019-1.355-3.019-3.019s1.355-3.019 3.019-3.019 3.019 1.354 3.019 3.019-1.354 3.019-3.019 3.019zM8.148 24c-2.476 0-4.49-2.015-4.49-4.49s2.014-4.49 4.49-4.49h4.588V24H8.148zm3.117-1.471V16.49H8.148c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.02 3.019 3.02h3.117z"></path>
  </svg>
);

export default FloatingNiyantaAssistant;

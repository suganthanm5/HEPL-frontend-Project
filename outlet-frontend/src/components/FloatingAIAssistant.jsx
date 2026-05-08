import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Fade,
  Slide,
  Paper
} from '@mui/material';
import {
  Psychology as AIIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  SmartToy as BotIcon,
  Refresh as RefreshIcon,
  AttachFile as AttachIcon,
  Lightbulb as DeepThinkIcon,
  Videocam as VideoIcon,
  MoreHoriz as TypingIcon
} from '@mui/icons-material';
import geminiAIService from '../services/geminiAIService';

const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Get system data for AI context
  const { outlets, locations, divisions } = useSelector(state => state.dashboard);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        type: 'assistant',
        message: `Hello! 👋 Of course, I'm your AI voice assistant.\nHow can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('🚀 Sending message to AI:', inputMessage);
      
      // Process message with real AI service
      const response = await geminiAIService.processMessage(inputMessage, {
        user,
        outlets,
        locations,
        divisions
      });

      console.log('✅ Received real AI response:', response);

      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setTimeout(() => {
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
        console.log('✅ Real AI message added to chat');
      }, 1500); // Shorter delay for better UX

    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: `Sorry, I'm having trouble connecting to my AI service right now. Please check your internet connection and try again.\n\nError: ${error.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickSuggestions = [
    "Hi, can you help me?",
    "I want to know about voice features.",
    "Wow, that's cool. Can I speak directly?"
  ];

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  // Floating Bot Button
  if (!isOpen) {
    return (
      <Fade in={!isOpen}>
        <Box
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(255, 107, 157, 0.3)',
            transition: 'all 0.3s ease',
            zIndex: 1000,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 12px 35px rgba(255, 107, 157, 0.4)'
            }
          }}
        >
          <BotIcon sx={{ fontSize: 28, color: 'white' }} />
        </Box>
      </Fade>
    );
  }

  // Main Chat Interface
  return (
    <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 400,
          height: isMinimized ? 60 : 600,
          borderRadius: '24px',
          overflow: 'hidden',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          transition: 'height 0.3s ease'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'transparent',
            color: '#333',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
              }}
            >
              <AIIcon sx={{ fontSize: 20, color: 'white' }} />
            </Avatar>
            
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>
                AI Assistant
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '11px' }}>
                {isTyping ? 'Analyzing data, please wait...' : 'Online'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              onClick={() => {
                setMessages([]);
                setIsTyping(false);
              }}
              sx={{ 
                color: '#666', 
                p: 0.5,
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' }
              }}
              size="small"
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <IconButton
              onClick={() => setIsMinimized(!isMinimized)}
              sx={{ 
                color: '#666', 
                p: 0.5,
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' }
              }}
              size="small"
            >
              <MinimizeIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <IconButton
              onClick={() => setIsOpen(false)}
              sx={{ 
                color: '#666', 
                p: 0.5,
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' }
              }}
              size="small"
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Chat Messages */}
        {!isMinimized && (
          <>
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 3,
                backgroundColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 2
                  }}
                >
                  {msg.type === 'assistant' && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
                      }}
                    >
                      <AIIcon sx={{ fontSize: 16, color: 'white' }} />
                    </Avatar>
                  )}
                  
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box
                      sx={{
                        maxWidth: msg.type === 'user' ? '80%' : '100%',
                        alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {msg.type === 'user' ? (
                        <Box
                          sx={{
                            backgroundColor: '#ff6b9d',
                            color: 'white',
                            p: 2,
                            borderRadius: '20px 20px 6px 20px',
                            fontSize: '14px',
                            lineHeight: 1.4
                          }}
                        >
                          {msg.message}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#333',
                              fontSize: '14px',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-line'
                            }}
                          >
                            {msg.message}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <IconButton size="small" sx={{ color: '#999', p: 0.5 }}>
                              <RefreshIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton size="small" sx={{ color: '#999', p: 0.5 }}>
                              <SendIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton size="small" sx={{ color: '#999', p: 0.5 }}>
                              <TypingIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '11px',
                        color: '#999',
                        alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                        mt: 0.5
                      }}
                    >
                      {msg.timestamp}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
                    }}
                  >
                    <TypingIcon sx={{ fontSize: 16, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#333', fontSize: '14px' }}>
                      Analyzing data, please wait...
                    </Typography>
                  </Box>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Quick Suggestions */}
            <Box sx={{ px: 3, pb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {quickSuggestions.map((suggestion) => (
                  <Box
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      backgroundColor: '#ff6b9d',
                      color: 'white',
                      fontSize: '12px',
                      px: 2,
                      py: 1,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#e55a87'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {suggestion}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 3, pt: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-end',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '24px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  p: 1,
                  gap: 1
                }}
              >
                <IconButton size="small" sx={{ color: '#999' }}>
                  <AttachIcon sx={{ fontSize: 20 }} />
                </IconButton>
                
                <TextField
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  multiline
                  maxRows={3}
                  fullWidth
                  variant="standard"
                  disabled={isTyping}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      fontSize: '14px',
                      '& input::placeholder': {
                        color: '#999',
                        opacity: 1
                      }
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: 'transparent'
                    }
                  }}
                />
                
                <IconButton size="small" sx={{ color: '#999' }}>
                  <DeepThinkIcon sx={{ fontSize: 20 }} />
                </IconButton>
                
                <IconButton size="small" sx={{ color: '#999' }}>
                  <VideoIcon sx={{ fontSize: 20 }} />
                </IconButton>
                
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  sx={{
                    backgroundColor: '#ff6b9d',
                    color: 'white',
                    width: 36,
                    height: 36,
                    '&:hover': {
                      backgroundColor: '#e55a87'
                    },
                    '&:disabled': {
                      backgroundColor: '#ddd',
                      color: '#999'
                    }
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Slide>
  );
};

export default FloatingAIAssistant;
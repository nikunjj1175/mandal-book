'use client';
import { useState, useRef, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const BOT_RESPONSES = {
  greetings: [
    'Hello! I\'m your Mandal Book assistant. How can I help you today?',
    'Hi there! I\'m here to help you manage the Mandal Book system.',
    'Welcome! I can assist you with user management, contributions, and system operations.'
  ],
  user_management: [
    'To manage users, go to the Users section. You can approve, suspend, or change user statuses.',
    'User management is available in the Admin panel under Users. You can view all registered users and their status.',
    'For user management, navigate to Admin > Users. You can approve pending users and manage their roles.'
  ],
  contributions: [
    'Contributions can be managed in the Admin > Contributions section. You can verify pending contributions and finalize verified ones.',
    'To handle contributions, go to the Contributions page. You\'ll see pending items that need verification.',
    'Contribution management is in Admin > Contributions. You can approve, reject, or finalize user contributions.'
  ],
  analytics: [
    'Analytics are available in the Admin > Analytics section. You can view charts and reports.',
    'For analytics and reports, check the Analytics page in the admin panel.',
    'Analytics provide insights into contributions, user activity, and system performance.'
  ],
  system: [
    'The system tracks all activities in audit logs. You can view them in Admin > Logs.',
    'System logs are available in the Logs section. They track user actions and system events.',
    'Audit logs maintain a record of all user activities and system changes.'
  ],
  default: [
    'I\'m not sure about that. Could you please rephrase your question?',
    'I don\'t have information about that specific topic. Try asking about user management, contributions, or analytics.',
    'I\'m still learning. Please ask about user management, contributions, analytics, or system operations.'
  ]
};

export default function AdminChatbot() {
  const { user } = useAppSelector((state: any) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your Mandal Book assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return getRandomResponse('greetings');
    }
    
    if (lowerMessage.includes('user') || lowerMessage.includes('member') || lowerMessage.includes('approve')) {
      return getRandomResponse('user_management');
    }
    
    if (lowerMessage.includes('contribution') || lowerMessage.includes('payment') || lowerMessage.includes('verify')) {
      return getRandomResponse('contributions');
    }
    
    if (lowerMessage.includes('analytics') || lowerMessage.includes('report') || lowerMessage.includes('chart')) {
      return getRandomResponse('analytics');
    }
    
    if (lowerMessage.includes('log') || lowerMessage.includes('audit') || lowerMessage.includes('system')) {
      return getRandomResponse('system');
    }
    
    return getRandomResponse('default');
  };

  const getRandomResponse = (category: keyof typeof BOT_RESPONSES): string => {
    const responses = BOT_RESPONSES[category];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(inputValue),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4">
          <div className="bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Mandal Book Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && (
                        <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.type === 'user' && (
                        <User className="h-4 w-4 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {['User Management', 'Contributions', 'Analytics', 'System Logs'].map((action) => (
                  <button
                    key={action}
                    onClick={() => setInputValue(action)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}






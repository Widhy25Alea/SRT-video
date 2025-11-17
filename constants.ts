
export type TranslationKey = 
  | 'appTitle'
  | 'welcomeMessage'
  | 'inputPlaceholder'
  | 'sendButton'
  | 'initializationError'
  | 'responseError';

type Translations = {
  [lang: string]: {
    [key in TranslationKey]: string;
  };
};

export const translations: Translations = {
  en: {
    appTitle: 'Continuing Conversation',
    welcomeMessage: "Of course, let's continue. What would you like to discuss next?",
    inputPlaceholder: 'Type your message here...',
    sendButton: 'Send',
    initializationError: 'Error initializing the chat. Please check your API key and refresh the page.',
    responseError: 'Sorry, I encountered an error. Please try again.',
  },
  id: {
    appTitle: 'Melanjutkan Percakapan',
    welcomeMessage: 'Tentu, mari kita lanjutkan. Apa yang ingin Anda diskusikan selanjutnya?',
    inputPlaceholder: 'Ketik pesan Anda di sini...',
    sendButton: 'Kirim',
    initializationError: 'Gagal memulai obrolan. Silakan periksa kunci API Anda dan segarkan halaman.',
    responseError: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
  },
};

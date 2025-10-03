const ExamplePrompts = ({ onPromptClick }) => {
  const prompts = [
    {
      icon: "🏖️",
      text: "Plan a beach vacation to Goa",
      prompt: "Plan a 5-day trip to Goa from December 15 to December 20"
    },
    {
      icon: "🏔️", 
      text: "Mountain adventure in Switzerland",
      prompt: "Plan a mountain trip to Interlaken from January 10 to January 15"
    },
    {
      icon: "🏛️",
      text: "Cultural tour of Rome",
      prompt: "Plan a cultural heritage trip to Rome from March 5 to March 10"
    },
    {
      icon: "🌸",
      text: "Cherry blossom season in Japan", 
      prompt: "Plan a trip to Tokyo during cherry blossom season from April 1 to April 7"
    },
    {
      icon: "🌴",
      text: "Tropical getaway to Bali",
      prompt: "Plan a tropical vacation to Bali from February 20 to February 27"
    },
    {
      icon: "🎭",
      text: "City break in Paris",
      prompt: "Plan a romantic city break to Paris from November 15 to November 18"
    }
  ];

  return (
    <div className="py-6">
      <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">✨ Try these popular requests</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onPromptClick(item.prompt)}
            className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-sm text-gray-700 group-hover:text-blue-600">{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExamplePrompts;
export default function FontPreview() {
  const fontOptions = [
    {
      name: "Current - Fredoka + Inter",
      description: "Playful + Professional",
      brandFont: "Fredoka",
      contentFont: "Inter", 
      active: true
    },
    {
      name: "Modern Tech - Poppins + Roboto", 
      description: "Clean + Readable",
      brandFont: "Poppins",
      contentFont: "Roboto"
    },
    {
      name: "Elegant - Playfair + Source Sans",
      description: "Sophisticated + Clean", 
      brandFont: "Playfair Display",
      contentFont: "Source Sans Pro"
    },
    {
      name: "Bold Modern - Montserrat + Open Sans",
      description: "Strong + Friendly",
      brandFont: "Montserrat", 
      contentFont: "Open Sans"
    },
    {
      name: "Creative Tech - Nunito + Lato",
      description: "Rounded + Professional",
      brandFont: "Nunito",
      contentFont: "Lato"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white">
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
        Font Preview for SmoothEDIT
      </h2>
      
      <div className="grid gap-8">
        {fontOptions.map((option, index) => (
          <div key={index} className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            {/* Option Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{option.name}</h3>
                <p className="text-sm text-slate-500">{option.description}</p>
              </div>
              {option.active && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Current
                </span>
              )}
            </div>

            {/* Font Preview */}
            <div className="border-t border-slate-100 pt-4">
              {/* Brand Logo Preview */}
              <div className="mb-6">
                <h1 
                  className="text-4xl font-bold mb-2"
                  style={{ 
                    fontFamily: `'${option.brandFont}', sans-serif`,
                    color: "#3B82F6"
                  }}
                >
                  <span style={{ color: "#3B82F6" }}>Smooth</span><span style={{ color: "#EF4444" }}>EDIT</span>
                </h1>
                <p className="text-sm text-slate-500">Brand Logo Font: {option.brandFont}</p>
              </div>

              {/* Content Preview */}
              <div style={{ fontFamily: `'${option.contentFont}', sans-serif` }}>
                <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                  AI-Powered Video Processing
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  Automatically fix stuttered cuts, audio sync problems, and corrupted sections in your videos. 
                  Perfect for TikTok, Instagram Reels, and YouTube Shorts creators.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="bg-slate-100 px-3 py-1 rounded-full">Videos Processed: 2</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">Drafts Saved: 1</span>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">Time Saved: 30m</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Content Font: {option.contentFont}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How to Switch Fonts:</h3>
        <p className="text-blue-800 text-sm">
          Tell me which option you like and I'll update your fonts instantly! 
          The changes will apply to your entire SmoothEDIT application.
        </p>
      </div>
    </div>
  );
}
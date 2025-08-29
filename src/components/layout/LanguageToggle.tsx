import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Languages, Globe } from "lucide-react";

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageToggle() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showPreviewBanner, setShowPreviewBanner] = useState(false);

  useEffect(() => {
    // Load language from localStorage
    const saved = localStorage.getItem('language');
    if (saved) {
      setCurrentLanguage(saved);
      setShowPreviewBanner(saved !== 'en');
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('language', langCode);
    setShowPreviewBanner(langCode !== 'en');
    
    // In a real implementation, this would trigger translation loading
    console.log('Language changed to:', langCode);
  };

  const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0];

  return (
    <>
      {/* Preview Banner */}
      {showPreviewBanner && (
        <div className="bg-muted border-b px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            <span>Language selection is preview only - full translations coming soon</span>
            <Badge variant="outline" className="text-xs">
              Preview
            </Badge>
          </div>
        </div>
      )}

      {/* Language Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">{currentLang.flag} {currentLang.name}</span>
            <span className="sm:hidden">{currentLang.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={currentLanguage === lang.code ? 'bg-muted' : ''}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
              {currentLanguage === lang.code && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Current
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
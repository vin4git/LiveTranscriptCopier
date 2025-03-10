import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <svg className="w-8 h-8 text-primary mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z"></path>
          <path d="M7 9H17V11H7V9Z"></path>
          <path d="M7 12H14V14H7V12Z"></path>
          <path d="M7 6H17V8H7V6Z"></path>
        </svg>
        <h1 className="text-xl font-semibold text-neutral-600">TranscriptSync</h1>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
          <Settings className="h-5 w-5" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center ml-2">
          <span>JS</span>
        </div>
      </div>
    </header>
  );
}

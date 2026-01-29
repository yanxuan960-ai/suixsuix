import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading: React.FC = () => (
  <div className="flex items-center justify-center p-4 text-ios-gray">
    <Loader2 className="w-5 h-5 animate-spin mr-2" />
    <span className="text-sm font-medium">AI 正在思考...</span>
  </div>
);
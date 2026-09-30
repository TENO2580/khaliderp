import os
import re

sidebar_path = r"C:\DYNAMICE CRM TRIPIDIO\universal-crm\src\components\layout\Sidebar.tsx"
with open(sidebar_path, 'r', encoding='utf-8') as f:
    sidebar = f.read()

if "Video: () =>" not in sidebar:
    replacement = '''    Video: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    Phone: () => ('''
    sidebar = sidebar.replace("    Phone: () => (", replacement)

if "/meetings" not in sidebar:
    replacement2 = '''<NavLink href="/activities" icon={<Icons.Phone />} label="Call Logs" isActive={false} collapsed={collapsed} />
              <NavLink href="/meetings" icon={<Icons.Video />} label="Meetings" isActive={pathname.startsWith('/meetings')} collapsed={collapsed} />'''
    sidebar = sidebar.replace('<NavLink href="/activities" icon={<Icons.Phone />} label="Call Logs" isActive={false} collapsed={collapsed} />', replacement2)

with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(sidebar)

print("Sidebar patched.")

page_path = r"C:\DYNAMICE CRM TRIPIDIO\universal-crm\src\app\(app)\meetings\page.tsx"
page_content = '''"use client";

import React, { useState } from 'react';
import { Video, Copy, ExternalLink, RefreshCw } from 'lucide-react';

export default function MeetingsPage() {
  const [meetingId, setMeetingId] = useState('');
  const [inMeeting, setInMeeting] = useState(false);

  const startNewMeeting = () => {
    const id = Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 6);
    setMeetingId(id);
    setInMeeting(true);
  };

  if (inMeeting) {
    const roomUrl = https://meet.jit.si/UniversalCRM-;
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white">Active Meeting</h1>
              <p className="text-xs text-slate-500">ID: {meetingId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigator.clipboard.writeText(roomUrl)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-xl"
            >
              <Copy className="w-4 h-4" /> Copy Invite Link
            </button>
            <button 
              onClick={() => setInMeeting(false)}
              className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl"
            >
              Leave Meeting
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-950 w-full relative">
          <iframe 
            src={roomUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width: '100%', height: '100%', border: 'none' }}
          ></iframe>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto mt-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl mb-6">
          <Video className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
          Video Meetings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Start an instant Google Meet-like video conference directly within your CRM. Share the link with clients to join without any downloads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">New Meeting</h2>
          <p className="text-sm text-slate-500 mb-8">Start an instant meeting right now</p>
          <button 
            onClick={startNewMeeting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Video className="w-5 h-5" /> Start an instant meeting
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Join with a code or link</h2>
          <p className="text-sm text-slate-500 mb-6">Enter a meeting code or link to join an existing room</p>
          
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Enter a code or link" 
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors">
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'''
with open(page_path, 'w', encoding='utf-8') as f:
    f.write(page_content)
print("Page created.")


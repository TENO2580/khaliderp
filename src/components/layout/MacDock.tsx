'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS, hasPermission } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { ChevronUp } from 'lucide-react';

export default function MacDock() {
  const { user } = useAuth();
  const mouseX = useMotionValue(Infinity);
  const [openStack, setOpenStack] = useState<string | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission || !user) return true;
    return hasPermission(user.role, item.permission);
  });

  // Close stack when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setOpenStack(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <motion.div
        ref={dockRef}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="mx-auto flex h-16 items-end gap-3 rounded-2xl bg-white/70 px-4 pb-2 pt-2 shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:bg-[#12121a]/80 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/40 dark:border-white/10"
      >
        {filteredNavItems.map((item) => (
          <DockItem 
            key={item.title} 
            item={item} 
            mouseX={mouseX} 
            isOpen={openStack === item.title}
            onToggle={() => setOpenStack(openStack === item.title ? null : item.title)}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </motion.div>
    </div>
  );
}

function DockItem({ item, mouseX, isOpen, onToggle, isActive }: any) {
  const ref = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 80, 48]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      onToggle();
    } else {
      router.push(item.href);
    }
  };

  return (
    <div className="relative flex flex-col items-center group">
      {/* Tooltip */}
      <div className="absolute -top-12 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap dark:bg-white dark:text-gray-900 font-medium">
          {item.title}
        </div>
      </div>

      {/* Stack Popup */}
      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute bottom-full mb-4 w-48 rounded-xl bg-white/90 p-2 shadow-2xl backdrop-blur-xl dark:bg-[#1e1e2d]/90 border border-gray-200 dark:border-white/10"
          >
            <div className="flex flex-col gap-1">
              {item.children.map((child: any) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => onToggle()}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  {child.title}
                </Link>
              ))}
            </div>
            {/* Triangle pointer */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/90 dark:border-t-[#1e1e2d]/90" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={ref}
        style={{ width, height: width }}
        onClick={handleClick}
        className={cn(
          "relative flex items-center justify-center rounded-2xl transition-colors duration-200",
          isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        )}
      >
        <Icon className="h-1/2 w-1/2" />
        
        {/* Active Dot indicator */}
        {isActive && (
          <div className="absolute -bottom-2 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
        )}
      </motion.button>
    </div>
  );
}

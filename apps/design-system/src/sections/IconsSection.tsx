import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight,
  Menu, Check, CheckCircle2, CheckSquare,
  X, XCircle, Plus, Minus, MinusCircle, Circle,
  Pencil, Trash2, Save, RefreshCw, Undo2,
  Search, Download, Upload, Send, Link2, ExternalLink,
  Paperclip, Eye, EyeOff, Pause, Play, Zap, List, LayoutGrid,
  Info, AlertTriangle, AlertCircle, Ban, Shield, Clock,
  History, Hourglass, Flag, BadgeCheck, Crown,
  User, Users, UserPlus, IdCard, LogIn, LogOut, Lock, AtSign,
  Bell, MessageSquare, Mail, Inbox,
  DollarSign, CreditCard, Wallet, Banknote, Gift, Star, BarChart3,
  File, FilePen, FileInput, FolderOpen, Database, Server, Network, Box,
  Home, Settings, Wrench, Palette, Globe, Megaphone, Building2, Calendar,
  Loader2, Compass,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_GROUPS: Record<string, [string, LucideIcon][]> = {
  'Navigation & Arrows': [
    ['ChevronLeft', ChevronLeft], ['ChevronRight', ChevronRight],
    ['ChevronDown', ChevronDown], ['ChevronUp', ChevronUp],
    ['ArrowDown', ArrowDown], ['ArrowLeft', ArrowLeft],
    ['ArrowRight', ArrowRight], ['ArrowUp', ArrowUp],
    ['ArrowUpRight', ArrowUpRight], ['Menu', Menu],
  ],
  'Actions': [
    ['Check', Check], ['CheckCircle2', CheckCircle2], ['CheckSquare', CheckSquare],
    ['X', X], ['XCircle', XCircle], ['Plus', Plus],
    ['Minus', Minus], ['MinusCircle', MinusCircle], ['Circle', Circle],
    ['Pencil', Pencil], ['Trash2', Trash2], ['Save', Save],
    ['RefreshCw', RefreshCw], ['Undo2', Undo2], ['Search', Search],
    ['Download', Download], ['Upload', Upload], ['Send', Send],
    ['Link2', Link2], ['ExternalLink', ExternalLink], ['Paperclip', Paperclip],
    ['Eye', Eye], ['EyeOff', EyeOff], ['Pause', Pause],
    ['Play', Play], ['Zap', Zap], ['List', List], ['LayoutGrid', LayoutGrid],
  ],
  'Status & Feedback': [
    ['Info', Info], ['AlertTriangle', AlertTriangle], ['AlertCircle', AlertCircle],
    ['Ban', Ban], ['Shield', Shield], ['Clock', Clock],
    ['History', History], ['Hourglass', Hourglass], ['Flag', Flag],
    ['BadgeCheck', BadgeCheck], ['Crown', Crown],
  ],
  'People & Auth': [
    ['User', User], ['Users', Users], ['UserPlus', UserPlus],
    ['IdCard', IdCard], ['LogIn', LogIn], ['LogOut', LogOut],
    ['Lock', Lock], ['AtSign', AtSign],
  ],
  'Communication': [
    ['Bell', Bell], ['MessageSquare', MessageSquare], ['Mail', Mail], ['Inbox', Inbox],
  ],
  'Money & Commerce': [
    ['DollarSign', DollarSign], ['CreditCard', CreditCard], ['Wallet', Wallet],
    ['Banknote', Banknote], ['Gift', Gift], ['Star', Star], ['BarChart3', BarChart3],
  ],
  'Files & Data': [
    ['File', File], ['FilePen', FilePen], ['FileInput', FileInput],
    ['FolderOpen', FolderOpen], ['Database', Database], ['Server', Server],
    ['Network', Network], ['Box', Box],
  ],
  'Layout & System': [
    ['Home', Home], ['Settings', Settings], ['Wrench', Wrench],
    ['Palette', Palette], ['Globe', Globe], ['Megaphone', Megaphone],
    ['Building2', Building2], ['Calendar', Calendar],
  ],
  'Shell Navigation': [
    ['Compass', Compass], ['Loader2', Loader2],
  ],
};

export function IconsSection() {
  const [filter, setFilter] = useState('');
  const lowerFilter = filter.toLowerCase();

  return (
    <section id="icons">
      <h2 className="text-2xl font-heading font-bold mb-2">Icons</h2>
      <p className="body-sm text-text-muted mb-6">
        Lucide React icons at 20px, stroke-width 2, currentColor. Click to copy import name.
      </p>

      <input
        className="input mb-6 max-w-sm"
        placeholder="Filter icons..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {Object.entries(ICON_GROUPS).map(([group, icons]) => {
        const filtered = icons.filter(([name]) => name.toLowerCase().includes(lowerFilter));
        if (filtered.length === 0) return null;
        return (
          <div key={group} className="mb-8">
            <h4 className="text-lg font-heading font-semibold mb-3">{group}</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {filtered.map(([name, Icon]) => (
                <IconCell key={name} name={name} Icon={Icon} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function IconCell({ name, Icon }: { name: string; Icon: LucideIcon }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      onClick={copy}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
      title={name}
    >
      <Icon size={20} strokeWidth={2} />
      <span className="text-[10px] font-mono text-text-muted truncate w-full text-center">
        {copied ? 'Copied!' : name}
      </span>
    </button>
  );
}

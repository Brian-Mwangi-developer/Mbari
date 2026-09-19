import {cssInterop} from 'nativewind';
import {
  Archive,
  Bell,
  Bookmark,
  Heart,
  Play,
  Sparkles,
  Undo2,
  X,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudDownload,
  Copy,
  CornerUpRight,
  Download,
  HardDrive,
  Headphones,
  Highlighter,
  Layers,
  Mail,
  Menu,
  Search,
  Plus,
  Rss,
  Settings,
  Share2,
  Sun,
  Trash,
  Type,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

/**
 * Lets icons take `className` and map colour/opacity utilities onto the SVG
 * props, e.g. <SunIcon className="text-primary" size={22} />.
 * Register every icon the app uses here.
 */
const INTEROP = {
  className: {
    target: 'style',
    nativeStyleToProp: {color: true, opacity: true},
  },
} as const;

cssInterop(Sun, INTEROP);
cssInterop(Archive, INTEROP);
cssInterop(Rss, INTEROP);
cssInterop(Settings, INTEROP);
cssInterop(Copy, INTEROP);
cssInterop(Check, INTEROP);
cssInterop(Plus, INTEROP);
cssInterop(Volume2, INTEROP);
cssInterop(VolumeX, INTEROP);
cssInterop(ChevronRight, INTEROP);
cssInterop(ChevronLeft, INTEROP);
cssInterop(Type, INTEROP);
cssInterop(BookOpen, INTEROP);
cssInterop(CloudDownload, INTEROP);
cssInterop(Clock, INTEROP);
cssInterop(Bell, INTEROP);
cssInterop(Download, INTEROP);
cssInterop(Trash, INTEROP);
cssInterop(Menu, INTEROP);
cssInterop(Search, INTEROP);
cssInterop(Layers, INTEROP);
cssInterop(Mail, INTEROP);
cssInterop(CornerUpRight, INTEROP);
cssInterop(HardDrive, INTEROP);
cssInterop(Headphones, INTEROP);
cssInterop(Highlighter, INTEROP);
cssInterop(Share2, INTEROP);
cssInterop(Bookmark, INTEROP);
cssInterop(Heart, INTEROP);
cssInterop(Play, INTEROP);
cssInterop(Sparkles, INTEROP);
cssInterop(Undo2, INTEROP);
cssInterop(X, INTEROP);

export {
  Sun as SunIcon,
  Archive as ArchiveIcon,
  Rss as RssIcon,
  Settings as SettingsIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Plus as PlusIcon,
  Volume2 as UnmutedIcon,
  VolumeX as MutedIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as BackIcon,
  Type as TypeIcon,
  BookOpen as BookIcon,
  CloudDownload as OfflineIcon,
  Clock as ClockIcon,
  Bell as BellIcon,
  Download as DownloadIcon,
  Trash as TrashIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Layers as LayersIcon,
  Mail as MailIcon,
  CornerUpRight as PassedOverIcon,
  HardDrive as DeviceIcon,
  Headphones as HeadphonesIcon,
  Highlighter as HighlighterIcon,
  Share2 as ShareIcon,
  Bookmark as SaveIcon,
  Heart as LikeIcon,
  Play as PlayIcon,
  Sparkles as NoticedIcon,
  Undo2 as UndoIcon,
  X as CloseIcon,
};

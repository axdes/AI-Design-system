import './Icon.css'
import {
  ArrowLeft, History, Settings, ListChecks, ShieldCheck, Download, SlidersHorizontal,
  ArrowUp, ArrowDown, Minus, Scale, HandMetal,
  Check, X, Menu, ClipboardCheck, Eye, EyeOff,
  CircleCheck, TriangleAlert, CircleX, Info,
  File, FileText, Film, Megaphone, Share2, Newspaper, Pencil, Copy, Trash2, Type,
  IdCard, CircleGauge,
  Mic, CalendarDays, Volume2, ThumbsUp, ThumbsDown, SendHorizontal, Timer,
  Pin, Archive, Square, LoaderCircle, SkipForward, Undo2,
  Play, Pause, RefreshCw, Upload, Compass, Lightbulb, Brain, Quote, Presentation,
  Plus, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Search, Clock, Folder, FolderPlus, FolderInput,
  Save, ArrowLeftToLine, ArrowRightToLine,
  Sun, Moon, Phone, PhoneOff, PhoneForwarded, MapPin,
  Table2,
  type LucideIcon,
  UserPlus,
  Users, LayoutDashboard, MessageCircle, LogOut, User as UserIcon,
  Wind, Flame, HeartPulse, Shield, ZapOff, Droplet, Layers, Flag, Briefcase, Star,
} from 'lucide-react'
import { type SVGAttributes, type SVGProps } from 'react'
import { cn } from '../../lib/cn'

/* Spark: the concave four-point star, filled. Local SVG — Lucide's stroked
 * Sparkles read poorly at small sizes; this one stays crisp. Fills with
 * currentColor like every other icon, so the CONSUMER decides what an
 * AI-flavoured accent looks like; the DS does not ship one.
 * Matches the LucideIcon call contract. */
const AiSpark = ((props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    stroke="none"
    {...props}
  >
    <path d="M12 2c.74 5.45 4.55 9.26 10 10-5.45.74-9.26 4.55-10 10-.74-5.45-4.55-9.26-10-10 5.45-.74 9.26-4.55 10-10Z" />
  </svg>
)) as unknown as LucideIcon

/* Material auto_awesome lookalike: one big concave star + two satellites,
 * all FILLED with currentColor - reads crisply on solid surfaces (the FAB)
 * where a stroked or gradient spark gets lost. */
const AutoAwesome = ((props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    stroke="none"
    {...props}
  >
    <path
      transform="translate(0 4.8) scale(0.72)"
      d="M12 2c.74 5.45 4.55 9.26 10 10-5.45.74-9.26 4.55-10 10-.74-5.45-4.55-9.26-10-10 5.45-.74 9.26-4.55 10-10Z"
    />
    <path
      transform="translate(13 1.5) scale(0.38)"
      d="M12 2c.74 5.45 4.55 9.26 10 10-5.45.74-9.26 4.55-10 10-.74-5.45-4.55-9.26-10-10 5.45-.74 9.26-4.55 10-10Z"
    />
    <path
      transform="translate(14.6 13.4) scale(0.3)"
      d="M12 2c.74 5.45 4.55 9.26 10 10-5.45.74-9.26 4.55-10 10-.74-5.45-4.55-9.26-10-10 5.45-.74 9.26-4.55 10-10Z"
    />
  </svg>
)) as unknown as LucideIcon

const ICONS = {
  add: Plus,
  arrow_drop_down: ChevronDown,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  more_vert: MoreVertical,
  search: Search,
  schedule: Clock,
  folder: Folder,
  create_new_folder: FolderPlus,
  drive_file_move: FolderInput,
  drive_file_rename_outline: Type,
  insert_drive_file: File,
  description: FileText,
  article: Newspaper,
  movie: Film,
  campaign: Megaphone,
  share: Share2,
  edit: Pencil,
  content_copy: Copy,
  visibility: Eye,
  visibility_off: EyeOff,
  delete: Trash2,
  group: Users,
  dashboard: LayoutDashboard,
  rate_review: ClipboardCheck,
  message: MessageCircle,
  logout: LogOut,
  person: UserIcon,
  check: Check,
  close: X,
  menu: Menu,
  arrow_left_to_line:  ArrowLeftToLine,
  arrow_right_to_line: ArrowRightToLine,
  arrow_back:       ArrowLeft,
  history:          History,
  settings:         Settings,
  list_alt:         ListChecks,
  table:            Table2,
  verified:         ShieldCheck,
  download:         Download,
  tune:             SlidersHorizontal,
  text_fields:      Type,
  save:             Save,
  mic:              Mic,
  calendar:         CalendarDays,
  timer:            Timer,
  volume:           Volume2,
  thumb_up:         ThumbsUp,
  thumb_down:       ThumbsDown,
  send:             SendHorizontal,
  person_add:       UserPlus,
  check_circle:     CircleCheck,
  warning:          TriangleAlert,
  error:            CircleX,
  info:             Info,
  pin:              Pin,
  archive:          Archive,
  progress_activity: LoaderCircle,
  stop:             Square,
  skip_forward:     SkipForward,
  undo:             Undo2,
  light_mode:       Sun,
  dark_mode:        Moon,
  phone:            Phone,
  phone_off:        PhoneOff,
  air:              Wind,
  local_fire_department: Flame,
  medical_services: HeartPulse,
  security:         Shield,
  power_off:        ZapOff,
  water_drop:       Droplet,
  phone_callback:   PhoneForwarded,
  location_on:      MapPin,
  layers:           Layers,
  flag:             Flag,
  work:             Briefcase,
  star:             Star,
  sparkles:         AiSpark,
  auto_awesome:     AutoAwesome,
  badge:            IdCard,
  /* CircleGauge, not Gauge: Lucide's `Gauge` is an ARC with a gap at the top
   * left, and at 16px that gap reads as a circle somebody clipped (owner,
   * 23.08: it is cut off in the second card). The closed dial says the same
   * thing and survives the size. */
  gauge:            CircleGauge,
  play:             Play,
  pause:            Pause,
  refresh:          RefreshCw,
  upload:           Upload,
  explore:          Compass,
  lightbulb:        Lightbulb,
  psychology:       Brain,
  quote:            Quote,
  presentation:     Presentation,
  arrow_upward:     ArrowUp,
  arrow_downward:   ArrowDown,
  remove:           Minus,
  balance:          Scale,
  nudge:            HandMetal,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS
type Size = 'sm' | 'md' | 'lg' | 'xl'

/* WHAT A CALLER PUTS ON AN ICON HAS TO ARRIVE.
 *
 * This took only `name`, `size` and `className`, and TypeScript did not object
 * to the rest: it deliberately skips checking any JSX attribute whose name
 * contains a hyphen, so every `data-*` a caller passed was accepted at the type
 * level and thrown away at runtime. <Rating> computed `data-fill` per star and
 * lost it, so `.rating-star[data-fill='full']` matched nothing and every star
 * rendered as an outline — the exact failure the rule beside it was written to
 * fix in the first place, back a second time and invisible because the visual
 * baseline had been accepted with it (2026-08-29). */
type Props = Omit<SVGAttributes<SVGSVGElement>, 'name' | 'ref'> & {
  /** Which glyph, by its Material-style name. Every name the system has is a
   *  member of `IconName`; there is no free-text escape, because an icon nobody
   *  can find is an icon nobody reuses. */
  name: IconName
  /** How big, and it follows the JOB rather than taste. `sm` (default) sits
   *  inline with text and inside buttons. `md` is for navigation and list rows,
   *  where the glyph is a landmark. `lg`/`xl` are for the single mark on an
   *  empty state or a page with nothing else on it — in a row of controls they
   *  make everything beside them look broken. */
  size?: Size
  className?: string
}

/**
 * Every icon in the system, addressed by Material-style name. Size comes from
 * CSS through `size`, so changing an --icon-* token cascades everywhere at
 * once.
 *
 * Copy: there is no copy here on purpose: an icon carries no words, so anything
 * it must say belongs on the control around it.
 */
export function Icon({ name, size = 'sm', className, ...rest }: Props) {
  const Component = ICONS[name]
  /* Size handled by CSS via data-size → --icon-* tokens. We don't pass `size`
   * to Lucide so settings.css can drive icon size globally. */
  return <Component className={cn('icon', className)} data-size={size} aria-hidden="true" {...rest} />
}

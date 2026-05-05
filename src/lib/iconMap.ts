import type { FC } from 'react'
import {
  HomeIcon, StarIcon, HeartIcon, RocketIcon, BackpackIcon,
  BarChartIcon, CameraIcon, ChatBubbleIcon, ClockIcon, GlobeIcon,
  LaptopIcon, MixerHorizontalIcon, PersonIcon, PieChartIcon, SewingPinIcon,
  FileIcon, GearIcon, MagnifyingGlassIcon,
  CardStackIcon, MobileIcon, CalendarIcon, BookmarkIcon, BellIcon,
  ScissorsIcon, DrawingPinIcon, Cross2Icon, ActivityLogIcon,
  ArchiveIcon, TokensIcon, MixIcon, Pencil2Icon,
  ArrowUpIcon, ArrowDownIcon, SunIcon, LayersIcon, CubeIcon,
} from '@radix-ui/react-icons'

export type IconName = string

export const ICON_MAP: Record<string, FC<{ className?: string }>> = {
  HomeIcon, DrawingPinIcon, SewingPinIcon,
  CubeIcon,
  HeartIcon, Cross2Icon, ActivityLogIcon, SunIcon,
  RocketIcon, GlobeIcon, BackpackIcon,
  LaptopIcon, MobileIcon, GearIcon,
  CardStackIcon, BarChartIcon, PieChartIcon, TokensIcon, ArrowUpIcon, ArrowDownIcon,
  CalendarIcon, ClockIcon, BellIcon, MixerHorizontalIcon, MixIcon,
  Pencil2Icon, FileIcon, ArchiveIcon, MagnifyingGlassIcon,
  CameraIcon, ChatBubbleIcon, StarIcon,
  LayersIcon, ScissorsIcon,
  PersonIcon, BookmarkIcon,
}

export const ICON_LIST = Object.keys(ICON_MAP)

export const EMOJI_GROUPS = [
  {
    label: 'Alimentação',
    icons: ['🍔', '🍕', '🍣', '🌮', '☕', '🛒', '🍽️', '🥤', '🍰', '🥗'],
  },
  {
    label: 'Transporte',
    icons: ['🚗', '🏍️', '⛽', '🚌', '✈️', '🚂', '🚕', '🛵', '🚲', '🛻'],
  },
  {
    label: 'Saúde',
    icons: ['💊', '🏥', '🩺', '💉', '🦷', '👓', '🧴', '🏃', '🧘', '🩹'],
  },
  {
    label: 'Vestuário',
    icons: ['👕', '👟', '👗', '🧥', '👜', '💍', '🧢', '👔', '🧦', '👠'],
  },
  {
    label: 'Casa',
    icons: ['🏠', '🛋️', '💡', '🔧', '📦', '🧹', '🌿', '🔑', '🪴', '🛁'],
  },
  {
    label: 'Lazer',
    icons: ['🎮', '🎬', '🎵', '📚', '🎯', '⚽', '🏋️', '🎭', '🎲', '🎸'],
  },
  {
    label: 'Educação',
    icons: ['📖', '✏️', '🎓', '💻', '📝', '🔬', '🏫', '📐', '🖊️', '📒'],
  },
  {
    label: 'Finanças',
    icons: ['💰', '💳', '📊', '💵', '🏦', '📈', '💸', '🪙', '💹', '🏧'],
  },
  {
    label: 'Outros',
    icons: ['⭐', '❤️', '🎁', '📱', '💼', '🌍', '⚙️', '🔔', '🐾', '🌟'],
  },
]

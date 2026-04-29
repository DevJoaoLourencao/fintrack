import type { FC } from 'react'
import {
  // Já existentes
  HomeIcon, StarIcon, HeartIcon, RocketIcon, BackpackIcon,
  BarChartIcon, CameraIcon, ChatBubbleIcon, ClockIcon, GlobeIcon,
  LaptopIcon, MixerHorizontalIcon, PersonIcon, PieChartIcon, SewingPinIcon,
  FileIcon, GearIcon, MagnifyingGlassIcon,
  // Novos — finanças e transações
  CardStackIcon, MobileIcon, CalendarIcon, BookmarkIcon, BellIcon,
  ScissorsIcon, DrawingPinIcon, Cross2Icon, ActivityLogIcon,
  ArchiveIcon, TokensIcon, MixIcon, Pencil2Icon,
  ArrowUpIcon, ArrowDownIcon, SunIcon, LayersIcon, CubeIcon,
} from '@radix-ui/react-icons'

export type IconName = string

export const ICON_MAP: Record<string, FC<{ className?: string }>> = {
  // Moradia e local
  HomeIcon,
  DrawingPinIcon,
  SewingPinIcon,
  // Alimentação / Supermercado
  CubeIcon,
  // Saúde e bem-estar
  HeartIcon,
  Cross2Icon,
  ActivityLogIcon,
  SunIcon,
  // Transporte e viagem
  RocketIcon,
  GlobeIcon,
  BackpackIcon,
  // Tecnologia
  LaptopIcon,
  MobileIcon,
  GearIcon,
  // Finanças e pagamentos
  CardStackIcon,
  BarChartIcon,
  PieChartIcon,
  TokensIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  // Assinaturas e serviços
  CalendarIcon,
  ClockIcon,
  BellIcon,
  MixerHorizontalIcon,
  MixIcon,
  // Educação e trabalho
  Pencil2Icon,
  FileIcon,
  ArchiveIcon,
  MagnifyingGlassIcon,
  // Lazer e social
  CameraIcon,
  ChatBubbleIcon,
  StarIcon,
  // Compras e beleza
  LayersIcon,
  ScissorsIcon,
  // Pessoal
  PersonIcon,
  BookmarkIcon,
}

export const ICON_LIST = Object.keys(ICON_MAP)

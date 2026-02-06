import type {
  KPIMetric,
  ActivityItem,
} from "./types";

// Dashboard KPIs
export const dashboardKPIs: KPIMetric[] = [
  {
    label: "Active Users",
    value: "8,429",
    change: 8.2,
    changeType: "increase",
    period: "vs last month",
  },
  {
    label: "Referrals",
    value: "156",
    change: 12.5,
    changeType: "increase",
    period: "vs last month",
  },
  {
    label: "Credits Issued",
    value: "25,000",
    change: 18.7,
    changeType: "increase",
    period: "vs last month",
  },
  {
    label: "Blog Views",
    value: "45.2K",
    change: 5.4,
    changeType: "increase",
    period: "vs last month",
  },
];

// Recent Activity
export const recentActivity: ActivityItem[] = [
  {
    id: "act-1",
    type: "user_signup",
    message: "New user registered",
    timestamp: "2026-02-03T10:30:00Z",
    user: "alex.johnson@email.com",
  },
  {
    id: "act-2",
    type: "referral",
    message: "Referral bonus credited",
    timestamp: "2026-02-03T10:15:00Z",
    user: "maria.garcia@email.com",
    metadata: { amount: 25 },
  },
  {
    id: "act-3",
    type: "content",
    message: "Blog post published",
    timestamp: "2024-01-15T08:30:00Z",
    user: "emily@example.com",
    metadata: { title: "Getting Started Guide" },
  },
  {
    id: "act-4",
    type: "system",
    message: "Automated backup completed",
    timestamp: "2024-01-15T09:00:00Z",
    user: "system",
  },
];

// System Health
export const systemHealth = [
  {
    name: "API Server",
    status: "healthy",
    uptime: 99.98,
    latency: 45,
  },
  {
    name: "Database",
    status: "healthy",
    uptime: 99.99,
    latency: 12,
  },
  {
    name: "Cache",
    status: "healthy",
    uptime: 99.95,
    latency: 3,
  },
];

// Engagement Chart Data
export const engagementData = [
  { date: "Jan 1", conversations: 420, leads: 42 },
  { date: "Jan 2", conversations: 380, leads: 38 },
  { date: "Jan 3", conversations: 510, leads: 51 },
  { date: "Jan 4", conversations: 460, leads: 46 },
  { date: "Jan 5", conversations: 580, leads: 58 },
  { date: "Jan 6", conversations: 490, leads: 49 },
  { date: "Jan 7", conversations: 620, leads: 62 },
  { date: "Jan 8", conversations: 550, leads: 55 },
  { date: "Jan 9", conversations: 480, leads: 48 },
  { date: "Jan 10", conversations: 710, leads: 71 },
  { date: "Jan 11", conversations: 680, leads: 68 },
  { date: "Jan 12", conversations: 590, leads: 59 },
  { date: "Jan 13", conversations: 640, leads: 64 },
  { date: "Jan 14", conversations: 720, leads: 72 },
  { date: "Jan 15", conversations: 810, leads: 81 },
];

// Aliases for component imports
export const serviceStatuses = systemHealth;


export type AuthResponse = {
  id: string
}

export type InvitationRole = 'WORKER' | 'LEADER'

export type InvitationStatus = 'accepted' | 'expired' | 'pending' | 'revoked'

export type Invitation = {
  acceptedAt: string | null
  createdAt: string
  email: string
  expiresAt: string
  id: string
  inviteUrl: string
  revokedAt: string | null
  role: string
  status: InvitationStatus
}

export type ScanResult =
  | {
      checkedInAt: string
      date: string
      event: 'CHECK_IN'
      workPointId: string
      workPointName: string
    }
  | {
      checkedInAt: string
      checkedOutAt: string
      checkoutSource: 'QR' | 'MANUAL' | 'AUTO' | null
      date: string
      earnings: number | null
      event: 'CHECK_OUT' | 'ALREADY_COMPLETED'
      hours: number
      workPointId: string
      workPointName: string
    }

export type DailyStatRow = {
  checkedInAt: string
  checkedOutAt: string | null
  checkoutSource: 'QR' | 'MANUAL' | 'AUTO' | null
  complete: boolean
  date: string
  earnings: number
  hours: number
  id: string
  workPoint: {
    id: string
    name: string
  }
}

export type MonthlySummary = {
  completeDays: number
  hourlyWage: number | null
  totalDays: number
  totalEarnings: number
  totalHours: number
}

export type AttendanceRecord = {
  checkedInAt: string
  checkedOutAt: string | null
  checkoutSource: 'QR' | 'MANUAL' | 'AUTO' | null
  date: string
  id: string
  source: string
  workPointId: string
  worker: {
    email: string
    id: string
    username: string
  }
  workerId: string
}

export type QrResponse = {
  qrPng: string
  qrToken: string
}

export type ChatType = 'DIRECT' | 'GROUP' | 'WORKPOINT'

export type ChatListItem = {
  id: string
  lastMessage?: {
    attachmentName?: string
    body: string
    createdAt: string
    id: string
    senderId: string
    senderUsername: string
  }
  lastMessageAt?: string
  name: string
  otherUserId?: string
  participants: Array<{
    id: string
    username: string
  }>
  type: ChatType
  unreadCount: number
  workPointId?: string
}

export type MessagePayload = {
  attachmentName?: string
  attachmentType?: string
  attachmentUrl?: string
  body: string
  chatId: string
  clientNonce?: string
  createdAt: string
  editedAt?: string
  id: string
  replyTo?: {
    body: string
    id: string
    senderUsername: string
  }
  replyToId?: string
  senderId: string
  senderUsername: string
}

export type MessagesResponse = {
  hasMore: boolean
  messages: MessagePayload[]
  nextCursor?: string
}

export type UserSummary = {
  email: string
  id: string
  role: string
  username: string
}

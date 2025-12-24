export type ID = string

export type Role = 'user' | 'super_user' | 'admin'

export type Visibility = 'public' | 'friends' | 'private'

export type MediaKind = 'image' | 'video'

export interface User {
  id: ID
  phone: string
  nickname: string
  avatarUrl?: string
  bio?: string
  password?: string
  role: Role
  createdAt: number
  deleted?: boolean
}

export interface TokenRecord {
  token: string
  userId: ID
  role: Role
  createdAt: number
}

export interface FileRecord {
  id: ID
  name: string
  mime: string
  size: number
  blob: Blob
  createdAt: number
}

export interface MediaItem {
  kind: MediaKind
  fileId?: ID
  url?: string
  coverUrl?: string
  durationSec?: number
}

export interface Post {
  id: ID
  authorId: ID
  title?: string
  text?: string
  tags: string[]
  visibility: Visibility
  media: MediaItem[]
  createdAt: number
  updatedAt: number
  ratingSummary?: { avg: number; totalCount: number }
}

export interface Comment {
  id: ID
  postId: ID
  authorId: ID
  content: string
  parentId?: ID
  createdAt: number
  deleted?: boolean
}

export interface Rating {
  id: ID
  postId: ID
  userId: ID
  score: number
  createdAt: number
  updatedAt: number
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface FriendRequest {
  id: ID
  fromUserId: ID
  toUserId: ID
  status: FriendRequestStatus
  createdAt: number
  updatedAt: number
}

export interface Friendship {
  id: ID
  userA: ID
  userB: ID
  createdAt: number
}

export type JobStatus = 'queued' | 'processing' | 'success' | 'failed'

export interface VideoJob {
  id: ID
  fileId: ID
  status: JobStatus
  progress: number
  createdAt: number
  updatedAt: number
  result?: {
    playUrlMp4?: string
    playUrlHls?: string
    coverUrl?: string
    durationSec?: number
  }
  error?: string
}

export type AIAction = 'gen_title' | 'gen_tags' | 'summarize' | 'safety'

export interface AITask {
  id: ID
  status: JobStatus
  actions: AIAction[]
  input: {
    postId?: ID
    text?: string
    mediaFileIds?: ID[]
  }
  createdAt: number
  updatedAt: number
  result?: {
    title?: string
    tags?: string[]
    summary?: string
    safety?: {
      allowed: boolean
      reason?: string
    }
  }
  error?: string
}

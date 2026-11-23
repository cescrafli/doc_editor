export type ShareRole = 'editor' | 'viewer';
export type AccessRole = 'owner' | ShareRole;

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  roleTitle: string;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarColor: string;
  role: ShareRole;
  createdAt: string;
}

export interface DocumentAttachment {
  id: string;
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedHtml: string | null;
  uploadedByUserId: string;
  uploadedByName: string;
  createdAt: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  excerpt: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerAvatarColor: string;
  accessRole: AccessRole;
  shareCount: number;
  attachmentCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface DocumentDetail {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerAvatarColor: string;
  accessRole: AccessRole;
  shares: DocumentShare[];
  attachments: DocumentAttachment[];
  updatedAt: string;
  createdAt: string;
}

export interface ParsedFileResult {
  fileName: string;
  fileType: string;
  fileSize: number;
  suggestedTitle: string;
  htmlContent: string;
}

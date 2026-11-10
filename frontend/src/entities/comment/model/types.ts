export interface Comment {
  id: string;
  cardId: string;
  parentId?: string;
  text: string;
  timestamp: number;      // createdAt, ms
  updatedAt?: number;     // set when edited, ms
  authorId?: string;
  authorName?: string;
}

export interface CommentUpdate { commentId: string; text: string; updatedAt?: number }

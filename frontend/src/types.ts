export interface Card { id: string; title: string; description?: string; columnId: string }
export interface Column { id: string; title: string; cardIds: string[] }
export interface Comment { id: string; cardId: string; parentId?: string; text: string; timestamp: number; authorId?: string; authorName?: string }

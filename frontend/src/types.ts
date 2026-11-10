export interface Card { id: string; title: string; description?: string; columnId: string }
export interface Column { id: string; title: string; cardIds: string[] }
export type { Comment } from './entities/comment/model/types';

import { ApiError } from '../api/http';

// Every user-facing string of the comment / report / moderation / help features lives here
export const LIMITS = { comment: 500, details: 300 } as const;

export const REASON_LABELS = {
  spam: 'Спам',
  abuse: 'Оскорбление',
  harassment: 'Травля',
  other: 'Другое',
} as const;

export const REPORT_STATUS_LABELS = {
  pending: 'Ожидает',
  resolved: 'Решено',
  dismissed: 'Отклонено',
} as const;

export const ACCOUNT_STATUS_LABELS = {
  UNVERIFIED: 'Не подтверждён',
  VERIFIED: 'Подтверждён',
  ADMIN: 'Администратор',
  BANNED: 'Забанен',
  MUTED: 'Временный бан',
} as const;

export const MSG = {
  nav: { board: 'Доска', profile: 'Профиль', help: 'Справка', moderation: 'Модерация' },
  common: { send: 'Отправить', save: 'Сохранить', cancel: 'Отмена', edit: 'Редактировать', delete: 'Удалить', report: 'Пожаловаться', loading: 'Загрузка…' },
  comments: {
    title: 'Комментарии',
    placeholder: 'Напишите комментарий…',
    editPlaceholder: 'Текст комментария',
    empty: 'Комментариев пока нет — будьте первым!',
    edited: '(изменено)',
    typing: 'Кто-то печатает…',
    unverified: 'Комментировать могут только пользователи с подтверждённой почтой.',
    actions: 'Действия с комментарием',
    reportTooltip: 'Сообщить модераторам о нарушении правил',
    reportSent: 'Жалоба отправлена. Спасибо!',
    emptyError: 'Комментарий не может быть пустым',
    tooLongError: `Максимум ${LIMITS.comment} символов`,
    counter: (n: number) => `${n}/${LIMITS.comment}`,
  },
  report: {
    title: 'Жалоба на комментарий',
    description: 'Модераторы проверят комментарий. Автор не узнает, кто пожаловался.',
    reason: 'Причина',
    reasonPlaceholder: 'Выберите причину',
    reasonRequired: 'Выберите причину жалобы',
    details: 'Подробности (необязательно)',
    detailsPlaceholder: 'Опишите, что не так',
    tooLongError: `Максимум ${LIMITS.details} символов`,
    counter: (n: number) => `${n}/${LIMITS.details}`,
  },
  moderation: {
    title: 'Жалобы на комментарии',
    empty: 'Жалоб пока нет — всё спокойно.',
    columns: { comment: 'Комментарий', author: 'Автор', reporter: 'Пожаловался', reason: 'Причина', date: 'Дата', status: 'Статус', actions: 'Действия' },
    expand: 'Показать полностью',
    collapse: 'Свернуть',
    actions: 'Действия',
    actionsTooltip: 'Выберите, как обработать жалобу',
    dismiss: 'Отклонить',
    dismissTooltip: 'Жалоба необоснованна: комментарий остаётся',
    deleteComment: 'Удалить комментарий',
    deleteTooltip: 'Комментарий удаляется у всех, жалобы на него закрываются',
    ban7: 'Забанить автора на 7 дней',
    banForever: 'Забанить автора навсегда',
    banTooltip: 'Автор не сможет комментировать (навсегда — не сможет войти)',
    confirmDelete: 'Удалить комментарий?',
    confirmBanForever: 'Забанить автора навсегда?',
    bannedUntil: (d: string) => `до ${d}`,
    unknownAuthor: 'Профиль удалён',
  },
  help: {
    title: 'Справка',
    sections: [
      { title: 'Как работают доски', text: 'Доска состоит из колонок, а в колонках лежат карточки. Перетащите карточку за значок ⠿ в другую колонку — изменения сразу увидят все, кто открыл доску.' },
      { title: 'Как комментировать', text: 'Откройте карточку кнопкой «Comments» и напишите сообщение (до 500 символов). Свой комментарий можно изменить или удалить через меню «⋯». Администратор может изменять и удалять любые комментарии.' },
      { title: 'Как пожаловаться', text: 'В меню «⋯» чужого комментария выберите «Пожаловаться», укажите причину (спам, оскорбление, травля или другое) и при желании добавьте подробности. На один комментарий можно пожаловаться только один раз.' },
    ],
    statusesTitle: 'Что значат статусы',
    statuses: [
      { name: 'UNVERIFIED', text: 'ограниченный доступ: можно смотреть доску и менять профиль.' },
      { name: 'VERIFIED', text: 'полный доступ: карточки, перемещение и комментарии.' },
      { name: 'ADMIN', text: 'модерация: разбор жалоб, удаление комментариев, баны.' },
    ],
    faqTitle: 'Частые вопросы',
    faq: [
      { q: 'Почему я не могу комментировать?', a: 'Подтвердите почту по ссылке из письма. Также комментирование недоступно, если вас временно заблокировали.' },
      { q: 'Появился ли комментарий у других сразу?', a: 'Да, комментарии и изменения карточек обновляются у всех в реальном времени.' },
      { q: 'Что будет после жалобы?', a: 'Администратор увидит её в разделе «Модерация» и отклонит жалобу, удалит комментарий или заблокирует автора.' },
      { q: 'Можно ли отозвать жалобу?', a: 'Нет, но если жалоба ошибочна, администратор её просто отклонит.' },
      { q: 'Как изменить имя?', a: 'Откройте вкладку «Профиль»: имя в комментариях обновится автоматически.' },
    ],
  },
  errors: {
    generic: 'Что-то пошло не так. Попробуйте ещё раз.',
    forbidden: 'Недостаточно прав для этого действия',
    unauthorized: 'Войдите в аккаунт заново',
    dbDown: 'База данных недоступна. Попробуйте позже.',
    network: 'Нет соединения с сервером',
  },
} as const;

// Maps an API failure to Russian text; the server already answers 400/403/409 in Russian for our routes
export function errorText(e: unknown): string {
  if (!(e instanceof ApiError)) return e instanceof TypeError ? MSG.errors.network : MSG.errors.generic;
  if (e.status === 503) return MSG.errors.dbDown;
  if (e.status === 401) return MSG.errors.unauthorized;
  if (e.status === 403 && e.message === 'Forbidden') return MSG.errors.forbidden;
  return /[а-яё]/i.test(e.message) ? e.message : MSG.errors.generic;
}

export const site = {
  name: '摸鱼工坊',
  englishName: 'MOYU CREATIVE LAB',
  description: '一些由好奇心出发，和 AI 一起完成的网页、动画与视觉实验。作品、提示词与制作过程，在这里一起归档。',
  repository: import.meta.env.PUBLIC_REPOSITORY_URL || 'https://github.com/0xzcboy/moyu-workshop',
};

export function url(path = '') {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

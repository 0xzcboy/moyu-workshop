export type Work = {
  slug: string;
  number: string;
  title: string;
  english: string;
  category: '交互世界' | '叙事动画';
  description: string;
  tools: string[];
  cover: string;
  color: string;
  controls: string;
  notes: string;
  prompt: string;
  process: string[];
};

// These are reconstruction guides, not recovered original conversations.
export const works: Work[] = [
  {
    slug: 'seasons-planet', number: '01', title: '把四季，装进一颗星球',
    english: 'SEASONS IN YOUR PALM', category: '交互世界',
    description: '从春日花溪走到冬日雪原。一颗可以漫游的小小星球，收藏四种季节的风景。',
    tools: ['Three.js', 'WebGL', '单文件 HTML'], cover: 'seasons-planet.jpg', color: '#dfe7db',
    controls: 'WASD / 方向键行走，Shift 奔跑，空格跳跃；拖拽或 Q / E 环绕，滚轮缩放，H 隐藏界面。建议使用电脑键盘与鼠标。',
    notes: '包含 WebGL 后处理，首次加载可能需要几秒。移动端可浏览画面，但原作未提供完整触屏行走控件。生成模型与原始对话尚未核实。',
    prompt: '请用 Three.js 制作一个可以在浏览器运行的「四季掌心星球」，将 HTML、CSS 和 JavaScript 写在一个文件里。\n\n星球上连续分布春、夏、秋、冬四片区域：春季花草与溪谷，夏季葱郁植被，秋季暖色树林，冬季积雪。整体采用细腻、治愈的低多边形风格，加入柔和光照、天空与适度泛光。\n\n设计一个小角色，可以用 WASD 或方向键行走、Shift 奔跑、空格跳跃。角色需要贴合球形地表移动，镜头平滑跟随；支持拖拽环绕、滚轮缩放，拉远时能看清完整星球。\n\n加入中文季节提示、操作说明、加载状态和隐藏界面功能。注意几何体复用、渲染性能与窗口尺寸变化。不要依赖外部图片素材。',
    process: ['用现有单文件 HTML 作为归档源码，保留原作交互与视觉设定。', '把 Three.js 依赖整理为随站点发布的本地文件，不依赖演示时访问外部 CDN。', '从实际运行的画面提取封面；提示词按成品功能重新整理，并明确标注来源状态。'],
  },
  {
    slug: 'golden-gate', number: '02', title: '在雾里，等一座桥',
    english: 'GOLDEN GATE, SLOWLY', category: '交互世界',
    description: '流动的海雾、国际橘的桥塔，以及来来往往的车灯。把金门海峡放进浏览器。',
    tools: ['Three.js', '程序化场景', '实时渲染'], cover: 'golden-gate.jpg', color: '#e6ddd1',
    controls: '鼠标左键拖拽旋转，滚轮缩放，右键平移。左侧面板可调时段、海雾、风浪与车流，并切换巡航、随车与俯瞰镜头。',
    notes: '实时 3D 场景，在高车流量设置下对 GPU 有一定要求。移动端原作控制面板较宽，建议电脑体验。生成模型与原始提示词尚未核实。',
    prompt: '请制作一个单文件 Three.js 金门大桥实时场景，打开浏览器即可运行。\n\n以国际橘色的桥塔、悬索、吊索和桥面结构为视觉主体，加入两岸山体与有动态波浪的海面。桥的尺度关系应合理，避免只用几个长方体代替结构。\n\n加入缓慢滚动的海雾、双向车流与车灯。提供中文控制面板，可以调整时段、雾气浓度和流速、风浪强度、车流量与车速。提供自由视角、环绕巡航、随车行驶、塔顶俯瞰。\n\n支持鼠标旋转、平移和缩放。雾要有层次，但不能完全遮住大桥；白天与夜晚都应能辨认主体。注意实例化或几何合并，兼顾实时渲染性能。',
    process: ['收录现有金门大桥场景的副本，不覆盖原文件。', '保留时段、雾气、风浪、车流和镜头面板，演示单独打开以免首页持续占用 GPU。', '重建一份面向复现的任务说明；不把重建文本当作历史原始提示词。'],
  },
  {
    slug: 'rain-platform', number: '03', title: '雨停之前，说声保重',
    english: 'A GOODBYE IN THE RAIN', category: '叙事动画',
    description: '一把红伞，一班即将离开的列车。一段十秒钟的剪纸风雨夜告别。',
    tools: ['Canvas 2D', 'Web Audio', '10 秒循环'], cover: 'rain-platform.jpg', color: '#e1dfe8',
    controls: '点击画面开启声音，再次点击暂停或继续。动画十秒循环；请按需要调低设备音量。',
    notes: '画面和声音均由浏览器代码生成，无需外部素材。浏览器要求用户点击后才能播放声音。原始生成模型与对话尚未核实。',
    prompt: '用单文件 HTML 和 Canvas 2D 制作一段十秒循环的剪纸风动画短片，主题是「雨中站台」。\n\n雨夜的火车站台上，黄色纸箱小人把红伞递给蓝色小人，自己走进雨中登上火车，在车窗写下「保重」。列车慢慢开走，两个人含泪挥手。\n\n用层叠纸片、柔和投影和简洁造型表达情绪，画面以蓝灰色为主，红伞和黄色角色作为视觉焦点。让云、雨、人物与列车有清晰的前后层次，动作连贯。\n\n用 Web Audio 生成雨声、列车声和适度配乐，用户点击后开启声音，再次点击可暂停与继续。支持用 URL 参数 t 定格某一秒，便于检查画面。不要使用外部图片或音频文件。',
    process: ['保留现有 Canvas 和 Web Audio 源码，声音由用户点击后启用。', '利用原作的 t 参数定格实际画面，制作站台场景封面。', '整理叙事、视觉与交互要求，形成可复制的复现参考。'],
  },
];

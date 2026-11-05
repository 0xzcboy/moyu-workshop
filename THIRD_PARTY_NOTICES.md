# 第三方与作品授权说明

- Three.js 0.160.0：MIT License。构建时从 npm 包复制到 `public/vendor/three/`，许可证随依赖一起发布为 `vendor/three/LICENSE`。没有去掉其版权声明。
- Astro 及开发工具：各自保留 npm 包内的许可证。网站构建产物不包含整个开发依赖目录。
- 展厅页面未使用远程图库、远程字体、第三方统计或外链媒体。独立的登机牌演示保留原作 Google Fonts 字体请求，断网时使用后备字体。
- `public/logo.png`：按作者要求原样复用其小鱼品牌 Logo，未重绘或改色。品牌图标不包含在展厅 MIT 授权内。
- `projects/`：来自作者现有作品的原样副本，按作者要求公开展示源码，未指定再分发或商用许可证。该目录不属于展厅 MIT 授权范围；后续增加使用权需由作者另行明确授权。
- `public/covers/`：从相应作品实际运行画面或视频截取；星球封面仅在拍摄会话中拉远镜头，未改变归档源码。封面暂不单独授权。
- `public/videos/memory-pop-up-book.mp4`：由作者提供的《把回忆拼好给你》横屏 MV 压缩而成，原片未改动。歌曲、歌词及录音权利归各自权利人所有；本次未核实音乐公开传播授权，不声称取得相关版权。视频、歌曲及音轨不包含在展厅 MIT 授权内；二次发布或商用须另行获得相应许可。
- `src/data/works.ts` 中的提示词：六件浏览器作品为按成品整理的复现参考（SR-71 由作者提供的详细复现提示词精简而来，雨夜便利店由作者提供的复现提示词整理优化），并非恢复的原始对话；MV 为作者提供的原始提示词，仅整理断行与标点，标记为 `promptSource: 'original'`。全部提示词当前未指定独立授权。

可公开访问源码不等于已获得任何用途的授权。后续变更授权时，请同步修改详情页、关于页和本文件的说明，避免冲突。

- 可撕拉登机牌：React、React DOM、Motion、DialKit 及其运行时依赖保留各自许可证，构建时汇总实际安装包中的 LICENSE / NOTICE 为 `demos/tearable-boarding-pass/THIRD_PARTY_LICENSES.txt`。源码 ZIP 含原始依赖锁文件，不包含 node_modules。
- SR-71 黑鸟：原作 HTML 内联了 three.js r187（MIT License）与 Barlow Condensed 字体（SIL Open Font License 1.1），压缩产物中未保留其许可证文本。展厅原样归档该文件，未改动其内容；两者的许可证分别见 https://github.com/mrdoob/three.js/blob/dev/LICENSE 与 https://github.com/jpt/barlow/blob/main/OFL.txt。

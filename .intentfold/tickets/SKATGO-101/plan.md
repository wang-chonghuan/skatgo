# SKATGO-101 plan

1. 音效：从 Kenney Casino Audio 挑 8 个，去静音、统一响度、转 MP3（`make-sounds.sh`），放在 `app/public/sounds/`，附 Kenney 授权文件。
2. `lib/skat/sounds.ts`：用 Web Audio 加载和解码；第一次点击或按键时解锁；`playSound(kind)` 随机挑一个变体播放，受设置开关和限流控制，出错就不响。
3. `settings.ts`：`sounds` 默认 true，记在本浏览器；`frame.tsx` 设置对话框加开关；德英各加 2 条消息。
4. `game-table.tsx` `useCardSounds(game)`：比较前后状态，新的一副、多一张牌、多收一墩时各响一次。所有牌桌都用这个组件，所以都会响。
5. charter engineering.md 加一行。

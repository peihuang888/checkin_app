# 微信打卡助手 - 需求拆解文档

## 产品概述

- **产品类型**: 移动端工具应用（微信群场景）
- **场景类型**: <scene_type>prototype-app</scene_type>
- **目标用户**: 微信群成员、学习/健身/早起打卡群体
- **核心价值**: 帮助微信群成员快速完成每日打卡，自动生成接龙格式便于群内分享，支持个人累计统计和历史记录管理
- **界面语言**: 中文
- **主题偏好**: 浅色
- **导航模式**: 路径导航
- **导航布局**: Bottom Navigation（底部标签栏，适配移动端微信群场景）

---

## 页面结构总览

| 页面名称 | 文件名 | 路由 | 页面类型 | 入口来源 |
|---------|-------|------|---------|---------|
| 今日打卡 | `TodayPage.tsx` | `/` | 一级 | 导航-首页 |
| 排行榜 | `RankingPage.tsx` | `/ranking` | 一级 | 导航-排行榜 |
| 历史记录 | `HistoryPage.tsx` | `/history` | 一级 | 导航-历史 |
| 打卡详情 | `CheckInDetailPage.tsx` | `/detail/:id` | 二级 | 历史记录页 → 列表项点击 |

---

## 导航配置

- **导航布局**: Bottom Navigation（底部固定标签栏）
- **导航项**:

| 导航文字 | 路由 | 图标 |
|---------|------|-----|
| 今日打卡 | `/` | Home |
| 排行榜 | `/ranking` | Trophy |
| 历史记录 | `/history` | History |

---

## 功能列表

### 今日打卡页面
- **页面目标**: 完成每日打卡并生成群聊分享内容
- **功能点**:
  - **打卡按钮**: 大号打卡按钮，点击后记录打卡人（昵称可编辑，默认"微信用户"）、打卡时间（精确到秒）
  - **今日打卡列表**: 展示今日已打卡成员列表（昵称+时间），实时更新
  - **生成接龙文本**: 一键生成格式化接龙文本（格式示例："1. 张三 08:30\n2. 李四 09:15..."），支持一键复制
  - **分享引导**: 提示用户复制后粘贴到微信群聊
  - **今日统计卡片**: 展示今日打卡人数、最早打卡时间

### 排行榜页面
- **页面目标**: 查看所有成员的累计打卡统计
- **功能点**:
  - **成员排行榜**: 按累计打卡次数降序排列，展示排名、昵称、总次数、最近打卡时间
  - **个人数据卡片**: 顶部突出显示"我的"累计打卡数据
  - **连续打卡天数**: 显示每位成员的当前连续打卡天数
  - **打卡趋势图**: 展示近7天/30天的每日打卡人数趋势（折线图）

### 历史记录页面
- **页面目标**: 管理和查看所有历史打卡记录
- **功能点**:
  - **日期筛选器**: 按日期筛选查看某天的打卡记录
  - **打卡记录列表**: 按日期倒序展示所有打卡记录（日期分组），单条显示昵称、时间
  - **删除记录**: 支持删除单条打卡记录（二次确认）
  - **数据导出**: 支持导出某月打卡数据为文本格式

### 打卡详情页面
- **页面目标**: 查看单条打卡记录的详细信息
- **功能点**:
  - **记录详情展示**: 完整展示打卡人、打卡时间、打卡日期
  - **编辑备注**: 支持为该条记录添加/编辑备注信息
  - **删除操作**: 支持删除该条记录

---

## 数据共享配置

| 存储键名 | 数据说明 | 使用页面 |
|---------|---------|---------|
| `__global_checkin_records` | 所有打卡记录列表，类型为 `ICheckInRecord[]` | 今日打卡页、排行榜页、历史记录页 |
| `__global_user_nickname` | 当前用户昵称（默认"微信用户"），类型为 `string` | 今日打卡页 |
| `__global_checkin_stats` | 统计数据缓存，类型为 `ICheckInStats` | 排行榜页 |

```ts
interface ICheckInRecord {
  /** 记录唯一ID */
  id: string;
  /** 打卡人昵称 */
  nickname: string;
  /** 打卡时间戳 */
  timestamp: number;
  /** 打卡日期（YYYY-MM-DD格式，便于按天分组） */
  date: string;
  /** 备注信息 */
  remark?: string;
}

interface ICheckInStats {
  /** 按昵称统计的总打卡次数 */
  totalByUser: Record<string, number>;
  /** 按昵称统计的当前连续打卡天数 */
  streakByUser: Record<string, number>;
  /** 每日打卡人数统计（用于趋势图） */
  dailyCount: Record<string, number>;
}
```

---

## 特殊说明

### 接龙文本生成格式
```
📅 2024年1月15日 打卡接龙

1. 张三 08:30:25
2. 李四 09:15:08
3. 王五 12:45:33

—— 共3人完成今日打卡 ——
```

### 数据存储说明
- 使用 LocalStorage 存储所有打卡数据
- 首次使用时引导用户设置昵称
- 数据持久化在本地浏览器，刷新不丢失

### 微信群使用流程
1. 用户在应用内完成打卡
2. 点击"生成接龙" → "一键复制"
3. 切换到微信群聊粘贴发送
4. 群内成员可点击应用链接进入打卡

-------

# UI 设计指南

> **场景类型**: <scene_type>prototype-app</scene_type>（应用架构设计）
> **确认检查**: 本指南适用于微信群场景打卡应用，包含今日打卡、排行榜、历史记录等多页面功能。

> ℹ️ Section 1-2 为设计意图与决策上下文。Code agent 实现时以 Section 3 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解
- **目标用户**: 微信群成员（学习型、健身型、早起打卡群体），多为年轻上班族或学生，有自律/社交需求
- **核心目的**: 降低打卡操作门槛，提供社交分享动力，形成正向反馈循环
- **期望情绪**: 积极正向、轻松愉悦、有成就感（打卡是一种"小胜利"）
- **需避免的感受**: 复杂繁琐、数据焦虑、社交压力过重

### 1.2 设计语言
- **Aesthetic Direction**: 温暖亲和的社交工具美学，强调"完成"的愉悦感，而非严肃的数据管理
- **Visual Signature**: 圆润柔和的胶囊形状、温暖的渐变强调色、大卡片的呼吸感、底部固定导航的移动端优先设计
- **Emotional Tone**: 轻盈活力 + 温暖鼓励（像朋友的提醒，而非上司的考核）
- **Design Style**: Rounded 圆润几何（主）+ Soft Blocks 柔色块（辅）—— 圆润的按钮和卡片降低工具感，柔和色块营造社交温度
- **Application Type**: Tool（工具类），但带有强烈的社交属性


## 2. Design Principles (设计理念)

1. **一键可达的极简路径**：打卡是高频操作，必须在首屏一眼可见，两秒内完成
2. **正向反馈的即时性**：每次打卡都有视觉庆祝（微动效/颜色变化），强化"完成"的满足感
3. **社交优先的数据呈现**：排行榜的设计要鼓励而非制造焦虑，强调"一起打卡"的集体感
4. **移动端手指友好**：所有可交互元素 ≥ 44px，底部导航固定，避免顶部操作
5. **数据的可信与透明**：历史记录可编辑可删除，给用户掌控感


## 3. Color System (色彩系统)

**配色设计理由**: 打卡应用需要激发行动力和正向情绪。选择珊瑚橙（活力、温暖）作为主色，象征早晨的阳光和完成任务的成就感；搭配薄荷绿作为成功状态的语义色，形成"行动-完成"的色彩叙事。

### 3.1 主题颜色

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|-----|---------|----------------|--------|---------|
| bg | `--background` | `bg-background` | hsl(30 30% 98%) | 暖调米白，比纯白更柔和，减少视觉疲劳 |
| surface | `--card` | `bg-card` | hsl(0 0% 100%) | 纯白卡片，浮于背景之上 |
| text | `--foreground` | `text-foreground` | hsl(30 15% 15%) | 深暖灰，避免纯黑的生硬感 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(30 10% 50%) | 中等暖灰，用于次要信息 |
| primary | `--primary` | `bg-primary` | hsl(15 85% 55%) | 珊瑚橙，活力主色，用于主按钮、关键数据 |
| primary-foreground | `--primary-foreground` | `text-primary-foreground` | hsl(0 0% 100%) | 白色，确保在primary背景上的可读性 |
| accent | `--accent` | `bg-accent` | hsl(30 60% 96%) | 极浅的暖米色，用于hover/focus状态背景 |
| accent-foreground | `--accent-foreground` | `text-accent-foreground` | hsl(15 60% 40%) | 深珊瑚色，用于accent区域上的文字 |
| border | `--border` | `border-border` | hsl(30 20% 90%) | 暖调浅灰边框，柔和分隔 |
| success | `--success` | `text-success` | hsl(142 70% 45%) | 薄荷绿，用于打卡成功、连续天数等正向状态 |
| warning | `--warning` | `text-warning` | hsl(38 90% 50%) | 琥珀黄，用于提示、警告 |

> **Color Token 语义速查（供 code agent 参考）**:
> - `primary` → 主行动：打卡按钮、生成接龙按钮、排名高亮
> - `accent` → 状态反馈：列表项hover、Tab选中背景、按钮hover
> - `muted` → 静态非交互：时间戳、辅助说明、占位文字

### 3.2 语义颜色（状态反馈）

| 用途 | 背景色 | 文字色 | 设计说明 |
|-----|--------|--------|---------|
| 打卡成功 | `bg-success/10` | `text-success` | 浅绿背景+绿色文字，暗示"完成" |
| 连续打卡 | `bg-primary/10` | `text-primary` | 浅橙背景+主色文字，强调成就 |
| 普通标签 | `bg-accent` | `text-accent-foreground` | 浅米色背景，中性展示 |
| 删除/危险 | `bg-red-500/10` | `text-red-600` | 浅红背景+红色文字（危险操作） |

## 4. Typography (字体排版)

- **Heading**: 系统默认无衬线 + PingFang SC（苹方）回退 —— 移动端原生体验优先
- **Body**: 系统默认无衬线 + PingFang SC 回退 —— 确保微信环境内的一致性
- **数字专用**: SF Mono / PingFang SC —— 时间、次数等数字需要等宽对齐
- **字体导入**: 无需引入 Google Fonts，使用系统字体栈

```css
/* 字体栈定义 */
--font-sans: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
--font-mono: "SF Mono", "Menlo", "PingFang SC", monospace;
```

## 5. Global Layout Structure (全局布局结构)

### 5.1 Page Content Zones (页面区块配置)

**Standard Content Zone（全页面统一）**:
- **Maximum Width**: `max-w-md`（448px）—— 打卡应用以移动端为主，限制宽度模拟手机视口，大屏居中显示
- **Padding**: `px-4`（16px）—— 移动端舒适的边缘留白
- **Alignment**: `mx-auto` —— 大屏居中
- **Vertical Spacing**: `gap-4` / `space-y-4` —— 卡片间距 16px，紧凑但清晰

**Hero/Banner 区块**（今日打卡页顶部）:
- **Width**: `w-full`
- **Padding**: `px-4 py-6`
- **Background**: 渐变背景 `bg-gradient-to-br from-primary/5 to-primary/10`

### 5.2 导航结构

**底部标签栏 (Bottom Navigation)**:
- **Position**: `fixed bottom-0 left-0 right-0`
- **Height**: `h-16`（64px）
- **Background**: `bg-background/95 backdrop-blur-md` —— 半透明毛玻璃效果
- **Border**: `border-t border-border`
- **Safe Area**: `pb-safe`（适配 iPhone 底部安全区）

**内容区底部留白**:
- 为避免内容被底部导航遮挡，所有页面主内容区需添加底部内边距 `pb-20`（80px）

### 5.3 页面骨架示例

```html
<body class="min-h-screen bg-background">
  <!-- 页面主内容 -->
  <main class="max-w-md mx-auto px-4 pb-20">
    <!-- 页面内容 -->
  </main>
  
  <!-- 底部固定导航 -->
  <nav class="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border">
    <div class="max-w-md mx-auto h-full flex items-center justify-around">
      <!-- 导航项 -->
    </div>
  </nav>
</body>
```

## 6. Visual Effects & Motion (视觉效果与动效)

- **Header/Hero 视觉方案**: 今日打卡页顶部使用 `bg-gradient-to-br from-primary/5 to-primary/10` 的柔和渐变，营造温暖晨曦感
- **装饰手法**: 无复杂装饰，保持工具类的简洁性；可在打卡成功时使用「confetti」风格的小彩点动画（非必须）
- **圆角**: 
  - 卡片：`rounded-2xl`（16px）
  - 按钮：`rounded-full`（胶囊形状，完全圆角）
  - 输入框：`rounded-xl`（12px）
  - 底部导航栏：`rounded-t-2xl`（顶部圆角，柔和过渡）
- **阴影**: 
  - 卡片：`shadow-sm`（极轻微，模拟浮起感）
  - 底部导航：`shadow-[0_-2px_10px_rgba(0,0,0,0.05)]`（向上阴影，暗示层级）

### 6.1 动效意图

> 本节只声明动效意图（what / why），不提供实现细节（how）

- **整体动效风格**: 克制、短促、以 opacity + scale 微变化为主，符合移动端工具的预期
- **页面入场**: 无需复杂入场，直接渲染即可（工具类应用追求即时响应）
- **列表项动效 · 变更模式**: 增量增删（新打卡项从顶部滑入）、排序（排行榜数字变化时的位置移动）
- **列表项动效 · 意图**: 快速（150-200ms）、弹性缓出（ease-out）、stagger 错峰 50ms（多条数据同时出现时）
- **关键交互微动效**: 
  - 打卡按钮按下时 scale(0.97) 微缩 + 背景色变深，释放后弹回并触发成功状态
  - 接龙文本复制成功后，Toast 从底部滑入，2秒后淡出
  - 删除记录时的确认弹层，背景遮罩淡入，内容区从底部滑上（移动端标准 Sheet 行为）

## 7. Components (组件指南)

### Buttons

| 类型 | 默认态 | Hover态 | Active态 | 说明 |
|-----|--------|---------|----------|------|
| **Primary** | `bg-primary text-white rounded-full h-14 px-8` | `bg-primary/90` | `scale-[0.97]` | 主按钮，胶囊形状，用于"立即打卡" |
| **Secondary** | `bg-card border border-border text-foreground rounded-xl h-12 px-6` | `bg-accent` | `scale-[0.98]` | 次要按钮，用于"生成接龙" |
| **Ghost** | `bg-transparent text-foreground rounded-lg h-10 px-4` | `bg-accent` | - | 幽灵按钮，用于"编辑昵称"等轻量操作 |
| **Danger** | `bg-red-500/10 text-red-600 rounded-xl h-12 px-6` | `bg-red-500/20` | - | 危险操作，用于删除 |

### Cards

- **今日统计卡片**: `bg-card rounded-2xl p-5 shadow-sm border border-border`
- **排行榜项**: `bg-card rounded-xl p-4 flex items-center gap-3`，前三名左侧有 `w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold` 排名标识
- **打卡记录项**: `bg-accent/50 rounded-lg p-3 flex justify-between items-center`，hover态 `bg-accent`

### Form Elements

- **输入框**: `bg-card border border-border rounded-xl h-12 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary`
- **昵称编辑框**: 同上，但宽度较窄 `w-32`

### 特殊组件

**打卡按钮（巨型）**:
- 尺寸: `w-full h-20 rounded-2xl`
- 默认态: `bg-primary text-white text-xl font-semibold shadow-lg shadow-primary/25`
- 完成态: `bg-success text-white`（已打卡时变为绿色，显示"今日已打卡"）
- 图标: 左侧 `CheckCircle2` 图标

**接龙文本展示区**:
- 容器: `bg-muted/30 rounded-xl p-4 font-mono text-sm text-foreground border border-border`
- 复制按钮: 悬浮在右上角 `absolute top-2 right-2`

**排行榜排名标识**:
- 第1名: `bg-yellow-400 text-yellow-900`（金色）
- 第2名: `bg-slate-300 text-slate-700`（银色）
- 第3名: `bg-amber-600 text-amber-100`（铜色）
- 4名+: `bg-accent text-accent-foreground`

## 8. Flexibility Note (灵活性说明)

> **一致性优先原则**：所有页面必须使用相同的核心参数（最大宽度、圆角、阴影等），确保整体设计语言统一。
>
> **允许的微调范围**（code agent 可自行判断）：
> - 页面内部的局部间距（如列表项间距 vs 区块间距）
> - 响应式适配：大屏可适度放宽 `max-w-md` 到 `max-w-lg`，但保持移动端优先
> - 空状态/加载状态的插图尺寸
>
> **禁止的随意变更**：
> - ❌ 不同页面使用不同的圆角风格（如一个页面用 `rounded-xl`，另一个用 `rounded-lg`）
> - ❌ 不同页面使用不同的主色调或强调色
> - ❌ 底部导航在不同页面的高度或样式不一致

## 9. Signature & Constraints (设计签名与禁区)

### DO (视觉签名)

1. **圆润的胶囊按钮**: 所有主操作按钮使用 `rounded-full`，给人友好、易点击的感觉
2. **柔和的暖色渐变**: 顶部区域使用 `from-primary/5 to-primary/10` 的极浅渐变，营造温暖氛围
3. **大卡片呼吸感**: 卡片内边距 `p-5`，与边框保持充足留白，避免信息拥挤
4. **清晰的完成状态**: 打卡成功后按钮变为绿色（success），给用户明确的正向反馈
5. **底部固定导航**: 始终固定在视口底部，图标 + 文字的组合，当前页图标使用 `primary` 色

### DON'T (禁止做法)

- ❌ 使用深色主题（不符合微信群轻松社交的场景）
- ❌ 使用尖锐的直角（与"Rounded 圆润几何"风格冲突）
- ❌ 排行榜过度强调排名差距（避免制造焦虑，不显示具体分数差距）
- ❌ 历史记录页面使用复杂表格（移动端优先，使用卡片列表）
- ❌ 添加不必要的装饰元素（如漂浮的几何形状），保持工具简洁性
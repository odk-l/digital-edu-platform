# 路由懒加载性能测试指南

## 🎯 测试目标

对比**同步导入**和**懒加载**的性能差异

## 📋 测试步骤

### 第一步：测试同步导入（当前版本）

#### 1. 构建项目
```bash
npm run build
```

#### 2. 查看构建结果

在终端输出中查找：
```
File                      Size         Gzipped
dist/js/app.[hash].js     XXX KiB      XXX KiB
dist/js/chunk-vendors.js  XXX KiB      XXX KiB
```

**记录数据**：
- `app.js` 大小：_______ KB
- `chunk-vendors.js` 大小：_______ KB
- 总大小：_______ KB
- chunk 文件数量：_______ 个

#### 3. 运行项目并测试

```bash
npm run serve
```

打开 Chrome DevTools：
1. 按 `F12`
2. 切换到 **Network** 标签
3. 勾选 **Disable cache**
4. 按 `Ctrl+Shift+R` 强制刷新

**记录数据**：
- Transferred（传输大小）：_______ KB
- DOMContentLoaded（蓝线）：_______ ms
- Load（红线）：_______ ms
- JS 文件数量：_______ 个

#### 4. 运行 Lighthouse

1. 切换到 **Lighthouse** 标签
2. 选择 **Performance**
3. 点击 **Analyze page load**

**记录数据**：
- Performance Score：_______ 分
- FCP：_______ s
- LCP：_______ s
- TTI：_______ s

---

### 第二步：恢复懒加载

修改 `src/router/index.ts`：

```typescript
// 改回懒加载
const routes = [
  {
    path: '/',
    component: () => import('@/views/IndexView.vue'),  // 懒加载
    children: [
      {
        path: '',
        component: () => import('@/views/ClassView.vue'),  // 懒加载
      },
      // ... 其他路由也改成懒加载
    ]
  }
]
```

#### 重复上面的测试步骤

**记录数据**：
- `app.js` 大小：_______ KB
- chunk 文件数量：_______ 个
- Transferred：_______ KB
- DOMContentLoaded：_______ ms
- Performance Score：_______ 分

---

### 第三步：计算提升百分比

```
性能提升 = (优化前 - 优化后) / 优化前 × 100%

例如：
app.js 大小：(800KB - 300KB) / 800KB = 62.5% 提升
加载时间：(2000ms - 1200ms) / 2000ms = 40% 提升
```

---

## 📊 预期结果

### 同步导入（未优化）

```
构建结果：
✅ app.js: ~800KB
✅ chunk-vendors.js: ~400KB
✅ 总大小: ~1200KB
✅ chunk 数量: 2个

运行时性能：
✅ Transferred: ~1200KB
✅ DOMContentLoaded: ~2000ms
✅ Load: ~2500ms
✅ Performance Score: 70-75

说明：所有页面都打包在 app.js 中
```

### 懒加载（已优化）

```
构建结果：
✅ app.js: ~300KB ⬇️ 62%
✅ chunk-vendors.js: ~400KB
✅ chunk-[hash].js: ~50KB × 9个 (各个页面)
✅ 总大小: ~1200KB (相同)
✅ chunk 数量: 11个 ⬆️

运行时性能：
✅ Transferred: ~700KB ⬇️ 42% (首屏只加载必要的)
✅ DOMContentLoaded: ~1200ms ⬇️ 40%
✅ Load: ~1500ms ⬇️ 40%
✅ Performance Score: 85-90 ⬆️ 20%

说明：首屏只加载 IndexView 和 ClassView，其他按需加载
```

---

## 🎨 可视化对比

### Network 瀑布图对比

**同步导入**：
```
app.js ████████████████████████████ (800KB, 2s)
chunk-vendors.js ████████████ (400KB, 1s)
```

**懒加载**：
```
app.js ████████ (300KB, 0.8s)
chunk-vendors.js ████████████ (400KB, 1s)
chunk-board.js ██ (50KB, 按需加载)
chunk-proposal.js ██ (50KB, 按需加载)
```

---

## 📝 性能测试报告模板

```markdown
# 路由懒加载性能测试报告

## 测试环境
- 浏览器：Chrome 120
- 网络：Fast 3G
- 设备：Desktop

## 测试结果

| 指标 | 同步导入 | 懒加载 | 提升 |
|------|---------|--------|------|
| app.js 大小 | 800KB | 300KB | ⬇️ 62% |
| 首屏传输 | 1200KB | 700KB | ⬇️ 42% |
| DOMContentLoaded | 2000ms | 1200ms | ⬇️ 40% |
| FCP | 1500ms | 800ms | ⬇️ 47% |
| Performance Score | 72 | 89 | ⬆️ 24% |

## 结论

通过路由懒加载优化：
- ✅ 首屏 JS 大小减少 62%
- ✅ 首屏加载时间减少 40%
- ✅ 用户体验显著提升
```

---

## 🎯 现在你可以做什么

### 1. 测试当前版本（同步导入）

```bash
# 1. 构建
npm run build

# 2. 查看 dist/js 目录
# 记录 app.js 的大小

# 3. 运行并测试
npm run serve
# 打开 Chrome DevTools 记录性能数据
```

### 2. 恢复懒加载

```bash
# 我帮你准备一个懒加载版本的路由文件
```

### 3. 对比结果

```bash
# 再次构建和测试
# 对比两次的数据
```

需要我帮你创建一个懒加载版本的路由文件，方便你切换对比吗？
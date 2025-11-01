# 为什么不需要单独设置 gameId

## 🎯 核心概念

**gameId 不需要单独设置，它会随着 gameStatus 自动更新！**

## 📊 数据流

### 正确的流程 ✅

```
1. 从路由获取 id
   ↓
2. 调用 API: game.GameStatus(id)
   ↓
3. API 返回完整的 gameStatus（包含 id）
   ↓
4. 更新到 Store: updateGameStatus(gameStatus)
   ↓
5. gameId 自动从 gameStatus.id 获取
```

### 代码示例

```typescript
// 1. 从路由获取 id
const id = Number(route.query.id)  // 假设是 123

// 2. 调用 API
const refreshGameStatus = (id: number) => {
  useApi({
    api: game.GameStatus(id),  // 调用 /game/status/123
    onSuccess: (resp) => {
      // 3. API 返回的数据
      // resp.data = {
      //   id: 123,           ← 包含 id！
      //   stage: 1,
      //   chessPhase: 0,
      //   chessRound: 1,
      //   ...
      // }
      
      // 4. 更新到 Store
      store.dispatch("gameModule/updateGameStatus", resp.data)
      
      // 5. gameId 自动更新
      // store.getters["gameModule/gameId"] === 123 ✅
    }
  })
}
```

## ❌ 错误的做法

### 方式1：单独设置 gameId（不需要）

```typescript
// ❌ 错误：单独设置 gameId
onMounted(() => {
  const id = Number(route.query.id)
  store.dispatch('gameModule/setGameId', id)  // ❌ 不需要！
  refreshGameStatus()
})
```

**问题**：
1. 多余的操作
2. 需要维护两个 mutation
3. 可能导致数据不一致

### 方式2：修改 gameStatus.id（不可能）

```typescript
// ❌ 错误：直接修改
store.state.gameModule.gameStatus.id = 123  // ❌ 不能直接修改 state

// ❌ 错误：通过 mutation 修改
commit('UPDATE_GAMEID', 123)  // ❌ 语法错误，不能给可选属性赋值
```

**问题**：
1. 违反 Vuex 规则
2. 语法错误
3. 数据不完整

## ✅ 正确的做法

### 场景1：首次加载

```typescript
onMounted(() => {
  // 1. 从路由获取 id
  const id = Number(route.query.id)
  
  // 2. 直接用这个 id 调用 API
  refreshGameStatus(id)
  
  // 3. API 返回的数据会包含 id，自动更新到 Store
})

const refreshGameStatus = (id?: number) => {
  const targetId = id ?? gameId.value  // 支持传入 id
  
  useApi({
    api: game.GameStatus(targetId),
    onSuccess: (resp) => {
      // resp.data 包含完整的游戏状态（包括 id）
      store.dispatch("gameModule/updateGameStatus", resp.data)
    }
  })
}
```

### 场景2：后续刷新

```typescript
// 子组件触发刷新
const handleUpdate = () => {
  // 不需要传 id，自动使用 Store 中的 gameId
  refreshGameStatus()
}

const refreshGameStatus = (id?: number) => {
  const targetId = id ?? gameId.value  // 使用 Store 中的 gameId
  
  useApi({
    api: game.GameStatus(targetId),
    onSuccess: (resp) => {
      store.dispatch("gameModule/updateGameStatus", resp.data)
    }
  })
}
```

### 场景3：切换游戏

```typescript
// 如果需要切换到另一个游戏
const switchGame = (newGameId: number) => {
  // 直接用新的 id 调用 API
  refreshGameStatus(newGameId)
  
  // API 返回的数据会包含新的 id，自动更新
}
```

## 🔍 为什么这样设计？

### 1. 单一数据源

```typescript
// ✅ 好的设计
interface State {
  gameStatus: GameStatus | null  // 只存储一份数据
}

getters: {
  gameId: (state) => state.gameStatus?.id ?? 0  // 自动获取
}
```

**优势**：
- 数据一致性
- 不会出现 id 和其他数据不匹配
- 代码更简洁

### 2. 自动同步

```typescript
// 更新 gameStatus 时，gameId 自动更新
store.dispatch("updateGameStatus", {
  id: 123,
  stage: 1,
  // ...
})

// gameId 自动变成 123
console.log(store.getters["gameModule/gameId"])  // 123
```

### 3. 不会不一致

```typescript
// ❌ 如果单独设置 gameId，可能出现不一致
state.gameId = 123
state.gameStatus = {
  id: 456,  // ← 不一致！
  // ...
}

// ✅ 只存储 gameStatus，永远不会不一致
state.gameStatus = {
  id: 123,
  // ...
}
// gameId 自动从 gameStatus.id 获取，永远一致
```

## 📋 完整示例

### BoardView.vue

```typescript
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useApi } from '@/api/handler'
import { game } from '@/api'

const store = useStore()
const route = useRoute()

// 从 Store 获取
const GameStatus = computed(() => store.getters["gameModule/gameStatus"])
const gameId = computed(() => store.getters["gameModule/gameId"])

// 首次加载
onMounted(() => {
  const id = Number(route.query.id)
  refreshGameStatus(id)  // 传入路由的 id
})

// 刷新方法
const refreshGameStatus = (id?: number) => {
  const targetId = id ?? gameId.value
  
  useApi({
    api: game.GameStatus(targetId),
    onSuccess: (resp) => {
      // resp.data 包含完整的游戏状态（包括 id）
      store.dispatch("gameModule/updateGameStatus", resp.data)
      // gameId 自动更新为 resp.data.id
    }
  })
}
```

### Store

```typescript
state: () => ({
  gameStatus: null  // 只存储这一个
})

mutations: {
  UPDATE_GAME_STATUS(state, status) {
    state.gameStatus = status  // 包含 id
  }
}

getters: {
  gameId: (state) => state.gameStatus?.id ?? 0  // 自动获取
}
```

## 🎯 总结

### 核心原则

1. ✅ **不需要单独设置 gameId**
2. ✅ **API 返回的数据包含 id**
3. ✅ **更新 gameStatus 时 id 自动更新**

### 使用方式

```typescript
// 首次加载：传入 id
refreshGameStatus(123)

// 后续刷新：不传 id，自动使用 Store 中的
refreshGameStatus()

// 切换游戏：传入新的 id
refreshGameStatus(456)
```

### 优势

1. ✅ 代码简洁
2. ✅ 数据一致
3. ✅ 自动同步
4. ✅ 不会出错

**记住**：gameId 不是你设置的，而是从 API 返回的数据中自动获取的！

<template>
  <div class="board-view-container d-flex">
    <div class="left" style="display: flex; flex-direction: column">
      <v-expansion-panels>
        <v-expansion-panel class="mt-2">
          <v-expansion-panel-title class="pa-3">
            <v-icon icon="mdi-cog" class="mx-4"></v-icon>
            <span class="text-h6">棋盘设置</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text class="pa-2">
            <div class="d-flex">
              <div class="mx-2">调整X轴方位</div>
              <v-slider
                v-model="originX"
                :max="240"
                :min="0"
                :step="10"
                thumb-label
              />
            </div>
            <div class="d-flex">
              <div class="mx-2">调整Y轴方位</div>
              <v-slider
                v-model="originY"
                :max="240"
                :min="0"
                :step="10"
                thumb-label
              />
            </div>
            <div class="d-flex">
              <div class="mx-2">调整棋盘大小</div>
              <v-slider
                v-model="radius"
                :max="34"
                :min="10"
                :step="1"
                thumb-label
              />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <SpecialCard @update="useGameStatus" />
      <TileRank :enable-edit="true" :max-height="400" show-change />
    </div>
    <div style="flex: 2; min-width: 800px">
      <BoardBox
        v-if="GameStatus"
        :data="GameStatus"
        :origin-x="originX"
        :origin-y="originY"
        :radius="radius"
        @update="useGameStatus"
      />
    </div>
    <div class="right">
      <LegendBox />
      <BoardStatus v-if="GameStatus" @update="useGameStatus" />
      <GradeRank v-if="GameStatus" :game-id="gameId" @update="useGameStatus" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from "@/api/handler";
import { game } from "@/api";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BoardBox from "@/components/board/BoardBox.vue";
import BoardStatus from "@/components/board/BoardStatus.vue";
import GradeRank from "@/components/board/GradeRank.vue";
import TileRank from "@/components/board/TileRank.vue";
import LegendBox from "@/components/board/LegendBox.vue";
import SpecialCard from "@/components/board/SpecialCard.vue";
import { useStore } from "vuex";

const store = useStore();
const route = useRoute();
const router = useRouter();

const originX = ref(70);
const originY = ref(40);
const radius = ref(24);

const GameStatus = computed(() => store.getters["gameModule/gameStatus"]);
const gameId = computed(() => store.getters["gameModule/gameId"]);
const gameState = computed(() => store.getters["gameModule/gameState"]);

// ============ 生命周期 ============
onMounted(() => {
  // 从路由获取游戏 ID
  const id = Number(route.query.id);
  // 首次加载，直接用路由的 id 调用 API
  refreshGameStatus(id);
});

// ============ 状态监听 ============
// 监听是否进入提案赛阶段
watch(
  () => gameState.value?.isProposalPhase?.value,
  (isProposalPhase) => {
    if (isProposalPhase && GameStatus.value) {
      router.push({ path: "/proposal", query: { id: GameStatus.value.id } });
    }
  }
);

// ============ 方法 ============
/**
 * 刷新游戏状态
 * @param id - 可选的游戏 ID，如果不传则使用 Store 中的 gameId
 */
const refreshGameStatus = (id?: number) => {
  // 优先使用传入的 id，否则使用 Store 中的 gameId
  const targetId = id ?? gameId.value;

  useApi({
    api: game.GameStatus(targetId),
    onSuccess: (resp) => {
      // 更新到 Store，resp.data 包含完整的游戏状态（包括 id）
      store.dispatch("gameModule/updateGameStatus", resp.data);
    },
  });
};

// 兼容旧的方法名
const useGameStatus = refreshGameStatus;
</script>

<style lang="scss" scoped>
.board-view-container {
  background-color: #f4f4f4;
  min-width: 100vw;
  min-height: 100vh;

  .left {
    flex: 1;
    min-width: 300px;
  }

  .right {
    flex: 1;
    min-width: 400px;
  }
}
</style>

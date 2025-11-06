<template>
  <div class="classes-container mx-4 mr-8">
    <v-row dense>
      <v-col
        v-for="(value, index) in data"
        :key="index"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        class="px-2"
      >
        <v-card
          class="py-2"
          hover
          prepend-icon="mdi-equalizer-outline"
          :title="`${value.lastSavedAt} 保存`"
          :color="color ?? 'indigo-lighten-2'"
          @click="handleGameClick(value.id)"
        >
          <v-card-item>
            <v-card-subtitle>
              进行情况：{{ value.status === 1 ? "进行中" : "已结束" }}
            </v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <div>小组总数：{{ value.teamCount }}</div>
            <div>学生总数：{{ value.studentCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import { useRouter } from "vue-router";
import { ApiMap } from "@/api/type";
import { useApi } from "@/api/handler";
import { game } from "@/api";

const routers = useRouter();

defineProps<{
  data: ApiMap["/game/list/:cid"]["resp"];
  color?: string;
}>();

// 智能跳转：根据游戏状态决定跳转到哪个页面
const handleGameClick = (gameId: number) => {
  // 先获取游戏状态
  useApi({
    api: game.GameStatus(gameId),
    onSuccess: (resp) => {
      const gameStatus = resp.data as ApiMap["/game/status/:id"]["resp"];

      // 根据游戏阶段决定跳转
      if (gameStatus.stage === 1) {
        // 棋盘赛阶段 → 跳转到 BoardView
        routers.push({ path: "/board", query: { id: gameId } });
      } else {
        // 提案赛阶段 → 跳转到 ProposalView
        routers.push({ path: "/proposal", query: { id: gameId } });
      }
    },
    onError: () => {
      // 获取状态失败，默认跳转到棋盘赛
      routers.push({ path: "/board", query: { id: gameId } });
    },
  });
};
</script>

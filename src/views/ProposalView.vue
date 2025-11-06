<template>
  <div class="proposal-view-container d-flex flex-column">
    <PropHeader @show-overlay="showOverlay = true" />
    <div class="proposal-main ma-4 d-flex">
      <PropSidebar :data="GameStatus" />
      <div class="d-flex ml-4 flex-column w-100">
        <v-card style="flex: 1" v-if="GameStatus">
          <StepBar
            class="my-6 d-flex justify-center"
            :model-value="stage"
            :items="items"
          ></StepBar>
          <v-divider></v-divider>
          <!-- 初始化阶段 -->
          <InitProp
            v-if="gameState.isProposalInit?.value"
            :data="GameStatus"
            @update="useGameStatus"
          />

          <!-- 轮次选择阶段 -->
          <TeamOrder
            v-if="gameState.isProposalOrder?.value"
            :data="GameStatus"
            @update="useGameStatus"
          />

          <!-- 第一轮提案 -->
          <PropVoteOne
            v-if="
              gameState.isRound1Submit?.value || gameState.isRound1Vote?.value
            "
            :data="GameStatus"
            @update="useGameStatus"
          />

          <!-- 第二轮提案 -->
          <PropVoteTwo
            v-if="
              gameState.isRound2Submit?.value ||
              gameState.isRound2Debate?.value ||
              gameState.isRound2Score?.value
            "
            :data="GameStatus"
            @update="useGameStatus"
          />

          <!-- 第三轮提案 -->
          <PropVoteThree
            v-if="
              gameState.isRound3Submit?.value || gameState.isRound3Vote?.value
            "
            :data="GameStatus"
            @update="useGameStatus"
          />

          <!-- 淘汰赛 -->
          <KnockOut
            v-if="
              gameState.isKnockout?.value && gameState.currentRound?.value === 1
            "
            :data="GameStatus"
            @update="useGameStatus"
          />

          <!-- 抢答比赛 -->
          <BuzzQuiz
            v-if="
              gameState.isKnockout?.value && gameState.currentRound?.value === 3
            "
            :data="GameStatus"
            @update="useGameStatus"
          />

          <!-- 游戏结束 -->
          <SummaryBox v-if="gameState.isFinished?.value" :data="GameStatus" />
        </v-card>
      </div>
    </div>
  </div>
  <v-overlay v-model="showOverlay" class="align-center justify-center">
    <div class="d-flex mb-4">
      <v-btn
        :color="currentMode === 'team' ? 'primary' : 'grey'"
        @click="currentMode = 'team'"
        >团队排行榜</v-btn
      >
      <v-btn
        :color="currentMode === 'student' ? 'primary' : 'grey'"
        @click="currentMode = 'student'"
        >个人排行榜</v-btn
      >
    </div>

    <RankList
      v-if="currentMode === 'team'"
      key="team"
      :enable-edit="true"
      max-height="630"
      class="mr-6"
      style="width: 500px"
      :data="GameStatus"
    ></RankList>
    <TileRank
      v-else-if="currentMode === 'student'"
      key="student"
      :enable-edit="true"
      max-height="630"
      class="mr-6"
      style="width: 500px"
      :data="GameStatus"
      mode="student"
    />
  </v-overlay>
</template>

<script setup lang="ts">
import PropHeader from "@/components/proposal/PropHeader.vue";
import PropSidebar from "@/components/proposal/PropSidebar.vue";
import { onMounted, ref, computed } from "vue";
import { useApi } from "@/api/handler";
import { game } from "@/api";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import StepBar from "@/components/StepBar.vue";
import InitProp from "@/components/proposal/init/InitProp.vue";
import TeamOrder from "@/components/proposal/TeamOrder.vue";
import PropVoteOne from "@/components/proposal/vote/PropVoteOne.vue";
import KnockOut from "@/components/proposal/KnockOut.vue";
import PropVoteTwo from "@/components/proposal/vote/PropVoteTwo.vue";
import PropVoteThree from "@/components/proposal/vote/PropVoteThree.vue";
import BuzzQuiz from "@/components/proposal/BuzzQuiz.vue";
import SummaryBox from "@/components/SummaryBox.vue";
import RankList from "@/components/proposal/RankList.vue";
import TileRank from "@/components/board/TileRank.vue";

const store = useStore();
const GameStatus = computed(() => store.getters["gameModule/gameStatus"]);
const gameState = computed(() => store.getters["gameModule/gameState"]);
const gameId = computed(() => store.getters["gameModule/gameId"]);
const route = useRoute();
const items = ref([
  "初始化积分",
  "轮次选择",
  "第一轮提案",
  "第二轮提案",
  "第三轮提案",
  "总结",
]);
const stage = ref<number>(0);
const showOverlay = ref<boolean>(false);
const currentMode = ref<"team" | "student">("team");

onMounted(() => {
  const id = Number(route.query.id);
  useGameStatus(id);
});

function handleStage() {
  if (!GameStatus.value) return;
  if (gameState.value.isFinished?.value) stage.value = 5;
  else if (gameState.value.proposalStage?.value < 2)
    stage.value = gameState.value.proposalStage?.value;
  else stage.value = gameState.value.currentRound?.value + 1;
}

const useGameStatus = (id?: number) => {
  const targetId = id ?? gameId.value;
  useApi({
    api: game.GameStatus(targetId),
    onSuccess: (resp) => {
      store.dispatch("gameModule/updateGameStatus", resp.data);
      handleStage();
    },
  });
};
</script>

<style scoped lang="scss">
.proposal-view-container {
  height: 100vh;
  background-color: #f4f4f4;
}

.proposal-main {
  min-width: 1400px;
  flex: 1;
}
</style>

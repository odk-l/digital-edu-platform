<template>
  <v-card class="prop-sidebar white" style="min-width: 300px">
    <div v-if="GameStatus">
      <div class="text-h6 pa-4 d-flex align-center justify-center bg-indigo-lighten-2">
        提案赛阶段
      </div>
      <v-divider></v-divider>

      <div class="pa-4">
        <div class="ma-2">游戏 ID：
          <span class="font-weight-bold">
            {{ GameStatus.id }}</span>
        </div>

        <div class="ma-2">当前总学生数：
          <span class="font-weight-bold">
          {{ GameStatus.studentCount }}</span>
        </div>

        <div class="ma-2">当前组数：
          <span class="font-weight-bold">
          {{ GameStatus.teamCount }}</span>
        </div>

        <div class="ma-2">每组基准人数：
          <span class="font-weight-bold">
          {{ GameStatus.teamMemberCount }}</span>
        </div>
      </div>

      <v-divider class="my-2" />

      <div v-if="GameStatus && GameStatus.status !== 2" class="pa-4">
        <div class="ma-2">提案阶段：
          <v-chip color="orange" text-color="white" class="mb-1">
            {{ propStage[GameStatus.proposalStage] }}
          </v-chip>
        </div>

        <div class="ma-2">提案赛轮次：
          <v-chip color="red-lighten-1" text-color="white" class="mb-1">
            第 {{ GameStatus.proposalRound }} 轮
          </v-chip>
        </div>

        <div class="ma-2" v-if="proposalTeam && GameStatus.proposalStage >= 2">本轮提案小组：
          <v-chip v-for="(v, i) of proposalTeam" density="compact" :key="i" class="ma-1">
            第 {{ v.proposerTeamId }} 组
          </v-chip>
        </div>

        <div v-if="proposalTeam?.filter((item: any) => item.isSelected).length !== 0" class="ma-2">提案中选小组：
          <v-chip v-for="(v, i) of proposalTeam.filter((item: any) => item.isSelected)"
                  color="indigo"
                  :key="i" class="ma-1"
                  @click="showOverlay = true">
            第 {{ v.proposerTeamId }} 组
          </v-chip>
        </div>
      </div>

      <div v-if="GameStatus && GameStatus.status === 2" class="pa-4">
        <div class="ma-2" v-if="proposalTeam">游戏阶段：
          <v-chip class="mb-1" color="red">已结束</v-chip>
        </div>
      </div>

      <v-divider class="my-2" />

      <div class="pa-4 text-caption text-grey">
        <div>上次保存时间：{{ GameStatus.lastSavedAt }}</div>
        <div>创建时间：{{ GameStatus.gmtCreate }}</div>
        <div>更新时间：{{ GameStatus.gmtUpdate }}</div>
      </div>
    </div>
  </v-card>
  <v-overlay v-model="showOverlay" class="align-center justify-center">
    <v-card class="pa-6" elevation="8" width="400" rounded="xl">
      <v-card-title class="text-h6 font-weight-bold mb-3">
        <v-icon start class="mr-2" color="primary">mdi-account-group</v-icon>
        提案中选小组评分信息
      </v-card-title>
      <v-divider class="mb-2" />
      <v-card-text>
        <div class="info-line"><span class="label">中选小组：</span>第 {{ winnerInfo.teamId }} 组</div>
        <div class="info-line"><span class="label">组长：</span>{{ winnerInfo.leaderName }}</div>
        <div class="info-line"><span class="label">票数：</span>{{ winnerInfo.score }} 票</div>
        <div class="info-line"><span class="label">当前轮次：</span>第 {{ winnerInfo.round }} 轮</div>

        <div v-if="winnerInfo && GameStatus?.proposalRound === 1">
          <div class="mt-4 font-weight-medium mb-2">评分分配：</div>
          <v-list density="compact" class="bg-grey-lighten-5 rounded">
            <v-list-item class="ma-0"
                         v-for="(score, index) in winnerInfo.allocations"
                         :key="index">
              第 {{ winnerInfo.team[index] }} 组：<strong>{{ score }}</strong> 分
            </v-list-item>
          </v-list>
        </div>

        <div v-if="winnerInfo && GameStatus?.proposalRound === 2">
          <div class="info-line">
          <span class="label">辩论正方：</span>
              <span>{{winnerInfo.team.slice(0, Math.floor(winnerInfo.team.length / 2)).map((item: number) => `第 ${item} 组`).join('，')}}</span>
          </div>

          <div class="info-line">
            <span class="label">辩论反方：</span>
            <span>{{winnerInfo.team.slice(Math.floor(winnerInfo.team.length / 2)).map((item: number) => `第 ${item} 组`).join('，')}}</span>
          </div>
        </div>

        <div v-if="winnerInfo && GameStatus?.proposalRound === 3">
          <div class="info-line">
          <span class="label">参与游戏小组：</span>
              <span>{{winnerInfo.team.map((item: number) => `第 ${item} 组`).join('，')}}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
import { ref, watch,computed} from 'vue'
import {ApiMap} from '@/api/type'
import {useApi} from "@/api/handler";
import { proposal } from "@/api";
import {useStore} from "vuex"

const store = useStore()
const GameStatus = computed(() => store.getters["gameModule/gameStatus"]);
const gameState = computed(() => store.getters["gameModule/gameState"]);
const propStage = ['初始化提案积分', '选择提案提出轮次', '每轮提出提案', '投票', '正式游戏']
const proposalTeam = ref<ApiMap['/proposal/list']['resp']>([])
const showOverlay = ref<boolean>(false)
const winnerInfo = ref<ApiMap['/proposal/selected/:game/:round']['resp'] | null>(null)

const useProposalList = () => {
  if (!GameStatus.value) return
  if (GameStatus.value.proposalRound === 0) return
  useApi({
    api: proposal.ProposalList(GameStatus.value.id, GameStatus.value.proposalRound),
    onSuccess: resp => {
      proposalTeam.value = resp.data as ApiMap['/proposal/list']['resp']
    }
  })
}

const useWinProposal = () => {
  if (!GameStatus.value) return
  useApi({
    api: proposal.WinProposal(GameStatus.value.id, GameStatus.value.proposalRound),
    onSuccess: resp => {
      winnerInfo.value = resp.data as ApiMap['/proposal/selected/:game/:round']['resp']
    }
  })
}

watch(() => GameStatus.value, newVal => {
  if (!GameStatus.value) return
  if (GameStatus.value?.status === 2) return
  useProposalList()
  if (GameStatus.value.proposalStage === 4) useWinProposal()
}, {immediate: true})
</script>

<style scoped lang="scss">
.prop-sidebar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 320px;
  background-color: #fff;
}

.info-line {
  margin-bottom: 8px;
  display: flex;
}
.label {
  width: 120px;
  font-weight: bold;
  color: #555;
}
</style>


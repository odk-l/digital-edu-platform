<template>
  <div class="team-order-view d-flex">
    <div class="select-box">
      <v-tabs
          v-model="tabValue"
          color="deep-purple-accent-4"
          class="ml-6"
          height="60px"
      >
        <v-tab :value="1">第一轮</v-tab>
        <v-tab :value="2">第二轮</v-tab>
        <v-tab :value="3">第三轮</v-tab>
      </v-tabs>
      <v-tabs-window v-model="tabValue">
        <v-tabs-window-item :value="num" class="my-6 mx-8" v-for="num of [1, 2, 3]" :key="num">
          <v-card height="480" style="overflow-y: auto">
            <div class="d-flex justify-center pa-4 bg-blue-lighten-1">第 {{num}} 轮共 {{GetMaxSelected(num)}} 组,
              还可选择 {{GetMaxSelected(num)-selectedTeam[num - 1].filter((item: any) => item.check).length}} 组
            </div>
            <v-data-table
                hide-default-footer
                :items="selectedTeam[num - 1]"
                item-value="teamId"
                :headers="headers"
                v-model:items-per-page="pageSize"
            >
              <!-- eslint-disable-next-line vue/valid-v-slot -->
              <template v-slot:item.check="{ item }">
                <v-checkbox-btn
                    :disabled="selectedTeam[num - 1].filter((item: any) => item.check).length >= GetMaxSelected(num)"
                    v-model="item.check"
                    :ripple="false"
                ></v-checkbox-btn>
              </template>
            </v-data-table>
          </v-card>
          <v-btn class="mt-6" color="red-lighten-2" block @click="selectedTeam[num - 1].forEach((item: any) => item.check = false)">重置</v-btn>
          <v-btn class="mt-3" color="primary" block @click="useSubmitOrder">提交</v-btn>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
    <div class="tile-rank">
      <InitDelete max-height="700" class="ma-4" :data="GameStatus" @update="emits('update')"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch, defineEmits,computed} from "vue";
import {useApi} from "@/api/handler";
import {game, proposal} from "@/api";
import {ApiMap} from "@/api/type";
import {splitThree} from "@/utils/random";
import InitDelete from "@/components/proposal/init/InitDelete.vue";
import { useStore } from "vuex";

const store = useStore()
const emits = defineEmits(['update'])
const GameStatus = computed(() => store.getters["gameModule/gameStatus"]);
const tabValue = ref<number>(1)
const tileRank = ref<ApiMap['/game/rank/team/:id']['resp']>([])
const selectedTeam = ref<Array<Array<{teamId: string, teamLeader: string, check: boolean}>>>([[], [], []])
const removedList = ref<Array<number>>([])
const pageSize = ref<number>(100)

const headers = [
  {title: '组号', value: 'teamId', align: 'center'},
  {title: '组长', value: 'teamLeader', align: 'center'},
  {title: '选择', value: 'check'}
]

function GetMaxSelected(num: number) {
  if (!GameStatus.value) return 0
  return splitThree(GameStatus.value.teamCount - removedList.value.length)[num - 1]
}

const useTileRank = () => {
  if (!GameStatus.value) return
  useApi({
    api: game.TileRank(GameStatus.value.id),
    onSuccess: resp => {
      tileRank.value = (resp.data as ApiMap['/game/rank/team/:id']['resp'])
          .filter(item => !removedList.value.includes(item.teamId))
      selectedTeam.value[0] = tileRank.value
          .sort((a, b) => a.teamId - b.teamId)
          .map((item: any) => ({teamId: `第 ${item.teamId} 组`, teamLeader: item.leaderName, check: false}))
      selectedTeam.value[1] = tileRank.value
          .sort((a, b) => a.teamId - b.teamId)
          .map((item: any) => ({teamId: `第 ${item.teamId} 组`, teamLeader: item.leaderName, check: false}))
      selectedTeam.value[2] = tileRank.value
          .sort((a, b) => a.teamId - b.teamId)
          .map((item: any) => ({teamId: `第 ${item.teamId} 组`, teamLeader: item.leaderName, check: false}))
    }
  })
}

const useSubmitOrder = () => {
  if (!GameStatus.value) return
  useApi({
    api: proposal.SubmitOrder({
      gameId: GameStatus.value?.id,
      roundTeamIds: selectedTeam.value.map(
              item => item
                  .filter(i => i.check)
                  .map(n => +n.teamId.replace('第', '').replace('组', '').trim())
          )
    }),
    onSuccess: () => {emits('update')},
    tip: '上传成功'
  })
}

const useRemovedList = () => {
  if (!GameStatus.value) return
  useApi({
    api: game.RemoveList(GameStatus.value.id),
    onSuccess: resp => {
      removedList.value = resp.data as Array<number>
      useTileRank()
    }
  })
}

watch(() => GameStatus?.value, () => {
  useTileRank()
  useRemovedList()
}, {immediate: true})
</script>

<style scoped lang="scss">
.select-box {
  overflow-y: auto;
  max-height: 700px;
  flex: 1;
  min-width: 500px;
}
.tile-rank {
  flex: 2;
  height: 700px;
}
</style>

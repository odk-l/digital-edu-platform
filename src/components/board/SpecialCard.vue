<template>
  <v-card class="my-4" height="220px">
    <div class="text-h6 px-4 py-2 bg-indigo-lighten-2">各组待办事项</div>
    <div v-if="!eventData" class="d-flex justify-center mt-12 text-h6">结算阶段展示</div>
    <div v-if="eventData && eventData.length === 0" class="d-flex justify-center mt-12 text-h6" >暂无待办事项</div>
      <v-list v-if="eventData && eventData.length > 0" class="pa-2 overflow-y-auto" height="180px">
        <v-list-item
            class="d-flex"
            v-for="(team, idx) of eventData"
            :key="team.teamId"
        >
              第 {{ team.teamId }} 组：
              <v-chip
                  v-for="(e, subIdx) of team.unTriggeredTiles"
                  :color="e.tileType === 1 ? 'orange' : 'blue'"
                  :key="subIdx"
                  class="mr-2"
                  @click="handleClick(idx, subIdx)"
              >
                {{ e.eventName }}
              </v-chip>
        </v-list-item>
      </v-list>
  </v-card>
  <v-overlay v-model="submitObject.showOverlay"
             class="align-center justify-center">
    <DynamicForm v-if="submitObject.type === 1" :headers="['小组号', '参加队伍二', '参加队伍三', '获胜方编号', 'ID', '事件类型']"
                 :excluded-keys="['Type', 'tileId']"
                 :model="submitObject.data"
                 @submit="useSubmitBlindBox"
                 @close="submitObject.showOverlay = false"/>
    <DynamicForm v-if="submitObject.type === 2" :headers="['进攻方', '防守方', '获胜方编号', '事件类型', 'ID' ]"
                 :excluded-keys="['Type', 'tileId']"
                 :model="submitObject.data"
                 @submit="useSubmitFortress"
                 @close="submitObject.showOverlay = false"/>
  </v-overlay>
</template>

<script setup lang="ts">
import { defineEmits, onMounted, reactive, ref, watch, computed } from 'vue'
import {useApi} from "@/api/handler";
import {ApiMap} from "@/api/type";
import {game} from "@/api";
import DynamicForm from "@/components/DynamicForm.vue";
import { useStore } from "vuex";

const store=useStore()
const emits = defineEmits(['update'])

const GameStatus = computed(() => store.getters["gameModule/gameStatus"])
const gameState = computed(() => store.getters["gameModule/gameState"])
const eventData = ref<ApiMap['/game/special/list']['resp'] | null>(null)

const submitObject = reactive({
  type: 0,
  showOverlay: false,
  data: {}
})

watch(() => GameStatus.value, newVal => {
  if(newVal) useSpecialList()
})

onMounted(() => {
  useSpecialList()
})

function handleClick(index: number, subIndex: number) {
  if (!eventData.value) return
  submitObject.type = eventData.value[index].unTriggeredTiles[subIndex].tileType
  submitObject.data = (eventData.value[index].unTriggeredTiles[subIndex].tileType === 1 ? {
    teamId: eventData.value[index].teamId,
    involvedTeamOne: 0,
    involvedTeamTwo: 0,
    winnerTeamId: 0,
    tileId: eventData.value[index].unTriggeredTiles[subIndex].tileId,
    eventType: eventData.value[index].unTriggeredTiles[subIndex].eventType
  } : {
    attackerTeamId: eventData.value[index].teamId,
    defenderTeamId: 0,
    winnerTeamId: 0,
    gameType: eventData.value[index].unTriggeredTiles[subIndex].eventType,
    tileId: eventData.value[index].unTriggeredTiles[subIndex].tileId
  })
  submitObject.showOverlay = true
}

const useSpecialList = () => {
  if (!GameStatus.value) return
  if (!gameState.value.isSettlement?.value) return
  useApi({
    api: game.SpecialList(GameStatus.value.id),
    onSuccess: resp => {
      eventData.value = resp.data as ApiMap['/game/special/list']['resp']
    }
  })
}

const useSubmitBlindBox = (data: unknown) => {
  const transData = data as {
    teamId: number
    involvedTeamOne: number
    involvedTeamTwo: number
    winnerTeamId: number
    tileId: number
    eventType: number
  }
  useApi({
    api: game.SubmitBlindBox({
      teamId: transData.teamId,
      winnerTeamId: Number(transData.winnerTeamId),
      eventType: transData.eventType,
      tileId: transData.tileId,
      gameId: GameStatus.value.id,
      involvedTeamIds: [Number(transData.teamId),Number(transData.involvedTeamOne), Number(transData.involvedTeamTwo)]
    }),
    onSuccess: () => {emits('update'); submitObject.showOverlay = false},
    tip: '上传成功'
  })
}

const useSubmitFortress = (data: unknown) => {
  const transData = data as {
    attackerTeamId: number,
    defenderTeamId: number,
    winnerTeamId: number,
    gameType: number,
    tileId: number
  }
  useApi({
    api: game.SubmitFortress({
      attackerTeamId: Number(transData.attackerTeamId),
      defenderTeamId: Number(transData.defenderTeamId),
      winnerTeamId: Number(transData.winnerTeamId),
      gameType: transData.gameType, tileId: transData.tileId, gameId: GameStatus.value.id}),
    onSuccess: () => {emits('update')},
    Finally: () => {submitObject.showOverlay = false},
    tip: '上传成功'
  })
}
</script>

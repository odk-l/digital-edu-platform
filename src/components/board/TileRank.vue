<template>
  <v-card rounded :max-height="maxHeight ?? 400">
    <div class="text-lg-h6 px-4 py-2 bg-indigo-lighten-2 d-flex justify-space-between align-center">
      <span>{{ computedMode ? '占领格子数排行榜' : '个人积分排行榜' }}</span>
      <v-btn size="small" @click="internalMode = !internalMode" class="text-caption" color="white" variant="tonal"
        v-if="!isLocked && showChange">
        切换
      </v-btn>
    </div>

    <!-- 团队排行榜 -->
    <div v-if="computedMode && tileRank" class="ml-2" :style="`overflow-y: auto; height: ${maxHeight - 50}px`">
      <v-table density="compact" class="rounded">
        <thead>
          <tr>
            <th>排名</th>
            <th>组号</th>
            <th>组长</th>
            <th>格子数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in sortedTeamData" :key="item.teamId"
            @click="emits('click', { mode: 'team', item, index })" style="cursor: pointer">
            <td>
              <v-chip v-if="index < 3" :color="rankColors[index]" text-color="white" density="compact" small label
                class="font-weight-bold">
                第 {{ index + 1 }} 名
              </v-chip>
              <span class="ml-3" v-else>第 {{ index + 1 }} 名</span>
            </td>
            <td>第 {{ item.teamId }} 组</td>
            <td>{{ item.leaderName }}</td>
            <td>{{ item.totalTile }}</td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <!-- 学生排行榜 -->
    <div v-if="!computedMode && individualRank" class="ml-2" :style="`overflow-y: auto; height: ${maxHeight - 50}px`">
      <v-table density="compact" class="rounded">
        <thead>
          <tr>
            <th>排名</th>
            <th>姓名</th>
            <th>学号</th>
            <th>组号</th>
            <th>得分</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in sortedIndividualData" :key="item.studentId" @click="handleRowClick(item, index)"
            style="cursor: pointer">
            <td>
              <v-chip v-if="index < 3" :color="rankColors[index]" text-color="white" density="compact" small label
                class="font-weight-bold">
                第 {{ index + 1 }} 名
              </v-chip>
              <span class="ml-3" v-else>第 {{ index + 1 }} 名</span>
            </td>
            <td>{{ item.studentName }}</td>
            <td>{{ item.memberSno }}</td>
            <td>第 {{ item.teamId }} 组</td>
            <td>{{ item.individualScore }}</td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </v-card>
  <v-overlay v-model="submitObject.showOverlay" class="align-center justify-center">
    <DynamicForm :model="submitObject.data" title="请输入个人积分变更" :headers="['', '', '', '', '个人分数变更', '评论']"
      :excluded-keys="['type', 'stage', 'id', 'gameId']" @submit="useSubmitScoreEditor"
      @close="submitObject.showOverlay = false" />
  </v-overlay>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, onMounted, watch, reactive,defineProps} from 'vue'
import { ApiMap } from '@/api/type'
import { game } from '@/api'
import { useApi } from '@/api/handler'
import DynamicForm from '../DynamicForm.vue'
import {useStore} from 'vuex'

const props = defineProps<{
  maxHeight?: number
  showChange?: boolean
  mode?: 'team' | 'student'
  enableEdit: boolean
}>()

const store = useStore()
const enableEdit = computed(() => props.enableEdit ?? true)

const emits = defineEmits<{
  (e: 'click', payload: { mode: 'team' | 'student', item: any, index: number }): void
}>()

const internalMode = ref(true) // 默认展示 team
const isLocked = computed(() => props.mode !== undefined)
const computedMode = computed(() =>
  props.mode === 'team' ? true :
    props.mode === 'student' ? false :
      internalMode.value
)

const tileRank = ref<ApiMap['/game/rank/team/:id']['resp']>([])
const individualRank = ref<ApiMap['/game/rank/student/:id']['resp']>([])
const GameStatus = computed(()=>store.getters["gameModule/gameStatus"])

const rankColors = ['amber darken-2', 'blue-grey lighten-1', 'deep-orange lighten-1']

const sortedTeamData = computed(() =>
  [...tileRank.value].sort((a, b) =>
    b.totalTile !== a.totalTile ? b.totalTile - a.totalTile : b.totalScore - a.totalScore
  )
)

const sortedIndividualData = computed(() =>
  [...individualRank.value].sort((a, b) => b.individualScore - a.individualScore)
)

const submitObject = reactive<{ type: number, showOverlay: boolean, data: any }>({
  type: 2,
  showOverlay: false,
  data: {}
})

function handleRowClick(item: any, index: number) {
  emits('click', { mode: 'student', item, index })
  if (!enableEdit.value) return
  if (!GameStatus.value) return;
  submitObject.data = {
    type: submitObject.type,
    stage: 1,
    id: item.studentId,
    gameId: GameStatus.value.id,
    num: 0,
    comment: ""
  }
  submitObject.showOverlay = true
}

function useSubmitScoreEditor(data: ApiMap['/game/score/update']['req']) {
  console.log(data)
  useApi({
    api: game.SubmitScoreEditor(data),
    Finally: () => { submitObject.showOverlay = false },
    onSuccess: () => {
      submitObject.showOverlay = false
      loadRankData()
    },
    tip: '更改成功'
  })
  console.log(individualRank.value)
}

watch(() => GameStatus.value, () => {
  loadRankData()
}, { immediate: true })
watch(computedMode, () => loadRankData())

onMounted(() => loadRankData())

function loadRankData() {
  if (!GameStatus.value) return
  if (computedMode.value) {
    useApi({
      api: game.TileRank(GameStatus.value.id),
      onSuccess: resp => {
        tileRank.value = resp.data as ApiMap['/game/rank/team/:id']['resp']
      }
    })
  } else {
    useApi({
      api: game.IndividualRank(GameStatus.value.id),
      onSuccess: resp => {
        individualRank.value = resp.data as ApiMap['/game/rank/student/:id']['resp']
      }
    })
  }
}
</script>

<template>
  <v-card rounded class="mt-3" height="400px">
    <div class="pa-4 bg-blue-lighten-1 text-lg-h6">本回合答题排行榜</div>
    <div class="d-flex justify-center align-center" style="height: 350px" v-if="gameState.isUploadGrade?.value || !gradeRank">
      <FileUpload text="上传答题数据" @upload="useUploadGrade"/>
    </div>
    <div class="pa-4" ref="chartRef" style="width: 100%; height: 350px;"></div>
  </v-card>
</template>

<script setup lang="ts">
import {defineEmits, onMounted, onUnmounted, ref, computed} from 'vue'
import FileUpload from "@/components/FileUpload.vue";
import {useApi} from "@/api/handler";
import {game} from "@/api";
import * as echarts from 'echarts';
import { ApiMap } from "@/api/type";
import {useStore} from "vuex"

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null // 缓存实例

const store = useStore()
const emits = defineEmits(['update'])
const gameId = computed(() => store.getters["gameModule/gameId"]);
const gameState = computed(() => store.getters["gameModule/gameState"]);
const gradeRank = ref<ApiMap['/game/upload/chess']['resp'] | null>(null)

const useUploadGrade = (file: File) => {
  useApi({
    api: game.UploadGrade(gameId.value, file),
    onSuccess: async resp => {
      gradeRank.value = resp.data as ApiMap['/game/upload/chess']['resp']
      emits('update')
      renderChart()
    },
    tip: '成绩上传成功'
  })
}

const useGradeRank = () => {
  if ( !gameState.value.isUploadGrade?.value ) return
  useApi({
    api: game.GradeRank(gameId.value),
    onSuccess: resp => {
      gradeRank.value = resp.data as ApiMap['/game/xxt/rank/:id']['resp']
      renderChart()
    }
  })
}

onMounted(() => {
  // 初始化图表实例（只创建一次）
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
  }
  useGradeRank()
})

onUnmounted(() => {
  // 组件销毁时释放实例
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

const renderChart = () => {
  if (!chartInstance || !gradeRank.value) return;

  gradeRank.value.reverse()

  // 使用缓存的实例更新数据（这里会触发重新渲染）
  chartInstance.setOption({
    grid: {
      top: 10,
      left: 10,
      bottom: 20,
      containLabel: true
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (!gradeRank.value) return ''
        const data = gradeRank.value[params.dataIndex]
        return `
        <strong>${data.teamName}</strong><br/>
        得分：${data.thisRoundScore}<br/>
        提交时间：${data.submitTime}`
      }
    },
     xAxis: {
       type: 'value',
     },
     yAxis: {
       type: 'category',
       data: gradeRank.value.map(item => `第 ${item.teamId} 组`)
     },
     series: [{
       name: '得分',
       type: 'bar',
       data: gradeRank.value.map(item => item.thisRoundScore),
       label: {
         show: true,
         position: 'right'
       }
     }]
   })
}
</script>

<style scoped lang="scss">

</style>

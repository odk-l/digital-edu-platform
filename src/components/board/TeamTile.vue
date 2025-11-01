<template>
  <v-card class="pa-4" min-width="400">
    <div class="text-lg-h6 mb-4">分配每组可选格子数</div>

    <v-form @submit.prevent="useUploadAssign">
      <div class="mb-2" v-for="id in gradeRank.map((item: any) => item.teamId)" :key="id">
        <div class="mx-6 d-flex">
          <div class="text-subtitle-2 mt-2" style="width: 80px;">
            第 {{ id }} 组：
          </div>
          <div>
            <v-text-field
                v-model.number="form[id]"
                type="number"
                min="1"
                variant="outlined"
                density="compact"
                hide-details
            />
          </div>
        </div>
      </div>

      <div class="d-flex justify-end my-6 mr-4">
        <v-btn type="submit" color="primary">提交</v-btn>
        <v-btn @click="emits('close')" color="red-lighten-2" class="ml-2">取消</v-btn>
      </div>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import {ref, defineEmits, onMounted,computed} from 'vue'
import {game} from "@/api";
import {useApi} from "@/api/handler";
import { ApiMap } from "@/api/type";
import {useStore} from 'vuex'

const gradeRank = ref<ApiMap['/game/xxt/rank/:id']['resp']>([])

const emits = defineEmits<{
  (e: 'update'): void
  (e: 'close'): void
}>()
const store = useStore()
const gameId = computed(()=>store.getters["gameModule/gameId"])
const form = ref<Record<number, number>>({})

onMounted(() => {
  useGradeRank()
})

const useUploadAssign = () => {
  useApi({
    api: game.UploadAssign(gameId.value, form.value),
    onSuccess: () => { emits('update'); emits('close') },
    tip: '设置成功'
  })
}

const useGradeRank = () => {
  useApi({
    api: game.GradeRank(gameId.value),
    onSuccess: resp => {
      gradeRank.value = resp.data as ApiMap['/game/xxt/rank/:id']['resp']
    }
  })
}
</script>



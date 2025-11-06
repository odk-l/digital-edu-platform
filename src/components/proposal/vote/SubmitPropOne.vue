<template>
  <v-card class="pa-8" width="500">
    <div class="mb-6 text-h6">添加提案</div>
    <div class="d-flex">
      <div class="mt-1" style="width: 150px">提出提案的小组</div>
      <v-select
        disabled
        v-model="tempProposerTeamId"
        :items="list ? list : []"
        density="compact"
        :item-title="(item: any) => item.teamId ? `第 ${item.teamId} 组` : null"
        item-value="teamId"
        placeholder="请选择提出提案的小组"
        variant="outlined"
      >
      </v-select>
    </div>
    <div class="d-flex">
      <div class="mt-1" style="width: 150px">参与游戏的小组</div>
      <v-select
        v-model="tempInvolvedTeamIds"
        :items="list ? list : []"
        density="compact"
        :item-title="(item: any) => item.teamId ? `第 ${item.teamId} 组` : null"
        item-value="teamId"
        placeholder="请选择参与提案的小组"
        multiple
        variant="outlined"
      ></v-select>
    </div>
    <div class="d-flex mb-3">
      <div class="mt-1" style="width: 150px">分值分配</div>
      <v-text-field
        placeholder="请依次填入分值分配"
        v-model="tempScore"
        variant="outlined"
        density="compact"
        hint="分值之间请使用英文逗号分隔开"
      ></v-text-field>
    </div>
    <div class="d-flex justify-end">
      <v-btn class="mr-4" color="primary" @click="handleEdit">确认</v-btn>
      <v-btn color="red-lighten-2" @click="emits('close')">取消</v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { ApiMap } from "@/api/type";
import store from "@/store";

const props = defineProps<{
  team: { proposerTeamId: number };
  list: ApiMap["/team/game/:id"]["resp"]["teams"];
}>();
const emits = defineEmits<{
  (e: "submit", payload: { id: number; ids: number[]; score: number[] }): void;
  (e: "close"): void;
}>();

const tempProposerTeamId = ref<number>(props.team.proposerTeamId);
const tempInvolvedTeamIds = ref<Array<number> | null>(null);
const tempScore = ref<string>("");

function handleEdit() {
  try {
    const scoreList = tempScore.value.split(",").map(Number);
    let temp = 0;
    scoreList.forEach((score: number) => {
      temp += score;
    });
    if (
      !tempInvolvedTeamIds.value ||
      !tempProposerTeamId.value ||
      tempScore.value === ""
    ) {
      store.dispatch("snackBarModule/showError", "请正确填写数据");
      return;
    }
    if (temp !== 28) {
      store.dispatch("snackBarModule/showError", "分值之和不为28");
      return;
    }
    if (scoreList.length !== tempInvolvedTeamIds.value.length) {
      store.dispatch("snackBarModule/showError", "分值与参与小组不匹配");
      return;
    }
    emits("submit", {
      id: tempProposerTeamId.value,
      ids: tempInvolvedTeamIds.value,
      score: scoreList,
    });
    tempInvolvedTeamIds.value = null;
    tempScore.value = "";
    emits("close");
  } catch {
    store.dispatch("snackBarModule/showError", "请正确填写数据");
    return;
  }
}
</script>

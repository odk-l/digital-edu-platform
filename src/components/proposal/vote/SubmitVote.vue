<template>
  <v-card class="pa-8" width="500">
    <div class="mb-6 text-h6">为该提案投票</div>
    <div class="d-flex">
      <div class="mt-1" style="width: 150px">参与投票的小组</div>
      <v-select
        v-model="tempInvolvedTeamIds"
        :items="list ? list : []"
        density="compact"
        :item-title="(item: any) => item.teamId ? `第 ${item.teamId} 组` : null"
        item-value="teamId"
        placeholder="请选择参与投票的小组"
        multiple
        variant="outlined"
      ></v-select>
    </div>
    <div class="d-flex mb-3">
      <div class="mt-1" style="width: 150px">票数分配</div>
      <v-text-field
        placeholder="请依次填入票数分配"
        v-model="tempVoteScore"
        variant="outlined"
        density="compact"
        hint="分值之间请使用英文逗号分隔开"
      ></v-text-field>
    </div>
    <div class="d-flex justify-end">
      <v-btn class="mr-4" color="primary" @click="handleConfirm">确认</v-btn>
      <v-btn color="red-lighten-2" @click="emits('close')">取消</v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted } from "vue";
import { ApiMap } from "@/api/type";
import store from "@/store";

const props = defineProps<{
  proposerId: number;
  list: ApiMap["/team/game/:id"]["resp"]["teams"];
  votes?: { teamId: number; proposalId: number; score: number }[];
}>();
const emits = defineEmits<{
  (
    e: "submit",
    payload: { teamId: number; proposalId: number; score: number }[]
  ): void;
  (e: "close"): void;
}>();

const tempInvolvedTeamIds = ref<Array<number> | null>(null);
const tempVoteScore = ref<string>("");

function handleConfirm() {
  try {
    const voteList = tempVoteScore.value.split(",").map(Number);
    if (!tempInvolvedTeamIds.value || tempVoteScore.value === "") {
      store.dispatch("snackBarModule/showError", "请正确填写数据");
      return;
    }
    if (voteList.length !== tempInvolvedTeamIds.value.length) {
      store.dispatch("snackBarModule/showError", "分值与参与小组不匹配");
      return;
    }
    console.log("提交表单", tempInvolvedTeamIds.value);
    emits(
      "submit",
      tempInvolvedTeamIds.value.map((value, index) => ({
        teamId: value,
        proposalId: props.proposerId,
        score: voteList[index],
      }))
    );
    emits("close");
  } catch {
    store.dispatch("snackBarModule/showError", "请正确填写数据");
    return;
  }
}

onMounted(() => {
  console.log(props.votes);
  if (!props.votes) return;
  tempInvolvedTeamIds.value = props.votes.map((item) => item.teamId);
  tempVoteScore.value = props.votes.map((item) => item.score).join(",");
});
</script>

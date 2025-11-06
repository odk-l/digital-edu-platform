<template>
  <div class="knockout-container">
    <div class="py-6 px-8 d-flex justify-space-between">
      <div class="text-h5 text-indigo-lighten-2">第一轮提案 淘汰赛</div>
      <div class="d-flex">
        <FileUpload @upload="useFirstUpload" />
        <v-btn class="ml-4" color="red-lighten-2" @click="useKnockoutTeam"
          >淘汰选中</v-btn
        >
      </div>
    </div>
    <v-card class="mx-4" style="overflow-y: auto">
      <div class="py-4 d-flex text-h6 justify-center bg-indigo-lighten-2">
        学习通答题情况
      </div>
      <v-data-table
        :items="gradeList ?? []"
        height="600"
        :headers="headers"
        show-select
        item-value="teamId"
        hide-default-footer
        v-model="selectedTeam"
        v-model:items-per-page="pageSize"
        no-data-text="请先传入学习通数据"
      >
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template v-slot:item.status="{ value }">
          <v-chip :color="colorMap[value + 1]">{{
            statusMap[value + 1]
          }}</v-chip>
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template v-slot:item.teamId="{ value }">
          <div>第 {{ value }} 组</div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ApiMap } from "@/api/type";
import { defineEmits, ref, computed } from "vue";
import { useApi } from "@/api/handler";
import { proposal } from "@/api";
import FileUpload from "@/components/FileUpload.vue";
import { useStore } from "vuex";

const store = useStore();
const emits = defineEmits(["update"]);
const GameStatus = computed(() => store.getters["gameModule/gameStatus"]);
const gameState = computed(() => store.getters["gameModule/gameState"]);
const gradeList = ref<ApiMap["/proposal/upload/first/xxt"]["resp"] | null>(
  null
);
const selectedTeam = ref<Array<number>>([]);
const headers = [
  { title: "组号", value: "teamId" },
  { title: "组长", value: "teamName" },
  { title: "本回合分数", value: "thisRoundScore" },
  { title: "提交时间", value: "submitTime" },
  { title: "淘汰", value: "status" },
];
const statusMap = ["未参赛", "已淘汰", "未淘汰"];
const colorMap = ["", "red", "green"];
const pageSize = ref<number>(100);

const useFirstUpload = (file: File) => {
  useApi({
    api: proposal.FirstUploadGrade(GameStatus.value!.id, file),
    onSuccess: (resp) => {
      gradeList.value =
        resp.data as ApiMap["/proposal/upload/first/xxt"]["resp"];
      emits("update");
    },
    tip: "上传成功",
  });
};

const useKnockoutTeam = () => {
  useApi({
    api: proposal.KnockoutTeam(GameStatus.value!.id, selectedTeam.value),
    onSuccess: (resp) => {
      if (!gradeList.value) return;
      gradeList.value.forEach((v, i) => {
        if (selectedTeam.value.includes(v.teamId)) v.status = 0;
      });
      selectedTeam.value = [];
      emits("update");
    },
    tip: "淘汰成功",
  });
};
</script>

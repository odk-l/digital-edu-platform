<template>
  <div class="new-game-view d-flex">
    <div class="pa-6 new-game-form">
      <div class="text-h5 font-weight-bold text-indigo-lighten-2 ml-6 mb-8">
        新增游戏设置
      </div>
      <div class="d-flex form-row class-setting">
        <div class="px-8 mt-1 text-label">班级</div>
        <v-select
          v-model="selectedClass"
          :items="classList ? classList.list : []"
          density="compact"
          item-title="classCode"
          item-value="id"
          placeholder="请选择班级"
          variant="outlined"
        ></v-select>
      </div>
      <div class="d-flex form-row team-file-setting">
        <div class="px-8 mt-1 text-label">分组情况文件</div>
        <div>
          <v-file-input
            :min="0"
            variant="outlined"
            v-model="teamFile"
            label="点击上传 Excel"
            prepend-icon=""
            density="compact"
            width="320"
            show-size
          >
            <template #append>
              <v-tooltip text="下载模板文件" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    icon="mdi-download"
                    style="cursor: pointer"
                    @click="showOverlay = true"
                  />
                </template>
              </v-tooltip>
            </template>
          </v-file-input>
        </div>
      </div>
      <div class="d-flex form-row team-total-setting">
        <div class="px-8 mt-1 text-label">小组数量</div>
        <v-number-input
          :min="0"
          v-model="teamNum"
          density="compact"
          placeholder="请输入小组数量"
          variant="outlined"
        ></v-number-input>
      </div>
      <div class="d-flex form-row team-num-setting">
        <div class="px-8 mt-1 text-label">学生总数</div>
        <v-number-input
          :min="0"
          v-model="studentNum"
          density="compact"
          placeholder="请输入学生总数"
          variant="outlined"
        ></v-number-input>
      </div>
      <div class="d-flex form-row team-num-setting">
        <div class="px-8 mt-1 text-label">每组基准数</div>
        <v-number-input
          :min="0"
          v-model="teamBaseNum"
          density="compact"
          placeholder="请输入基准数"
          variant="outlined"
        ></v-number-input>
      </div>
      <div class="ml-6 mt-4">
        <v-btn
          block
          color="blue-lighten-1"
          height="40px"
          @click="showDialog = true"
          >提交</v-btn
        >
        <v-btn
          block
          color="red-lighten-2"
          height="40px"
          class="mt-6"
          v-if="showGameStart"
          @click="showDialog = true"
          >确认无误？点此开始游戏</v-btn
        >
      </div>
    </div>
    <v-overlay v-model="showOverlay" class="align-center justify-center">
      <DownloadBox
        @download="handleDownload"
        @cancel="showOverlay = false"
      ></DownloadBox>
    </v-overlay>
    <v-dialog v-model="showDialog" width="auto"
      >>
      <ConfirmDialog
        v-if="!showGameStart"
        title="确认提交"
        text="请再次检查Excel表格中学生是否和班级学生匹配"
        :loading="buttonLoading"
        @confirm="handleUpload"
        @cancel="showDialog = false"
      />
      <ConfirmDialog
        v-if="showGameStart"
        title="确认开始游戏"
        text="请再次检查学生分组情况是否正确，一旦开始游戏将无法更改分组"
        @confirm="handleGameStart"
        @cancel="showDialog = false"
      />
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, defineProps, watch, defineEmits } from "vue";
import { ApiMap } from "@/api/type";
import { useApi } from "@/api/handler";
import { classes, game, team } from "@/api";
import DownloadBox from "@/components/game/DownloadBox.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import store from "@/store";
import { useRouter } from "vue-router";

const props = defineProps<{
  cid?: number;
}>();

const emits = defineEmits(["updateTeamList"]);
const routers = useRouter();

const classList = ref<ApiMap["/class/list"]["resp"] | null>(null);
const selectedClass = ref<number | null>(null);
const showOverlay = ref<boolean>(false);
const showDialog = ref<boolean>(false);
const teamFile = ref<File | null>(null);
const teamNum = ref<number | null>(null);
const studentNum = ref<number | null>(null);
const teamBaseNum = ref<number | null>(null);
const buttonLoading = ref<boolean>(false);
const showGameStart = ref<boolean>(false);
const gameId = ref<number | null>(null);

onMounted(() => {
  useClassList();
});

watch(
  () => props.cid,
  (newCid) => {
    if (newCid) selectedClass.value = newCid;
  },
  { immediate: true }
);

function handleDownload(num: number) {
  useDownloadTeamFile(num);
  showOverlay.value = false;
}

function handleGameStart() {
  if (!gameId.value) {
    store.dispatch("snackBarModule/showError", "游戏数据有误，请正确填写");
    return;
  } else {
    // 新游戏默认从棋盘赛开始
    console.log("🆕 新游戏开始，跳转到棋盘赛");
    routers.push({ path: "/board", query: { id: gameId.value } });
  }
}

function handleUpload() {
  if (
    teamFile.value &&
    teamNum.value &&
    studentNum.value &&
    teamBaseNum.value
  ) {
    buttonLoading.value = true;
    useUploadTeam();
  } else {
    store.dispatch("snackBarModule/showError", "请正确填写数据");
  }
}

const useClassList = () => {
  useApi({
    api: classes.ClassList(0, 50, ""),
    onSuccess: (resp) => {
      classList.value = resp.data as ApiMap["/class/list"]["resp"];
    },
  });
};

const useDownloadTeamFile = (num: number) => {
  team.DownloadTeamFile(num).then((resp) => {
    const url = URL.createObjectURL(resp.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "分组文件模板.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};

const useUploadTeam = () => {
  if (
    !teamFile.value ||
    !teamNum.value ||
    !studentNum.value ||
    !teamBaseNum.value
  )
    return;
  useApi({
    api: game.UploadTeam(
      teamFile.value,
      teamNum.value,
      studentNum.value,
      teamBaseNum.value,
      props.cid ?? 0
    ),
    onSuccess: (resp) => {
      buttonLoading.value = false;
      gameId.value = (resp.data as ApiMap["/game/upload"]["resp"]).gameId;
      emits("updateTeamList", gameId.value);
      showGameStart.value = true;
    },
    Finally: () => {
      showDialog.value = false;
    },
    tip: "上传成功",
  });
};
</script>

<style lang="scss" scoped>
.text-label {
  font-size: 18px;
  min-width: 180px;
}

.new-game-form {
  min-width: 550px;
}

.form-row {
  margin-top: 10px;
}
</style>
